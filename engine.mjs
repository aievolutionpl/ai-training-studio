import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PptxGenJS from "pptxgenjs";
import JSZip from 'jszip';
import {deduplicateMedia} from './pptx-media.mjs';
import { renderSlide, genericLayouts } from "./layouts.mjs";
import { iconNames, iconData, astraLicense } from "./icons.mjs";
import {renderBur,burLayouts} from './bur-layouts.mjs';
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
    if (![...genericLayouts, ...burLayouts].includes(s.layout))
      throw Error("Nieznany layout.");
    if (s.kicker !== undefined && (typeof s.kicker !== "string" || s.kicker.length > 60))
      throw Error("Nadtytuł: maksymalnie 60 znaków.");
    if (
      s.exerciseLabel !== undefined &&
      (typeof s.exerciseLabel !== "string" || s.exerciseLabel.length > 40)
    )
      throw Error("Etykieta ćwiczenia: maksymalnie 40 znaków.");
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
  // Built-in example: shows the layout set and the "Hasło:: wyjaśnienie" bullet format.
  const topics = [
    [
      "AI w codziennej pracy firmy",
      "cover",
      ["Od pierwszego zadania do sprawdzonego wyniku"],
      { kicker: "warsztat wprowadzający" },
    ],
    [
      "Najpierw problem, potem narzędzie",
      "statement",
      [
        "Wybierz zadanie, którego efekt potrafisz sprawdzić w pięć minut.",
        "Kryterium:: jeśli nie umiesz ocenić wyniku, nie umiesz go wdrożyć",
      ],
      { kicker: "zasada modułu", icon: "target" },
    ],
    [
      "Trzy role asystenta w zespole",
      "cards",
      [
        "Asystent:: pisze pierwszą wersję tekstu, którą i tak redagujesz",
        "Analityk:: porządkuje i porównuje informacje z kilku dokumentów",
        "Partner:: proponuje warianty, gdy utkniesz na jednym pomyśle",
      ],
      { icon: "group" },
    ],
    [
      "Dobry brief skraca liczbę poprawek",
      "process",
      [
        "Cel:: co ma powstać i dla kogo",
        "Kontekst:: dane, ograniczenia i ton wypowiedzi",
        "Format:: długość, struktura i język wyniku",
        "Kryteria:: po czym poznasz, że wynik nadaje się do użycia",
      ],
      { icon: "document" },
    ],
    [
      "Podział pracy między człowieka i model",
      "comparison",
      [
        "Model:: szkic, warianty, porządkowanie informacji",
        "Człowiek:: ocena, decyzja i odpowiedzialność za treść",
      ],
      { icon: "shield" },
    ],
    [
      "Zaprojektuj własny przypadek użycia",
      "exercise",
      [
        "Wybierz zadanie:: powtarzalne i wykonywane co najmniej raz w tygodniu",
        "Opisz dobry wynik:: dwa zdania, które zrozumie ktoś spoza zespołu",
        "Zaplanuj kontrolę:: kto sprawdza wynik, zanim trafi do klienta",
      ],
      { activityMinutes: 12, exerciseLabel: "Praca w parach", icon: "lamp" },
    ],
    [
      "Pilotaż w cztery tygodnie",
      "timeline",
      [
        "Tydzień 1:: jedno zadanie i pomiar stanu wyjściowego",
        "Tydzień 2:: test na dziesięciu realnych sprawach",
        "Tydzień 3:: korekta kryteriów i instrukcji",
        "Tydzień 4:: decyzja: rozszerzyć, poprawić albo odstawić",
      ],
      { icon: "clock" },
    ],
    [
      "Co zmienisz w swojej pracy od jutra?",
      "statement",
      [
        "Zapisz jedno zadanie, które przetestujesz z asystentem w tym tygodniu.",
        "Termin:: wróć do notatki za siedem dni i oceń wynik",
      ],
      { icon: "check-circle" },
    ],
  ];
  return {
    title: "AI w codziennej pracy firmy",
    style,
    durationMinutes: 40,
    objectives: [],
    slides: topics.map(([title, layout, points, extra = {}]) => ({
      title,
      layout,
      points,
      notes:
        "Przykład demonstracyjny. Omów slajd, poproś uczestników o przykład z ich działu i zapisz go na flipcharcie.",
      ...extra,
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
    if (d.burEdition === true) renderBur(slide, p, s, t, root, d, i);
    else
      renderSlide(slide, p, s, t, {
        root,
        index: i,
        total: d.slides.length,
        deck: d,
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
  const buffer = await p.write({ outputType: "nodebuffer" });
  const zip = await JSZip.loadAsync(buffer);
  for (const name of Object.keys(zip.files).filter((n) =>
    /^ppt\/slides\/slide\d+\.xml$/.test(n),
  )) {
    let xml = await zip.file(name).async("string");
    // Rounded photo corners: the picture stays a native, replaceable PowerPoint object.
    xml = xml.replace(/<p:pic\b[\s\S]*?<\/p:pic>/g, (pic) =>
      /BUR_ROUND|ROUND_IMAGE/.test(pic)
        ? pic.replace(
            /<a:prstGeom prst="rect">[\s\S]*?<\/a:prstGeom>/,
            '<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 6000"/></a:avLst></a:prstGeom>',
          )
        : pic,
    );
    xml = xml.replace(
      "</p:sld>",
      '<p:transition spd="med"><p:fade/></p:transition></p:sld>',
    );
    zip.file(name, xml);
  }
  await deduplicateMedia(zip);
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}
