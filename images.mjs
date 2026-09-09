import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
const root = path.dirname(fileURLToPath(import.meta.url));
export const profiles = {
  draft: { model: "fal-ai/flux/schnell", steps: 4, width: 1024, height: 576 },
  final: { model: "fal-ai/flux/dev", steps: 28, width: 1536, height: 864 },
};
export function imagePlan({
  prompt,
  quality = "draft",
  provider = "codex",
  style = "",
}) {
  if (!["codex", "fal"].includes(provider))
    throw Error("Nieznany dostawca obrazów.");
  if (!Object.hasOwn(profiles, quality))
    throw Error("Nieznany profil jakości.");
  if (
    typeof prompt !== "string" ||
    prompt.trim().length < 8 ||
    prompt.length > 3000
  )
    throw Error("Opis obrazu: 8–3000 znaków.");
  const p = profiles[quality];
  const full = `Presentation illustration. ${prompt.trim()}. Visual direction: ${String(style).slice(0, 300)}. Wide 16:9 composition, clean negative space on left for editable headline. No text, no lettering, no watermark. No charts or numbers baked into image.`;
  return {
    provider,
    quality,
    prompt: full,
    ...p,
    id: createHash("sha256")
      .update(JSON.stringify({ provider, quality, full, p }))
      .digest("hex"),
  };
}
export async function importImage(bytes, id) {
  if (!/^[a-f0-9]{64}$/.test(id))
    throw Error("Nieprawidłowy identyfikator obrazu.");
  if (bytes.length > 12 * 1024 * 1024 || bytes.length < 8)
    throw Error("Obraz musi mieć mniej niż 12 MB.");
  const png = bytes
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (!png && !jpg) throw Error("Obsługiwane pliki: PNG i JPEG.");
  const dir = path.join(root, "public", "assets", "generated");
  await fs.mkdir(dir, { recursive: true });
  const name = id + (png ? ".png" : ".jpg");
  await fs.writeFile(path.join(dir, name), bytes);
  return { asset: "generated/" + name, url: "/assets/generated/" + name };
}
const pending = new Map();
let spent = 0;
export async function createImage(
  request,
  { key = process.env.FAL_KEY, fetcher = fetch } = {},
) {
  const plan = imagePlan(request);
  if (plan.provider === "codex")
    return {
      status: "needs_codex_imagegen",
      plan,
      instructions:
        "Użyj wbudowanego imagegen w rozmowie Codex z plan.prompt. Zaimportuj wynik przez node image-import.mjs PATH ID. Aplikacja webowa nie ma bezpośredniego dostępu do imagegen.",
    };
  for (const ext of ["png", "jpg"]) {
    const asset = "generated/" + plan.id + "." + ext;
    try {
      await fs.access(path.join(root, "public", "assets", asset));
      return { status: "done", cached: true, asset, url: "/assets/" + asset };
    } catch {}
  }
  if (pending.has(plan.id)) return pending.get(plan.id);
  if (!key)
    throw Error(
      "Brak FAL_KEY. Ustaw klucz w środowisku serwera i uruchom Studio ponownie.",
    );
  const limit = Number(process.env.FAL_MAX_IMAGES || 6);
  if (!Number.isInteger(limit) || limit < 1 || spent >= limit)
    throw Error(
      "Osiągnięto limit obrazów fal.ai dla tego uruchomienia Studio.",
    );
  spent++;
  const job = (async () => {
    const r = await fetcher("https://fal.run/" + plan.model, {
      method: "POST",
      headers: {
        Authorization: "Key " + key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: plan.prompt,
        image_size: { width: plan.width, height: plan.height },
        num_inference_steps: plan.steps,
        num_images: 1,
        enable_safety_checker: true,
        output_format: "png",
      }),
      signal: AbortSignal.timeout(180000),
    });
    if (!r.ok)
      throw Error(
        "fal.ai: HTTP " + r.status + ". Nie ponowiono płatnego żądania.",
      );
    const result = await r.json();
    const remote = new URL(result.images?.[0]?.url);
    if (remote.protocol !== "https:") throw Error("Nieprawidłowy URL obrazu.");
    const file = await fetcher(remote, { signal: AbortSignal.timeout(60000) });
    if (!file.ok) throw Error("Nie udało się pobrać wyniku.");
    if (Number(file.headers.get("content-length")) > 12 * 1024 * 1024)
      throw Error("Wynik przekracza limit.");
    const bytes = Buffer.from(await file.arrayBuffer());
    return {
      status: "done",
      cached: false,
      ...(await importImage(bytes, plan.id)),
    };
  })();
  pending.set(plan.id, job);
  try {
    return await job;
  } finally {
    pending.delete(plan.id);
  }
}
