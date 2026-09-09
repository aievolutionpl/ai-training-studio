// Native PowerPoint compositions. No rasterization of text or diagrams.
export function renderStructured(slide, p, s, t, text) {
  const box = (x, y, w, h, fill = t.panel) =>
    slide.addShape(p.ShapeType.roundRect, {
      x,
      y,
      w,
      h,
      rectRadius: 0.12,
      line: { color: fill },
      fill: { color: fill },
    });
  if (s.layout === "process") {
    const n = s.points.length,
      w = 11.5 / n;
    s.points.forEach((v, i) => {
      const x = 0.8 + i * w;
      slide.addShape(p.ShapeType.ellipse, {
        x: x + 0.15,
        y: 2.6,
        w: 0.65,
        h: 0.65,
        line: { color: t.accent },
        fill: { color: t.accent },
      });
      text(String(i + 1), x + 0.15, 2.7, 0.65, 0.35, 19, t.bg);
      if (i < n - 1)
        slide.addShape(p.ShapeType.chevron, {
          x: x + w - 0.55,
          y: 2.83,
          w: 0.3,
          h: 0.22,
          line: { color: t.accent },
          fill: { color: t.accent },
        });
      text(v, x, 3.65, w - 0.45, 1.65, 23);
    });
    return true;
  }
  if (s.layout === "comparison") {
    s.points.forEach((v, i) => {
      const row = Math.floor(i / 2),
        x = 0.7 + (i % 2) * 6.05,
        y = 2.65 + row * 1.7;
      box(x, y, 5.8, 1.5);
      slide.addShape(p.ShapeType.rect, {
        x,
        y,
        w: 0.07,
        h: 1.5,
        line: { color: t.accent },
        fill: { color: t.accent },
      });
      text(v, x + 0.3, y + 0.2, 5.15, 1.1, 24);
    });
    return true;
  }
  if (s.layout === "exercise") {
    box(0.7, 2.55, 3, 3.5, t.accent);
    text("WARSZTAT", 1, 2.9, 2.4, 0.5, 19, t.bg);
    text("Zastosuj\nw praktyce", 1, 3.6, 2.3, 1.25, 31, t.bg);
    s.points.forEach((v, i) => {
      text(
        String(i + 1).padStart(2, "0"),
        4.15,
        2.65 + i * 0.85,
        0.55,
        0.5,
        20,
        t.accent,
      );
      text(v, 4.85, 2.6 + i * 0.85, 7.4, 0.7, 22);
    });
    return true;
  }
  return false;
}
