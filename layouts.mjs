// Native PowerPoint compositions. No rasterization of text or diagrams.
// One renderer serves every style: colours, type sizes and spacing come from design.mjs,
// so a layout that reads well in Swiss Precision also reads well in Midnight.
import path from "node:path";
import { palette, fit, splitPoint, semanticIcon } from "./design.mjs";
import { iconData } from "./icons.mjs";

const W = 13.333,
  H = 7.5,
  MARGIN = 0.72,
  CONTENT = W - MARGIN * 2,
  BODY_TOP = 2.62,
  BODY_H = 3.78;

export const genericLayouts = [
  "cover",
  "cards",
  "process",
  "statement",
  "exercise",
  "comparison",
  "image",
  "anatomy",
  "evidence",
  "timeline",
  "decision",
  "case",
  "matrix",
];

/** Layouts that place the illustration themselves. */
const IMAGE_AWARE = ["cover", "image", "statement"];

export function renderSlide(slide, pptx, s, style, opts = {}) {
  const P = palette(style),
    { root = ".", index = 0, total = 1, deck = {} } = opts,
    points = Array.isArray(s.points) ? s.points.filter((v) => String(v ?? "").trim()) : [],
    layout = s.image && !IMAGE_AWARE.includes(s.layout) ? "image" : s.layout || "cards",
    // Slides whose bullets carry a "lead:: detail" pair need taller cards than bare leads.
    detailed = points.some((v) => splitPoint(v)[1]);

  slide.background = { color: P.bg };

  const text = (value, x, y, w, h, o = {}) => {
    const font = o.font || P.bodyFont,
      bold = !!o.bold,
      size = o.size || 21,
      f = fit(value, w, h, size, font, bold, o.min || 11);
    // Only the size comes from the measurement; PowerPoint does the line breaking,
    // so the text stays one editable paragraph with natural breaks.
    slide.addText(String(value ?? ""), {
      x,
      y,
      w: w + 0.06,
      h,
      fontSize: f.size,
      fontFace: font,
      color: o.color || P.fg,
      bold,
      align: o.align || "left",
      valign: o.valign || "middle",
      margin: 0,
      lineSpacingMultiple: o.lineSpacing || 1.12,
      charSpacing: o.charSpacing || 0,
      isTextBox: true,
      breakLine: false,
      fit: "shrink",
    });
    return f;
  };
  /** Vertically centre a stack of n rows inside the body band. */
  const stack = (n, h, gap = 0.14) => BODY_TOP + Math.max(0, (BODY_H - (n * h + (n - 1) * gap)) / 2);
  /** Height a string needs at a fixed size — used to size panels to their content. */
  const heightOf = (value, w, size, bold = false, font = P.bodyFont) =>
    String(value ?? "").trim() ? fit(value, w, 9, size, font, bold, size).height : 0;
  /** Panel band: as tall as the content needs, centred, never taller than the body. */
  const band = (need, min = 2.1) => {
    const h = Math.min(BODY_H, Math.max(min, need));
    return { h, top: BODY_TOP + (BODY_H - h) / 2 };
  };
  const card = (x, y, w, h, fill = P.panel, border = P.line) =>
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w,
      h,
      rectRadius: 0.08,
      line: { color: border, width: 0.75 },
      fill: { color: fill },
    });
  const bar = (x, y, w, h, color) =>
    slide.addShape(pptx.ShapeType.rect, {
      x,
      y,
      w,
      h,
      line: { color, width: 0 },
      fill: { color },
    });
  const dot = (x, y, d, color, transparency = 0) =>
    slide.addShape(pptx.ShapeType.ellipse, {
      x,
      y,
      w: d,
      h: d,
      line: { color, transparency: 100 },
      fill: { color, transparency },
    });
  const icon = (name, x, y, size = 0.3, color = P.accent) =>
    slide.addImage({ data: iconData(name, color), x, y, w: size, h: size });
  /** Circular icon badge used to mark every bullet lead. */
  const badge = (value, x, y, d = 0.52, fill = P.softAccent, tint = P.accent) => {
    dot(x, y, d, fill);
    icon(semanticIcon(value), x + d * 0.27, y + d * 0.27, d * 0.46, tint);
  };
  const picture = (file, x, y, w, h, contain = false) =>
    slide.addImage({
      path: path.join(root, "public", "assets", file),
      x,
      y,
      w,
      h,
      sizing: { type: contain ? "contain" : "cover", w, h },
      altText: "ROUND_IMAGE",
    });

  if (layout === "cover") return cover();

  header();
  const body = { cards, process, timeline: process, comparison, statement, exercise, anatomy, matrix: anatomy, evidence, case: evidence, decision, image }[layout] || cards;
  body();
  footer();

  // ---------------------------------------------------------------- chrome
  function header() {
    dot(11.42, -0.62, 2.5, P.softAccent, 35);
    slide.addShape(pptx.ShapeType.roundRect, {
      x: MARGIN,
      y: 0.4,
      w: 0.44,
      h: 0.44,
      rectRadius: 0.08,
      line: { color: P.accent, width: 0 },
      fill: { color: P.accent },
    });
    icon(s.icon || semanticIcon(s.title), MARGIN + 0.115, 0.515, 0.21, P.onAccent);
    text((s.kicker || kicker()).toUpperCase(), MARGIN + 0.62, 0.4, 8.4, 0.44, {
      size: 11.5,
      color: P.accent,
      bold: true,
      charSpacing: 1.4,
      min: 9,
    });
    text(`${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`, W - MARGIN - 1.6, 0.4, 1.6, 0.44, {
      size: 11,
      color: P.muted,
      align: "right",
      min: 9,
    });
    const title = text(s.title, MARGIN, 1.06, CONTENT, 1.12, {
      size: layout === "statement" ? 33 : 31,
      bold: true,
      font: P.font,
      valign: "top",
      lineSpacing: 1.04,
      min: 18,
    });
    bar(MARGIN, Math.min(2.36, 1.2 + title.height), 1.1, 0.055, P.accent);
  }
  function kicker() {
    return (
      {
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
      }[layout] || "wiedza w praktyce"
    );
  }
  function footer() {
    bar(MARGIN, 6.87, CONTENT, 0.03, P.line);
    bar(MARGIN, 6.87, (CONTENT * (index + 1)) / Math.max(total, 1), 0.03, P.accent);
    text(
      [deck.moduleId, "AI EVOLUTION POLSKA"].filter(Boolean).join("  /  "),
      MARGIN,
      7.02,
      8,
      0.26,
      { size: 9.5, color: P.muted, bold: true, charSpacing: 1.2, min: 8 },
    );
    if (s.activityMinutes > 0)
      text(`${s.activityMinutes} min pracy własnej`, W - MARGIN - 3.4, 7.02, 3.4, 0.26, {
        size: 9.5,
        color: P.accent,
        align: "right",
        bold: true,
        min: 8,
      });
  }

  // --------------------------------------------------------------- layouts
  function cover() {
    if (style.image)
      slide.addImage({
        path: path.join(root, "public", "assets", style.image),
        x: 0,
        y: 0,
        w: W,
        h: H,
        sizing: { type: "cover", w: W, h: H },
      });
    else if (s.image) {
      picture(s.image, 6.95, 0, 6.39, H);
      bar(6.95, 0, 0.05, H, P.accent);
    } else {
      // Editorial cover mark: a calm panel, one ring, one solid accent, three beats.
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 7.92,
        y: 0.84,
        w: 4.7,
        h: 5.82,
        rectRadius: 0.36,
        line: { color: P.line, width: 1 },
        fill: { color: P.panel },
      });
      slide.addShape(pptx.ShapeType.ellipse, {
        x: 8.87,
        y: 1.92,
        w: 2.8,
        h: 2.8,
        line: { color: P.accent, width: 2 },
        fill: { color: P.accent, transparency: 90 },
      });
      icon("ai", 9.75, 2.8, 1.04, P.accent);
      dot(11.62, 1.34, 0.86, P.accent);
      [0, 1, 2].forEach((i) => dot(9.94 + i * 0.52, 5.36, 0.3, i ? P.line : P.accent));
      text("WIEDZA → PRAKTYKA → ZMIANA", 8.4, 5.86, 3.74, 0.4, {
        size: 11,
        color: P.muted,
        bold: true,
        align: "center",
        charSpacing: 0.8,
        min: 8,
      });
    }
    const wide = !style.image && !s.image ? 7.1 : 5.75;
    if (style.image)
      // Stepped scrim instead of a hard edge: cover art stays visible, the title stays readable.
      [
        [0, 6.2, 6],
        [6.2, 1.0, 34],
        [7.2, 0.9, 66],
      ].forEach(([x, w, transparency]) =>
        slide.addShape(pptx.ShapeType.rect, {
          x,
          y: 0,
          w,
          h: H,
          line: { color: P.bg, transparency: 100 },
          fill: { color: P.bg, transparency },
        }),
      );
    slide.addShape(pptx.ShapeType.roundRect, {
      x: MARGIN,
      y: 0.52,
      w: deck.moduleId ? 1.15 : 3.3,
      h: 0.46,
      rectRadius: 0.08,
      line: { color: P.accent, width: 0 },
      fill: { color: P.accent },
    });
    text(deck.moduleId || "SZKOLENIE DLA FIRM", MARGIN, 0.52, deck.moduleId ? 1.15 : 3.3, 0.46, {
      size: deck.moduleId ? 17 : 11.5,
      bold: true,
      color: P.onAccent,
      align: "center",
      charSpacing: deck.moduleId ? 0 : 1.2,
      min: 9,
    });
    if (deck.moduleId)
      text("WARSZTAT / AI EVOLUTION", MARGIN + 1.35, 0.52, 5, 0.46, {
        size: 11.5,
        bold: true,
        color: P.accent,
        charSpacing: 1.2,
        min: 9,
      });
    text(s.title, MARGIN, 1.55, wide, 2.95, {
      size: 46,
      bold: true,
      font: P.font,
      valign: "bottom",
      lineSpacing: 1.02,
      min: 24,
    });
    bar(MARGIN, 4.78, 1.25, 0.06, P.accent);
    if (points.length)
      text(points.map((v) => splitPoint(v).filter(Boolean).join(" — ")).join("\n"), MARGIN, 5.0, wide, 1.15, {
        size: 20,
        color: P.muted,
        valign: "top",
        min: 13,
      });
    slide.addImage({
      path: path.join(root, "public", "assets", "logo.png"),
      x: MARGIN,
      y: 6.55,
      w: 0.5,
      h: 0.39,
    });
    text(deck.audience || "AI Evolution Polska", MARGIN + 0.68, 6.55, 5, 0.39, {
      size: 11,
      color: P.muted,
      min: 9,
    });
  }

  function cards() {
    const n = Math.max(points.length, 1),
      gap = 0.28,
      w = (CONTENT - (n - 1) * gap) / n,
      inner = w - 0.56,
      leadSize = n > 2 ? 21 : 24,
      soloSize = n > 2 ? 22 : 25,
      detailSize = n > 2 ? 17 : 19,
      parts = points.map((v) => splitPoint(v)),
      need = Math.max(
        ...parts.map(([lead, detail]) =>
          detail
            ? heightOf(lead, inner, leadSize, true) + 0.2 + heightOf(detail, inner, detailSize)
            : heightOf(lead, inner, soloSize),
        ),
        0.6,
      ),
      { h, top } = band(1.02 + need + 0.45, 2.3);
    parts.forEach(([lead, detail], i) => {
      const x = MARGIN + i * (w + gap),
        fill = i % 2 ? P.panel : P.panelAlt;
      card(x, top, w, h, fill);
      bar(x, top, w, 0.055, P.accent);
      badge(lead, x + 0.28, top + 0.32, 0.56);
      text(String(i + 1).padStart(2, "0"), x + w - 0.95, top + 0.32, 0.67, 0.56, {
        size: 19,
        color: P.accent,
        bold: true,
        align: "right",
        min: 12,
      });
      if (detail) {
        const leadH = Math.max(heightOf(lead, inner, leadSize, true), 0.4);
        text(lead, x + 0.28, top + 1.02, inner, leadH, {
          size: leadSize,
          bold: true,
          valign: "top",
          min: 13,
        });
        text(detail, x + 0.28, top + 1.02 + leadH + 0.2, inner, h - (1.24 + leadH + 0.2), {
          size: detailSize,
          color: P.muted,
          valign: "top",
          min: 11,
        });
      } else
        text(lead, x + 0.28, top + 1.02, inner, h - 1.32, {
          size: soloSize,
          valign: "top",
          min: 13,
        });
    });
  }

  function process() {
    const n = Math.max(points.length, 1),
      w = CONTENT / n,
      inner = w - 0.64,
      parts = points.map((v) => splitPoint(v)),
      need = Math.max(
        ...parts.map(([lead, detail]) =>
          detail
            ? heightOf(lead, inner, 21, true) + 0.2 + heightOf(detail, inner, 17)
            : heightOf(lead, inner, 22, true),
        ),
        0.5,
      ),
      { h, top } = band(need + 0.5 + 1.15, 2.4),
      cardTop = top + 1.15,
      cardH = h - 1.15,
      railY = cardTop - 0.68;
    bar(MARGIN + w / 2, railY, CONTENT - w, 0.025, P.line);
    parts.forEach(([lead, detail], i) => {
      const x = MARGIN + i * w,
        center = x + w / 2;
      dot(center - 0.42, railY - 0.395, 0.84, i % 2 ? P.panel : P.accent);
      text(String(i + 1).padStart(2, "0"), center - 0.42, railY - 0.395, 0.84, 0.84, {
        size: 21,
        bold: true,
        color: i % 2 ? P.accent : P.onAccent,
        align: "center",
        min: 13,
      });
      card(x + 0.11, cardTop, w - 0.22, cardH, i % 2 ? P.panel : P.panelAlt);
      if (detail) {
        const leadH = Math.max(heightOf(lead, inner, 21, true), 0.4);
        text(lead, x + 0.32, cardTop + 0.22, inner, leadH, {
          size: 21,
          bold: true,
          valign: "top",
          min: 12,
        });
        text(detail, x + 0.32, cardTop + 0.32 + leadH, inner, cardH - (0.54 + leadH), {
          size: 17,
          color: P.muted,
          valign: "top",
          min: 11,
        });
      } else
        text(lead, x + 0.32, cardTop + 0.2, inner, cardH - 0.4, {
          size: 22,
          bold: true,
          valign: "middle",
          min: 12,
        });
    });
  }

  function comparison() {
    const n = points.length;
    if (n <= 2) {
      const w = CONTENT / 2 - 0.16,
        need = Math.max(
          ...points.map((v) => heightOf(splitPoint(v)[1], w - 0.68, 20)),
          0,
        ),
        { h, top } = band(need ? need + 1.7 : 1.5, 1.5);
      points.forEach((value, i) => {
        const [lead, detail] = splitPoint(value),
          x = MARGIN + i * (CONTENT / 2 + 0.16);
        card(x, top, w, h, i ? P.panel : P.panelAlt);
        bar(x, top, 0.07, h, i ? P.muted : P.accent);
        const headY = top + (detail ? 0.36 : h / 2 - 0.29);
        badge(lead, x + 0.34, headY, 0.58, i ? P.panel : P.softAccent, i ? P.muted : P.accent);
        text(lead, x + 1.06, headY, w - 1.4, 0.58, {
          size: 23,
          bold: true,
          color: i ? P.fg : P.accent,
          min: 13,
        });
        if (detail)
          text(detail, x + 0.34, top + 1.2, w - 0.68, h - 1.5, {
            size: 20,
            color: P.muted,
            valign: "top",
            min: 12,
          });
      });
    } else {
      const rows = Math.ceil(n / 2),
        h = BODY_H / rows - 0.14,
        top = BODY_TOP;
      points.forEach((value, i) => {
        const [lead, detail] = splitPoint(value),
          x = MARGIN + (i % 2) * (CONTENT / 2 + 0.16),
          y = top + Math.floor(i / 2) * (h + 0.14),
          w = CONTENT / 2 - 0.16;
        card(x, y, w, h, i % 2 ? P.panel : P.panelAlt);
        badge(lead, x + 0.26, y + (detail ? 0.28 : h / 2 - 0.25), 0.5);
        text(lead, x + 0.9, y + (detail ? 0.24 : h / 2 - 0.29), w - 1.2, 0.58, {
          size: 20,
          bold: true,
          color: P.accent,
          min: 12,
        });
        if (detail)
          text(detail, x + 0.28, y + 0.92, w - 0.56, h - 1.12, {
            size: 17,
            color: P.muted,
            valign: "top",
            min: 11,
          });
      });
    }
  }

  function statement() {
    const [lead, detail] = splitPoint(points[0] || s.title),
      w = s.image ? 7.5 : CONTENT,
      rest = (detail ? [detail, ...points.slice(1)] : points.slice(1)).slice(0, 2),
      h = rest.length ? BODY_H - rest.length * 0.62 - 0.22 : BODY_H;
    card(MARGIN, BODY_TOP, w, h, P.panelAlt);
    bar(MARGIN, BODY_TOP, 0.08, h, P.accent);
    icon("lamp", MARGIN + 0.42, BODY_TOP + 0.36, 0.44, P.accent);
    text(lead, MARGIN + 0.42, BODY_TOP + 0.98, w - 0.9, h - 1.3, {
      size: 32,
      bold: true,
      font: P.font,
      color: P.accent,
      valign: "middle",
      lineSpacing: 1.1,
      min: 16,
    });
    if (s.image) picture(s.image, MARGIN + w + 0.3, BODY_TOP, CONTENT - w - 0.3, h);
    rest.forEach((value, i) => {
      const [line, note] = splitPoint(value),
        y = BODY_TOP + h + 0.16 + i * 0.62;
      badge(line, MARGIN + 0.02, y, 0.46);
      text(note ? `${line}: ${note}` : line, MARGIN + 0.66, y, CONTENT - 0.7, 0.46, {
        size: 19,
        color: P.muted,
        min: 12,
      });
    });
  }

  function exercise() {
    card(MARGIN, BODY_TOP, 3.05, BODY_H, P.accent, P.accent);
    text(`${s.activityMinutes || 10}`, MARGIN + 0.3, BODY_TOP + 0.3, 2.45, 1.15, {
      size: 54,
      bold: true,
      color: P.onAccent,
      font: P.font,
      valign: "top",
      min: 26,
    });
    text("minut pracy", MARGIN + 0.3, BODY_TOP + 1.42, 2.45, 0.4, {
      size: 15,
      color: P.onAccent,
      charSpacing: 1.1,
      min: 10,
    });
    text(s.exerciseLabel || "Zastosuj w praktyce", MARGIN + 0.3, BODY_TOP + 2.0, 2.45, 1.1, {
      size: 24,
      bold: true,
      color: P.onAccent,
      font: P.font,
      valign: "top",
      min: 14,
    });
    icon("target", MARGIN + 0.3, BODY_TOP + 3.12, 0.5, P.onAccent);
    const n = Math.max(points.length, 1),
      h = Math.min(1.1, (BODY_H - (n - 1) * 0.12) / n),
      step = h + 0.12,
      top = stack(n, h, 0.12),
      x = MARGIN + 3.35,
      w = CONTENT - 3.35;
    points.forEach((value, i) => {
      const [lead, detail] = splitPoint(value),
        y = top + i * step;
      card(x, y, w, h, i % 2 ? P.panel : P.panelAlt);
      dot(x + 0.24, y + h / 2 - 0.23, 0.46, P.softAccent);
      text(String(i + 1), x + 0.24, y + h / 2 - 0.23, 0.46, 0.46, {
        size: 18,
        bold: true,
        color: P.accent,
        align: "center",
        min: 11,
      });
      text(detail ? `${lead}: ${detail}` : lead, x + 0.86, y + 0.08, w - 1.1, h - 0.16, {
        size: 20,
        min: 12,
      });
    });
  }

  function anatomy() {
    const n = Math.max(points.length, 1),
      h = Math.min(1.05, (BODY_H - (n - 1) * 0.12) / n),
      step = h + 0.12,
      top = stack(n, h, 0.12);
    points.forEach((value, i) => {
      const [lead, detail] = splitPoint(value),
        y = top + i * step;
      card(MARGIN, y, CONTENT, h, i % 2 ? P.panel : P.panelAlt);
      badge(lead, MARGIN + 0.26, y + h / 2 - 0.26, 0.52);
      text(lead, MARGIN + 0.94, y + 0.06, 3.15, h - 0.12, {
        size: 20,
        bold: true,
        color: P.accent,
        min: 12,
      });
      if (detail) bar(MARGIN + 4.24, y + 0.22, 0.02, h - 0.44, P.line);
      text(detail || "", MARGIN + 4.5, y + 0.06, CONTENT - 4.78, h - 0.12, {
        size: 19,
        color: P.muted,
        min: 12,
      });
    });
  }

  function evidence() {
    const [lead, detail] = splitPoint(points[0] || s.title),
      w = 4.95;
    card(MARGIN, BODY_TOP, w, BODY_H, P.panelAlt);
    bar(MARGIN, BODY_TOP, w, 0.06, P.accent);
    badge(lead, MARGIN + 0.32, BODY_TOP + 0.36, 0.56);
    text(lead, MARGIN + 1.02, BODY_TOP + 0.36, w - 1.35, 0.56, {
      size: 20,
      bold: true,
      color: P.accent,
      min: 12,
    });
    text(detail || lead, MARGIN + 0.32, BODY_TOP + 1.16, w - 0.64, BODY_H - 1.5, {
      size: 25,
      font: P.font,
      valign: "top",
      lineSpacing: 1.14,
      min: 14,
    });
    const rest = points.slice(1),
      n = Math.max(rest.length, 1),
      h = Math.min(1.2, (BODY_H - (n - 1) * 0.14) / n),
      x = MARGIN + w + 0.3,
      cw = CONTENT - w - 0.3;
    rest.forEach((value, i) => {
      const [line, note] = splitPoint(value),
        y = stack(rest.length || 1, h, 0.14) + i * (h + 0.14);
      card(x, y, cw, h, P.panel);
      badge(line, x + 0.24, y + 0.22, 0.5);
      text(line, x + 0.86, y + 0.18, cw - 1.1, 0.56, { size: 20, bold: true, color: P.accent, min: 12 });
      if (note)
        text(note, x + 0.28, y + 0.78, cw - 0.56, h - 0.94, {
          size: 17,
          color: P.muted,
          valign: "top",
          min: 11,
        });
    });
  }

  function decision() {
    const [lead, detail] = splitPoint(points[0] || s.title),
      branches = points.slice(1),
      n = Math.max(branches.length, 1);
    card(3.1, BODY_TOP, 7.1, 1.05, P.panelAlt);
    text(detail ? `${lead}: ${detail}` : lead, 3.36, BODY_TOP + 0.06, 6.6, 0.93, {
      size: 22,
      bold: true,
      align: "center",
      min: 13,
    });
    bar(W / 2 - 0.01, BODY_TOP + 1.05, 0.02, 0.28, P.accent);
    bar(MARGIN + CONTENT / (n * 2), BODY_TOP + 1.33, CONTENT - CONTENT / n, 0.02, P.accent);
    const w = CONTENT / n;
    branches.forEach((value, i) => {
      const [line, note] = splitPoint(value),
        x = MARGIN + i * w;
      bar(x + w / 2 - 0.01, BODY_TOP + 1.33, 0.02, 0.24, P.accent);
      card(x + 0.11, BODY_TOP + 1.57, w - 0.22, BODY_H - 1.57, i % 2 ? P.panel : P.panelAlt);
      badge(line, x + 0.32, BODY_TOP + 1.78, 0.5);
      text(line, x + 0.94, BODY_TOP + 1.74, w - 1.28, 0.58, {
        size: 19,
        bold: true,
        color: P.accent,
        min: 12,
      });
      if (note)
        text(note, x + 0.32, BODY_TOP + 2.42, w - 0.64, BODY_H - 2.6, {
          size: 17,
          color: P.muted,
          valign: "top",
          min: 11,
        });
    });
  }

  function image() {
    const left = index % 2 === 0,
      pw = 5.85,
      px = left ? MARGIN : W - MARGIN - pw,
      tx = left ? MARGIN + pw + 0.42 : MARGIN,
      tw = CONTENT - pw - 0.42;
    if (s.image) {
      card(px - 0.06, BODY_TOP - 0.06, pw + 0.12, BODY_H + 0.12, P.panel);
      picture(s.image, px, BODY_TOP, pw, BODY_H, s.imageFit === "contain");
    }
    const n = Math.max(points.length, 1),
      h = Math.min(1.24, (BODY_H - (n - 1) * 0.16) / n),
      top = stack(n, h, 0.16);
    points.forEach((value, i) => {
      const [lead, detail] = splitPoint(value),
        y = top + i * (h + 0.16);
      badge(lead, tx, y + 0.04, 0.54);
      text(lead, tx + 0.72, y, tw - 0.72, 0.6, { size: 21, bold: true, color: P.accent, min: 12 });
      if (detail)
        text(detail, tx, y + 0.64, tw, h - 0.68, {
          size: 18,
          color: P.muted,
          valign: "top",
          min: 11,
        });
    });
  }
}

/** Kept for callers that only need the inner composition of a content slide. */
export function renderStructured(slide, pptx, s, style, opts) {
  return renderSlide(slide, pptx, s, style, opts);
}
