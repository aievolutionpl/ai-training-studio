// Type fitting for the PowerPoint renderer. Re-exports the shared tokens in public/palette.mjs.
import fs from "node:fs";

const metrics = JSON.parse(
  fs.readFileSync(new URL("./font-metrics.json", import.meta.url), "utf8"),
);

export * from "./public/palette.mjs";

const metricTable = (font, bold) =>
  metrics[font + Number(!!bold)] ||
  metrics[(font || "").replace(/ (Display|Light)$/, "") + Number(!!bold)] ||
  metrics["Segoe UI" + Number(!!bold)] ||
  metrics["Segoe UI0"];

/** Approximate rendered width of a string in inches. */
export function measure(value, size, font, bold) {
  const table = metricTable(font, bold),
    mono = /Consolas|Courier|Mono/i.test(font || "");
  return (
    (Array.from(String(value)).reduce((n, c) => n + (mono ? 0.6 : table[c] ?? 0.55), 0) * size) / 72
  );
}

/** Greedy wrap that respects author line breaks. */
export function wrap(value, width, size, font, bold) {
  return String(value ?? "")
    .split("\n")
    .map((paragraph) => {
      const lines = [];
      let line = "";
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        const next = line ? line + " " + word : word;
        if (line && measure(next, size, font, bold) > width * 0.96) {
          lines.push(line);
          line = word;
        } else line = next;
      }
      lines.push(line);
      return lines.join("\n");
    })
    .join("\n");
}

/**
 * Shrink the font until the wrapped text fits the box, then return text and size.
 * Keeps PowerPoint text editable instead of relying on autofit alone.
 */
export function fit(value, width, height, size, font, bold, minSize = 11) {
  let current = size,
    text = wrap(value, width, current, font, bold);
  while (current > minSize && text.split("\n").length * current * 1.22 > (height + 0.04) * 72) {
    current -= 1;
    text = wrap(value, width, current, font, bold);
  }
  const lines = text.split("\n").length;
  return { text, size: current, lines, height: (lines * current * 1.22) / 72 };
}

