import JSZip from "jszip";
import { astraLicense } from "./icons.mjs";
import { exportDeck, validate } from "./engine.mjs";
import { review } from "./quality.mjs";

export const words = (text) =>
  String(text || "")
    .trim()
    .split(/\s+/u)
    .filter(Boolean).length;
const list = (items) => items.map((x) => `- ${x}`).join("\n");
export function trainingReview(deck) {
  const issues = [];
  deck.slides.forEach((s, i) => {
    const n = words(s.voiceScript);
    if (n < (deck.burEdition ? 25 : 120) || n > 280)
      issues.push({
        slide: i + 1,
        area: "script",
        message: `Skrypt: ${n} słów. Profil ${deck.burEdition ? 'BUR: zwięzłe objaśnienie w czasie slajdu' : 'standardowy: 120–280 słów'}.`,
      });
    if (!s.participantNotes?.trim())
      issues.push({
        slide: i + 1,
        area: "materials",
        message: "Brak objaśnienia dla uczestnika.",
      });
    if (
      /w dzisiejszym dynamicznym|rewolucjonizuje|game.changer|odkryj potencjał|w erze cyfrowej/i.test(
        s.voiceScript || "",
      )
    )
      issues.push({
        slide: i + 1,
        area: "language",
        message: "Zastąp ogólnik konkretnym przykładem.",
      });
  });
  if (!deck.sources?.length)
    issues.push({
      slide: null,
      area: "research",
      message: "Brak źródeł. Nie uznawaj faktów za zweryfikowane.",
    });
  const minutes = deck.slides.reduce(
    (sum, s) => sum + (deck.burEdition ? s.plannedMinutes : words(s.voiceScript) / 140 + (s.activityMinutes || 0)),
    0,
  );
  if (
    deck.durationMinutes &&
    Math.abs(minutes - deck.durationMinutes) > deck.durationMinutes * 0.2
  )
    issues.push({
      slide: null,
      area: "timing",
      message: `Szacowany czas ${minutes.toFixed(1)} min odbiega od celu ${deck.durationMinutes} min.`,
    });
  return {
    estimatedMinutes: Math.round(minutes * 10) / 10,
    wordsPerMinute: 140,
    issues,
  };
}
export function trainerScript(deck) {
  return (
    `# ${deck.title}\n\nSkrypt do prowadzenia na żywo, nie nagranie audio. ${deck.burEdition ? 'Profil BUR: czas zaplanowany obejmuje wypowiedź, pokaz, pytania i praktykę. Nie dodawaj czasu czytania po raz drugi. W M14 wskazówki padają podczas pracy uczestnika.' : 'Czas to szacunek przy 140 słowach/min, plus ćwiczenia.'}\n\n` +
    deck.slides
      .map(
        (s, i) =>
          `## Slajd ${i + 1}. ${s.title}\n\n**Mówienie: ${(words(s.voiceScript) / 140).toFixed(1)} min · aktywność: ${s.activityMinutes || 0} min**\n\n${s.voiceScript || "[BRAK SKRYPTU: uzupełnij przed szkoleniem]"}\n\n### Wskazówki prowadzenia\n\n${s.notes}`,
      )
      .join("\n\n---\n\n")
  );
}
export function participantGuide(deck) {
  return (
    `# ${deck.title}\n\n## Po szkoleniu potrafisz\n\n${list(deck.objectives || [])}\n\n` +
    deck.slides
      .map(
        (s, i) =>
          `## ${i + 1}. ${s.title}\n\n${list(s.points)}\n\n${s.participantNotes || "[Objaśnienie do uzupełnienia]"}${s.layout === "exercise" ? "\n\n**Twoje rozwiązanie:**\n\n......................................................................" : ""}`,
      )
      .join("\n\n")
  );
}
export function materials(deck) {
  const result = {
    "skrypt-trenera.md": trainerScript(deck),
    "materialy-uczestnika.md": participantGuide(deck),
    "slownik.md":
      `# Słownik: ${deck.title}\n\n` +
      (deck.glossary || [])
        .map((g) => `## ${g.term}\n\n${g.definition}\n\nPrzykład: ${g.example}`)
        .join("\n\n"),
    "cwiczenia.md":
      `# Karty pracy\n\n` +
      deck.slides
        .filter((s) => s.layout === "exercise")
        .map(
          (s) =>
            `## ${s.title}\n\n${list(s.points)}\n\nCzas: ${s.activityMinutes || "do ustalenia"} min\n\nWynik pracy:\n\n................................................\n\nJak sprawdzisz wynik?\n\n................................................`,
        )
        .join("\n\n"),
    "zrodla.md":
      `# Źródła do weryfikacji\n\nAdres i data nie stanowią dowodu poprawności. Trener sprawdza zgodność twierdzeń z treścią źródła.\n\n` +
      (deck.sources || [])
        .map(
          (s) =>
            `- ${s.title}: ${s.url} (dostęp: ${s.accessedAt})\n  Wspiera: ${s.supports}`,
        )
        .join("\n"),
    "plan-szkolenia.md": `# Plan: ${deck.title}\n\nCel: ${deck.durationMinutes || "nie podano"} min. ${deck.burEdition ? `Teoria ${deck.theoryMinutes}, praktyka ${deck.practiceMinutes}. Czas praktyki zawiera instrukcje i omówienie ćwiczeń.` : ''}\n\n${deck.slides.map((s, i) => `${i + 1}. ${s.title} · ${s.layout} · ${(deck.burEdition ? s.plannedMinutes : words(s.voiceScript) / 140 + (s.activityMinutes || 0)).toFixed(1)} min`).join("\n")}`,
  };
  if (deck.quiz?.length) {
    result["test-uczestnika.md"] =
      "# Test końcowy\n\n" +
      deck.quiz
        .map(
          (q, i) =>
            `## ${i + 1}. ${q.question}\n\n${q.options.map((o, j) => `${String.fromCharCode(65 + j)}. ${o}`).join("\n\n")}`,
        )
        .join("\n\n");
    result["TYLKO-TRENER-klucz-testu.md"] =
      "# Klucz odpowiedzi\n\n" +
      deck.quiz
        .map(
          (q, i) =>
            `${i + 1}. ${String.fromCharCode(65 + q.correctIndex)}. ${q.explanation}`,
        )
        .join("\n\n");
  }
  return result;
}
export function validateTraining(deck) {
  validate(deck);
  if(deck.burEdition){
    if(!/^M(0[1-9]|1[0-4])$/.test(deck.moduleId)||deck.slides.length!==20)throw Error('BUR: wymagany moduł M01–M14 i 20 slajdów.');
    let total=0,practice=0;
    for(const s of deck.slides){if(!Number.isFinite(s.plannedMinutes)||s.plannedMinutes<0||s.plannedMinutes<(s.activityMinutes||0))throw Error('BUR: nieprawidłowy czas slajdu.');total+=s.plannedMinutes;practice+=s.activityMinutes||0;}
    if(Math.abs(total-deck.durationMinutes)>0.01||practice!==deck.practiceMinutes||Math.abs(total-practice-deck.theoryMinutes)>0.01)throw Error('BUR: czasy nie sumują się do deklaracji modułu.');
    for(const k of ['bg','fg','accent','panel','highlight'])if(!/^[A-Fa-f0-9]{6}$/.test(deck.burTheme?.[k]||''))throw Error('BUR: nieprawidłowa paleta.');
  }
  for (const s of deck.slides) {
    for (const field of ["voiceScript", "participantNotes"])
      if (
        s[field] !== undefined &&
        (typeof s[field] !== "string" || s[field].length > 15000)
      )
        throw Error(`Nieprawidłowe ${field}.`);
    if (
      s.activityMinutes !== undefined &&
      (!Number.isFinite(s.activityMinutes) ||
        s.activityMinutes < 0 ||
        s.activityMinutes > 60)
    )
      throw Error("Nieprawidłowy czas aktywności.");
  }
  for (const field of ["objectives", "glossary", "sources", "quiz"])
    if (
      deck[field] !== undefined &&
      (!Array.isArray(deck[field]) || deck[field].length > 100)
    )
      throw Error(`Nieprawidłowe ${field}.`);
  if (deck.objectives?.some((x) => typeof x !== "string"))
    throw Error("Nieprawidłowe cele.");
  for (const g of deck.glossary || [])
    if (
      !g ||
      ["term", "definition", "example"].some((k) => typeof g[k] !== "string")
    )
      throw Error("Nieprawidłowy słownik.");
  for (const s of deck.sources || [])
    if (
      !s ||
      ["title", "url", "accessedAt"].some((k) => typeof s[k] !== "string") ||
      !(
        typeof s.supports === "string" ||
        (Array.isArray(s.supports) &&
          s.supports.every((x) => typeof x === "string"))
      ) ||
      !/^https?:\/\//.test(s.url)
    )
      throw Error("Nieprawidłowe źródło.");
  for (const q of deck.quiz || [])
    if (
      !q ||
      typeof q.question !== "string" ||
      typeof q.explanation !== "string" ||
      !Array.isArray(q.options) ||
      q.options.length < 2 ||
      q.options.length > 6 ||
      q.options.some((x) => typeof x !== "string") ||
      !Number.isInteger(q.correctIndex) ||
      q.correctIndex < 0 ||
      q.correctIndex >= q.options.length
    )
      throw Error("Nieprawidłowe pytanie testowe.");
  return deck;
}
export async function trainingPackage(input) {
  const deck = validateTraining(input),
    zip = new JSZip();
  zip.file("prezentacja.pptx", await exportDeck(deck));
  zip.file("deck.json", JSON.stringify(deck, null, 2));
  zip.file("licencje/Astra-Icons.txt", astraLicense);
  for (const [name, content] of Object.entries(materials(deck)))
    zip.file(name, content);
  zip.file(
    "kontrola-jakosci.json",
    JSON.stringify(
      { ...review(deck), training: trainingReview(deck) },
      null,
      2,
    ),
  );
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}
