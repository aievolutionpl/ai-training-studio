import http from "node:http";
import {moduleScene,catalog,uploadAsset,saveDraft,loadDraft,exportScene} from './visual-editor.mjs';
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { root, styles, demo, exportDeck } from "./engine.mjs";
import { review } from "./quality.mjs";
import { createImage } from "./images.mjs";
import {
  trainingPackage,
  validateTraining,
  trainerScript,
  trainingReview,
  materials,
} from "./training.mjs";
import { trainingPrompt } from "./training-prompt.mjs";
import { trainingSchema } from "./training-schema.mjs";
const jobs = new Map(),
  port = Number(process.env.PORT || 4317),
  projectRoot = path.join(root, "projects");
await fs.mkdir(projectRoot, { recursive: true });
async function body(req, limit=1000000) {
  let size = 0,
    parts = [];
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw Error("Plik jest zbyt duży.");
    parts.push(c);
  }
  return JSON.parse(Buffer.concat(parts));
}
async function persist(job) {
  await fs.writeFile(
    path.join(projectRoot, job.id, "job.json"),
    JSON.stringify(job, null, 2),
  );
}
async function generate(brief) {
  if ([...jobs.values()].some((job) => job.status === "running"))
    throw Error("Jedno szkolenie już się generuje. Poczekaj na wynik.");
  if (
    typeof brief.topic !== "string" ||
    brief.topic.trim().length < 4 ||
    brief.topic.length > 1000
  )
    throw Error("Podaj temat: 4–1000 znaków.");
  const id = randomUUID(),
    dir = path.join(projectRoot, id),
    job = {
      id,
      status: "running",
      message: "Codex: research, scenariusz, skrypty i materiały…",
    };
  await fs.mkdir(dir);
  await fs.writeFile(
    path.join(dir, "brief.json"),
    JSON.stringify(brief, null, 2),
  );
  jobs.set(id, job);
  await persist(job);
  const prompt = trainingPrompt(
    brief,
    styles.some((s) => s.id === brief.style) ? brief.style : "evolution",
    Math.min(40, Math.max(5, Math.floor(Number(brief.count) || 20))),
  );
  const executable =
    process.env.CODEX_EXECUTABLE ||
    path.join(root, "node_modules", "@openai", "codex", "bin", "codex.js");
  await fs.writeFile(
    path.join(dir, "schema.json"),
    JSON.stringify(trainingSchema),
  );
  const args = [
    "exec",
    "--ignore-user-config",
    "--skip-git-repo-check",
    "--ephemeral",
    "--sandbox",
    "read-only",
    "-c",
    'web_search="live"',
    "--output-schema",
    path.join(dir, "schema.json"),
    "--color",
    "never",
    "-o",
    path.join(dir, "result.json"),
    "-",
  ];
  const child = spawn(process.execPath, [executable, ...args], {
    cwd: dir,
    windowsHide: true,
  });
  child.stdout.resume();
  child.stderr.resume();
  child.stdin.on("error", () => {});
  child.stdin.end(prompt);
  const fail = async (message) => {
    job.status = "error";
    job.message = message;
    await persist(job);
  };
  const timer = setTimeout(() => {
    child.kill();
    void fail("Przekroczono 15 minut. Spróbuj mniejszego modułu.");
  }, 900000);
  child.on("error", () => {
    clearTimeout(timer);
    void fail("Nie udało się uruchomić Codex. Sprawdź instalację i logowanie.");
  });
  child.on("close", async (code) => {
    clearTimeout(timer);
    if (job.status === "error") return;
    try {
      if (code !== 0)
        throw Error(
          "Codex zakończył pracę z błędem. Sprawdź: npx codex login status.",
        );
      const raw = await fs.readFile(path.join(dir, "result.json"), "utf8");
      const deck = validateTraining(
        JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, "")),
      );
      if (brief.includeQuiz !== true) deck.quiz = [];
      if (
        deck.slides.some(
          (s) => !s.voiceScript?.trim() || !s.participantNotes?.trim(),
        )
      )
        throw Error(
          "Wynik nie zawiera pełnych skryptów i materiałów. Zachowano result.json do poprawy.",
        );
      await fs.writeFile(
        path.join(dir, "szkolenie.zip"),
        await trainingPackage(deck),
      );
      for (const [name, content] of Object.entries(materials(deck)))
        await fs.writeFile(path.join(dir, name), content);
      job.deck = deck;
      job.status = "done";
      job.message =
        "Pakiet zapisany: PPTX, skrypt, materiały i raport jakości. Sprawdź raport przed szkoleniem.";
      await persist(job);
    } catch (e) {
      await fail(e.message);
    }
  });
  return job;
}
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".md": "text/plain; charset=utf-8",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};
const server = http.createServer(async (req, res) => {
  try {
    if (
      !["localhost", "127.0.0.1"].includes(
        new URL("http://" + req.headers.host).hostname,
      )
    ) {
      res.writeHead(403);
      return res.end();
    }
    const url = new URL(req.url, "http://localhost");
    if (
      req.method === "POST" &&
      req.headers.origin &&
      !["http://localhost:" + port, "http://127.0.0.1:" + port].includes(
        req.headers.origin,
      )
    ) {
      res.writeHead(403);
      return res.end();
    }
    res.setHeader("X-Content-Type-Options", "nosniff");
    const json = (v) => {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify(v));
    };
    if (url.pathname === "/api/styles") return json(styles);
    if(url.pathname==='/api/editor/scene')return json(await moduleScene(url.searchParams.get('module')));
    if(url.pathname==='/api/editor/assets'&&req.method==='GET')return json(await catalog());
    if(url.pathname==='/api/editor/assets'&&req.method==='POST')return json(await uploadAsset(await body(req,12000000)));
    if(url.pathname==='/api/editor/draft'&&req.method==='GET')return json(await loadDraft(url.searchParams.get('module')));
    if(url.pathname==='/api/editor/draft'&&req.method==='POST')return json(await saveDraft(await body(req,15000000)));
    if(url.pathname==='/api/editor/export'&&req.method==='POST'){res.setHeader('Content-Type',mime['.pptx']);return res.end(await exportScene(await body(req,15000000)));}
    if(url.pathname.startsWith('/bur-download/')){
      const name=url.pathname.slice('/bur-download/'.length);
      if(!['zasoby.zip','AI_EVOLUTION_STUDIO_14_MODULOW.zip','README.md','AUDYT_2026-09-09.md','RESEARCH_2026-09-09.md'].includes(name))throw Error('Nieprawidłowy plik wydania.');
      res.setHeader('Content-Type',name.endsWith('.zip')?'application/zip':'text/plain; charset=utf-8');
      return res.end(await fs.readFile(path.join(projectRoot,'bur-2026-09-09',name)));
    }
    if(url.pathname==='/api/bur-modules'){
      const modules=[];
      for(let i=1;i<=14;i++){
        const id='M'+String(i).padStart(2,'0');
        try{await fs.access(path.join(projectRoot,'bur-2026-09-09',id,'deck.json'));}catch{continue;}
        const deck=JSON.parse(await fs.readFile(path.join(projectRoot,'bur-2026-09-09',id,'deck.json'),'utf8'));
        modules.push({id,title:deck.title,style:deck.style,minutes:deck.durationMinutes,result:deck.objectives[0]});
      }
      return json(modules);
    }
    if(url.pathname.startsWith('/bur-files/')){
      const match=url.pathname.match(/^\/bur-files\/(M(?:0[1-9]|1[0-4]))\/(deck\.json|prezentacja\.pptx|pakiet-trenera\.zip|(?:skrypt-trenera|materialy-uczestnika|cwiczenia|slownik|zrodla|plan-szkolenia)\.md|native\/Slide(?:[1-9]|1\d|20)\.PNG)$/);
      if(!match)throw Error('Nieprawidłowy plik modułu.');
      const file=path.join(projectRoot,'bur-2026-09-09',match[1],match[2]);
      res.setHeader('Content-Type',mime[path.extname(file).toLowerCase()]||'application/octet-stream');
      return res.end(await fs.readFile(file));
    }
    if (url.pathname === "/api/images/config")
      return json({
        falConfigured: Boolean(process.env.FAL_KEY),
        defaultProvider: "codex",
        limit: Number(process.env.FAL_MAX_IMAGES || 6),
      });
    if (url.pathname === "/api/images" && req.method === "POST")
      return json(await createImage(await body(req)));
    if (url.pathname === "/api/review" && req.method === "POST") {
      const d = validateTraining(await body(req)),
        r = review(d),
        t = trainingReview(d);
      return json({
        ...r,
        issues: [...r.issues, ...t.issues],
        summary: `${r.issues.length + t.issues.length} uwag · ocena struktury ${r.score}/100 · szacowany czas ${t.estimatedMinutes} min, w tym ${t.activityMinutes} min pracy własnej`,
        training: t,
      });
    }
    if (url.pathname === "/api/handout" && req.method === "POST") {
      const d = validateTraining(await body(req));
      res.setHeader("Content-Type", "text/markdown; charset=utf-8");
      return res.end(trainerScript(d));
    }
    if (url.pathname === "/api/package" && req.method === "POST") {
      res.setHeader("Content-Type", "application/zip");
      return res.end(await trainingPackage(await body(req)));
    }
    if (url.pathname === "/api/demo")
      return json(demo(url.searchParams.get("style") || "evolution"));
    if (url.pathname === "/api/export" && req.method === "POST") {
      res.setHeader("Content-Type", mime[".pptx"]);
      return res.end(await exportDeck(validateTraining(await body(req))));
    }
    if (url.pathname === "/api/generate" && req.method === "POST")
      return json(await generate(await body(req)));
    if (url.pathname.startsWith("/api/jobs/")) {
      const id = url.pathname.split("/").pop();
      if (!/^[a-f0-9-]{36}$/.test(id))
        throw Error("Nieprawidłowy identyfikator.");
      if (jobs.has(id)) return json(jobs.get(id));
      const job = JSON.parse(
        await fs.readFile(path.join(projectRoot, id, "job.json"), "utf8"),
      );
      if (job.status === "running") {
        job.status = "error";
        job.message =
          "Serwer został zrestartowany. Uruchom generowanie ponownie.";
      }
      return json(job);
    }
    const rel =
        url.pathname === "/"
          ? "index.html"
          : decodeURIComponent(url.pathname.slice(1)),
      file = path.resolve(root, "public", rel);
    if (!file.startsWith(path.resolve(root, "public") + path.sep))
      throw Error("Nieprawidłowa ścieżka.");
    const data = await fs.readFile(file);
    res.setHeader(
      "Content-Type",
      mime[path.extname(file)] || "application/octet-stream",
    );
    res.end(data);
  } catch (e) {
    res.writeHead(e.code === "ENOENT" ? 404 : 400, {
      "Content-Type": "application/json",
    });
    res.end(
      JSON.stringify({
        error:
          e.code === "ENOENT" ? "Nie znaleziono pliku lub zadania." : e.message,
      }),
    );
  }
});
server.listen(port, "127.0.0.1", () =>
  console.log(`AI Evolution Studio: http://localhost:${port}`),
);
