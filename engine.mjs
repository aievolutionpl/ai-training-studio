import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PptxGenJS from "pptxgenjs";
import { renderStructured } from "./layouts.mjs";
import { iconNames, iconData, astraLicense } from "./icons.mjs";
export const root = path.dirname(fileURLToPath(import.meta.url));
export const styles = JSON.parse(
  await fs.readFile(new URL("./public/styles.json", import.meta.url), "utf8"),
);
export function validate(deck) {
  if (
    Array.isArray(deck?.slides) &&
    deck.slides.some(
      (s) =>
        !s ||
        (s.image && !/^generated\/[a-f0-9]{64}\.(png|jpg)$/.test(s.image)),
    )
  )
    throw Error("Nieprawidłowy slajd lub lokalny obraz.");
  if (
    Array.isArray(deck?.slides) &&
    deck.slides.some((s) => s.icon && !iconNames.includes(s.icon))
  )
    throw Error("Nieznana ikona.");
  if (
    !deck ||
    typeof deck.title !== "string" ||
    !deck.title.trim() ||
    deck.title.length > 180
  )
    throw Error("Tytuł: wymagany, maksymalnie 180 znaków.");
  if (!styles.some((s) => s.id === deck.style)) throw Error("Nieznany styl.");
  if (
    !Array.isArray(deck.slides) ||
    deck.slides.length < 1 ||
    deck.slides.length > 60
  )
    throw Error("Prezentacja musi zawierać 1–60 slajdów.");
  for (const s of deck.slides) {
    if (typeof s.title !== "string" || s.title.length > 120)
      throw Error("Tytuł slajdu: maksymalnie 120 znaków.");
    if (
      ![
        "cover",
        "cards",
        "process",
        "statement",
        "exercise",
        "comparison",
      ].includes(s.layout)
    )
      throw Error("Nieznany layout.");
    if (
      !Array.isArray(s.points) ||
      s.points.length > 4 ||
      s.points.some((p) => typeof p !== "string" || p.length > 180)
    )
      throw Error("Maksymalnie 4 punkty po 180 znaków.");
    if (typeof s.notes !== "string") throw Error("Brak notatek trenera.");
  }
  return deck;
}
export function demo(style = "evolution") {
  const topics = [
    [
      "AI w codziennej pracy firmy",
      "cover",
      ["Od pomysłu do pierwszego zastosowania"],
    ],
    [
      "Najpierw problem, potem narzędzie",
      "statement",
      ["Wybierz zadanie, którego efekt potrafisz sprawdzić."],
    ],
    [
      "Trzy role AI w zespole",
      "cards",
      [
        "Asystent: przygotowuje pierwszą wersję",
        "Analityk: porządkuje i porównuje informacje",
        "Partner: proponuje alternatywy",
      ],
    ],
    [
      "Dobry brief daje lepszy wynik",
      "process",
      ["Cel i odbiorca", "Kontekst i dane", "Format wyniku", "Kryteria oceny"],
    ],
    [
      "Automatyzacja wymaga kontroli",
      "comparison",
      [
        "AI: szkic, analiza, warianty",
        "Człowiek: ocena, decyzja, odpowiedzialność",
      ],
    ],
    [
      "Znajdź własne zastosowanie",
      "exercise",
      [
        "Wybierz powtarzalne zadanie",
        "Opisz dobry wynik",
        "Zaprojektuj sposób sprawdzania",
      ],
    ],
    [
      "Zacznij od małego pilotażu",
      "process",
      [
        "Jedno zadanie",
        "Mała grupa",
        "Pomiar jakości",
        "Decyzja o rozszerzeniu",
      ],
    ],
    [
      "Co zmienisz od jutra?",
      "statement",
      ["Zapisz jedno zadanie, które przetestujesz z AI."],
    ],
  ];
  return {
    title: "AI w codziennej pracy firmy",
    style,
    slides: topics.map(([title, layout, points]) => ({
      title,
      layout,
      points,
      notes:
        "Przykład demonstracyjny. Omów slajd i poproś uczestników o przykład z ich działu.",
    })),
  };
}
export async function exportDeck(input) {
  const d = validate(input),
    t = styles.find((s) => s.id === d.style),
    p = new PptxGenJS();
  p.layout = "LAYOUT_WIDE";
  p.author = "AI Evolution Polska";
  p.subject = "Szkolenie firmowe";
  p.title = d.title;
  p.lang = "pl-PL";
  p.theme = { headFontFace: t.font, bodyFontFace: "Aptos", lang: "pl-PL" };
  d.slides.forEach((s, i) => {
    const slide = p.addSlide();
    slide.background = { color: t.bg };
    const text = (v, x, y, w, h, size = 24, color = t.fg) =>
      slide.addText(v, {
        x,
        y,
        w,
        h,
        fontSize: size,
        fontFace: t.font,
        color,
        margin: 0,
        breakLine: false,
        fit: "shrink",
        valign: "mid",
      });
    if (s.image) {
      slide.addImage({
        path: path.join(root, "public", "assets", s.image),
        ...p.imageSizingCrop(
          path.join(root, "public", "assets", s.image),
          6.8,
          1.1,
          5.85,
          5.35,
        ),
      });
      text(s.title, 0.65, 1.3, 5.65, 2, 34);
      text(s.points.join("\n\n"), 0.65, 3.6, 5.5, 2.5, 21);
      text("AI EVOLUTION POLSKA", 0.65, 6.8, 10, 0.3, 10, t.accent);
      if (s.icon)
        slide.addImage({
          data: iconData(s.icon, t.accent),
          x: 11.2,
          y: 0.3,
          w: 0.45,
          h: 0.45,
        });
      slide.addNotes(
        [
          s.voiceScript || "",
          s.notes,
          i === 0 ? "Astra Icons — MIT\n" + astraLicense : "",
        ]
          .filter(Boolean)
          .join("\n\n"),
      );
      return;
    }
    slide.addShape(p.ShapeType.rect, {
      x: 0.55,
      y: 0.5,
      w: 0.45,
      h: 0.06,
      line: { color: t.accent },
      fill: { color: t.accent },
    });
    text("AI EVOLUTION POLSKA", 1.15, 0.38, 9, 0.25, 10, t.accent);
    text(String(i + 1).padStart(2, "0"), 12, 0.38, 0.6, 0.25, 10, t.accent);
    if (s.layout === "cover") {
      if (t.image)
        slide.addImage({
          path: path.join(root, "public", "assets", t.image),
          x: 0,
          y: 0,
          w: 13.333,
          h: 7.5,
        });
      else
        slide.addShape(
          ["editorial", "pop"].includes(t.id)
            ? p.ShapeType.rect
            : p.ShapeType.ellipse,
          {
            x: 8.7,
            y: 1.6,
            w: 4,
            h: 4,
            rotate: t.id === "pop" ? 15 : 0,
            line: { color: t.accent, width: 2 },
            fill: {
              color: t.accent,
              transparency: ["pop", "editorial"].includes(t.id) ? 0 : 85,
            },
          },
        );
      text(s.title, 0.65, 1.45, 6, 2.5, 38);
      text(s.points.join("\n"), 0.65, 4.3, 5.5, 1.5, 21);
      slide.addImage({
        path: path.join(root, "public", "assets", "logo.png"),
        x: 0.65,
        y: 6.15,
        w: 0.55,
        h: 0.43,
      });
    } else {
      text(s.title, 0.65, 1, 12, 1.2, s.layout === "statement" ? 36 : 30);
      if (renderStructured(slide, p, s, t, text)) {
      } else if (s.layout === "statement") {
        text(s.points.join("\n"), 0.8, 3, 10.9, 2.5, 32, t.accent);
      } else {
        s.points.forEach((v, j) => {
          const n = s.points.length,
            w = (12 - (n - 1) * 0.25) / n,
            x = 0.65 + j * (w + 0.25);
          slide.addShape(p.ShapeType.roundRect, {
            x,
            y: 2.65,
            w,
            h: 3.1,
            radius: 0.12,
            line: { color: t.panel },
            fill: { color: t.panel },
          });
          text(
            String(j + 1).padStart(2, "0"),
            x + 0.2,
            2.9,
            w - 0.4,
            0.6,
            25,
            t.accent,
          );
          text(v, x + 0.2, 3.65, w - 0.4, 1.65, 21);
        });
      }
    }
    text(
      s.layout === "exercise"
        ? "ĆWICZENIE • PRACA W PARACH"
        : "SZKOLENIE DLA FIRM",
      0.65,
      6.85,
      10,
      0.25,
      9,
      t.accent,
    );
    if (s.icon)
      slide.addImage({
        data: iconData(s.icon, t.accent),
        x: 11.2,
        y: 0.3,
        w: 0.45,
        h: 0.45,
      });
    slide.addNotes(
      [
        s.voiceScript || "",
        s.notes,
        i === 0 ? "Astra Icons — MIT\n" + astraLicense : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
    );
  });
  return p.write({ outputType: "nodebuffer" });
}
