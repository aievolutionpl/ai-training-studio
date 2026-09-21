// HTML preview of a slide. Mirrors layouts.mjs so the browser shows what the PPTX will contain.
import { palette, splitPoint, semanticIcon } from "/palette.mjs";

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const KICKERS = {
  exercise: "ćwiczenie · praca w parach",
  process: "krok po kroku",
  timeline: "oś czasu",
  comparison: "porównanie",
  statement: "kluczowa myśl",
  evidence: "dowód z praktyki",
  case: "studium przypadku",
  decision: "jak zdecydować",
  matrix: "zestawienie",
  anatomy: "elementy składowe",
  image: "obraz i wnioski",
  cover: "szkolenie dla firm",
};
const icon = (name) => `<img class="ps-icon" src="/icons/${esc(name)}.svg" alt="">`;
const badge = (value) => `<span class="ps-badge">${icon(semanticIcon(value))}</span>`;
const lead = (value) => splitPoint(value)[0];
const detail = (value) => splitPoint(value)[1];
const parts = (value) => splitPoint(value);

function body(slide, layout, points) {
  const rows = (extra = "") =>
    `<div class="ps-rows ${extra}">${points
      .map((v) => {
        const [a, b] = parts(v);
        return `<div class="ps-row">${badge(a)}<b>${esc(a)}</b>${b ? `<span>${esc(b)}</span>` : ""}</div>`;
      })
      .join("")}</div>`;
  if (layout === "process" || layout === "timeline")
    return `<div class="ps-steps">${points
      .map((v, i) => {
        const [a, b] = parts(v);
        return `<div class="ps-step"><i>${String(i + 1).padStart(2, "0")}</i><div class="ps-card"><b>${esc(a)}</b>${b ? `<span>${esc(b)}</span>` : ""}</div></div>`;
      })
      .join("")}</div>`;
  if (layout === "statement") {
    const [a, b] = parts(points[0] || slide.title),
      rest = (b ? [b, ...points.slice(1)] : points.slice(1)).slice(0, 2);
    return `<div class="ps-quote"><span class="ps-quote-icon">${icon("lamp")}</span><p>${esc(a)}</p></div>${rest
      .map((v) => `<div class="ps-note">${badge(v)}<span>${esc(String(v).replaceAll("::", ": "))}</span></div>`)
      .join("")}`;
  }
  if (layout === "exercise")
    return `<div class="ps-exercise"><div class="ps-timebox"><b>${slide.activityMinutes || 10}</b><span>minut pracy</span><strong>${esc(slide.exerciseLabel || "Zastosuj w praktyce")}</strong></div>${rows("ps-steps-list")}</div>`;
  if (layout === "anatomy" || layout === "matrix") return rows("ps-split");
  if (layout === "evidence" || layout === "case") {
    const [a, b] = parts(points[0] || slide.title);
    return `<div class="ps-evidence"><div class="ps-card ps-highlight"><div class="ps-row">${badge(a)}<b>${esc(a)}</b></div><p>${esc(b || a)}</p></div><div class="ps-rows">${points
      .slice(1)
      .map((v) => {
        const [c, d] = parts(v);
        return `<div class="ps-card"><div class="ps-row">${badge(c)}<b>${esc(c)}</b></div>${d ? `<span>${esc(d)}</span>` : ""}</div>`;
      })
      .join("")}</div></div>`;
  }
  if (layout === "decision") {
    const [a, b] = parts(points[0] || slide.title);
    return `<div class="ps-decision"><div class="ps-card ps-root">${esc(b ? `${a}: ${b}` : a)}</div><div class="ps-branches">${points
      .slice(1)
      .map((v) => {
        const [c, d] = parts(v);
        return `<div class="ps-card"><div class="ps-row">${badge(c)}<b>${esc(c)}</b></div>${d ? `<span>${esc(d)}</span>` : ""}</div>`;
      })
      .join("")}</div></div>`;
  }
  if (layout === "image")
    return `<div class="ps-image-layout">${slide.image ? `<img class="ps-photo" src="/assets/${esc(slide.image)}" alt="">` : '<div class="ps-photo ps-photo-empty"></div>'}${rows()}</div>`;
  return `<div class="ps-cards">${points
    .map((v, i) => {
      const [a, b] = parts(v);
      return `<div class="ps-card"><div class="ps-card-top">${badge(a)}<i>${String(i + 1).padStart(2, "0")}</i></div><b>${esc(a)}</b>${b ? `<span>${esc(b)}</span>` : ""}</div>`;
    })
    .join("")}</div>`;
}

/** Render one slide as HTML. index/total drive the numbering and the progress rail. */
export function slidePreview(style, slide, { index = 0, total = 1, deck = {} } = {}) {
  const P = palette(style),
    points = (slide.points || []).filter((v) => String(v ?? "").trim()),
    layout = slide.image && !["cover", "image", "statement"].includes(slide.layout) ? "image" : slide.layout || "cards",
    vars = `--bg:#${P.bg};--fg:#${P.fg};--accent:#${P.accent};--panel:#${P.panel};--panel-alt:#${P.panelAlt};--line:#${P.line};--muted:#${P.muted};--soft:#${P.softAccent};--on-accent:#${P.onAccent};--font:${style.font}`;
  if (layout === "cover")
    return `<div class="pslide ps-cover" data-style="${esc(style.id)}" style="${vars}">${
      style.image
        ? `<img class="ps-cover-art" src="/assets/${esc(style.image)}" alt=""><span class="ps-scrim"></span>`
        : '<div class="ps-mark"><span class="ps-ring"></span><span class="ps-dot"></span></div>'
    }<div class="ps-cover-body"><span class="ps-chip">${esc(deck.moduleId || "SZKOLENIE DLA FIRM")}</span><h3>${esc(slide.title)}</h3><span class="ps-rule"></span><p>${esc(points.map((v) => splitPoint(v).filter(Boolean).join(" — ")).join(" · "))}</p></div><div class="ps-cover-foot">AI Evolution Polska</div></div>`;
  return `<div class="pslide" data-style="${esc(style.id)}" data-layout="${esc(layout)}" style="${vars}"><span class="ps-orb"></span><div class="ps-head"><span class="ps-mark-chip">${icon(slide.icon || semanticIcon(slide.title))}</span><span class="ps-kicker">${esc(slide.kicker || KICKERS[layout] || "wiedza w praktyce")}</span><span class="ps-num">${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}</span></div><h3>${esc(slide.title)}</h3><span class="ps-rule"></span><div class="ps-body">${body(slide, layout, points)}</div><div class="ps-foot"><span class="ps-progress"><i style="width:${((index + 1) / Math.max(total, 1)) * 100}%"></i></span><span class="ps-brand">${esc([deck.moduleId, "AI EVOLUTION POLSKA"].filter(Boolean).join("  /  "))}</span>${slide.activityMinutes > 0 ? `<span class="ps-activity">${slide.activityMinutes} min pracy własnej</span>` : ""}</div></div>`;
}
export { lead, detail };
