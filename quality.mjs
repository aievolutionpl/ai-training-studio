import { splitPoint } from "./public/palette.mjs";

// Rule-based review. It checks structure, density and language — never the rendered look.
const SLOGANS =
  /w dzisiejszym dynamicznym|dynamicznie zmieniając|rewolucjonizuj|game.?changer|odkryj potencjał|w erze cyfrowej|przełomow|must.?have|synerg|holistyczn|nowa era|zmienia wszystko|bez wątpienia przyszłość/i;
const NARROW = ["cover", "statement"];
const words = (text) => String(text || "").trim().split(/\s+/u).filter(Boolean).length;
const norm = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/u)
    .filter((w) => w.length > 3);

export function review(deck) {
  const issues = [];
  const add = (slide, area, message) => issues.push({ slide, area, message });
  const slides = deck.slides || [];
  const titles = new Map();

  slides.forEach((s, i) => {
    const n = i + 1,
      points = (s.points || []).filter((v) => String(v ?? "").trim()),
      titleWords = norm(s.title);

    if (s.title.length > 85) add(n, "design", "Długi tytuł — skróć do jednego wniosku.");
    if (words(s.title) < 3 && s.layout !== "cover")
      add(n, "content", "Tytuł nazywa temat, a nie wniosek. Napisz, co z tego wynika.");
    const key = titleWords.join(" ");
    if (key && titles.has(key)) add(n, "coherence", `Tytuł powtarza slajd ${titles.get(key)}.`);
    else if (key) titles.set(key, n);

    if (points.join(" ").split(/\s+/).length > 55)
      add(n, "design", "Dużo tekstu — przenieś szczegóły do notatek albo skryptu.");
    if (!points.length && s.layout !== "cover") add(n, "content", "Slajd bez treści.");
    if (points.length > 4) add(n, "design", "Więcej niż cztery punkty — podziel slajd.");

    points.forEach((value, j) => {
      const [lead, detail] = splitPoint(value);
      if (!detail && value.length > 70 && !NARROW.includes(s.layout))
        add(
          n,
          "design",
          `Punkt ${j + 1}: zapisz jako „Hasło:: wyjaśnienie”, żeby slajd miał nagłówek i opis.`,
        );
      if (lead.length > 34 && detail)
        add(n, "design", `Punkt ${j + 1}: hasło przed :: powinno mieć 1–3 słowa.`);
      const overlap = norm(value).filter((w) => titleWords.includes(w)).length;
      if (overlap >= 2 && overlap >= norm(value).length * 0.6)
        add(n, "content", `Punkt ${j + 1} powtarza tytuł — dodaj nową informację.`);
      if (/^\d+[.)]\s/.test(value.trim()))
        add(n, "design", `Punkt ${j + 1}: numeracja powstaje automatycznie, usuń ją z tekstu.`);
    });

    if (SLOGANS.test([s.title, ...points].join(" ")))
      add(n, "language", "Slogan zamiast treści — wstaw konkretne zadanie albo liczbę.");
    if (String(s.notes || "").length < 80)
      add(n, "content", "Rozbuduj notatki o przykład i pytanie do grupy.");
    if (s.layout === "exercise" && !(s.activityMinutes > 0))
      add(n, "content", "Ćwiczenie bez czasu pracy — ustaw activityMinutes.");
    if (s.layout === "cover" && i > 0) add(n, "design", "Układ cover należy do pierwszego slajdu.");
    if (
      i > 1 &&
      s.layout === slides[i - 1].layout &&
      s.layout === slides[i - 2].layout
    )
      add(n, "coherence", "Trzeci taki sam układ z rzędu — zmień rytm narracji.");
  });

  const exercises = slides.filter((s) => s.layout === "exercise").length;
  if (!exercises) add(null, "coherence", "Brak ćwiczenia praktycznego.");
  else if (exercises < 2 && slides.length >= 12)
    add(null, "coherence", "Jedno ćwiczenie na cały moduł — dodaj drugie w pierwszej połowie.");
  if (slides.length && slides[0].layout !== "cover")
    add(null, "design", "Pierwszy slajd nie jest okładką.");
  if (new Set(slides.map((s) => s.layout)).size < 3 && slides.length >= 8)
    add(null, "design", "Mało układów — wykorzystaj process, comparison albo evidence.");
  if (!deck.objectives?.length) add(null, "content", "Brak celów szkolenia.");

  // Score is a review aid, not a grade: every slide gets a budget of 12 penalty points.
  const weights = { design: 2, content: 3, language: 3, coherence: 4, research: 4 },
    penalty = issues.reduce((sum, i) => sum + (weights[i.area] || 2), 0),
    budget = Math.max(1, slides.length) * 12,
    score = Math.max(0, 100 - Math.round((100 * penalty) / budget));
  const areas = issues.reduce((acc, i) => ({ ...acc, [i.area]: (acc[i.area] || 0) + 1 }), {});
  return {
    kind: "rule-based",
    visualVerified: false,
    score,
    areas,
    issues,
    summary: issues.length
      ? `${issues.length} wskazówek do przeglądu · ocena struktury ${score}/100`
      : "Reguły strukturalne spełnione. Wymagany przegląd wizualny.",
  };
}

export function handout(deck) {
  return (
    "# " +
    deck.title +
    "\n\n" +
    deck.slides
      .map(
        (s, i) =>
          `## ${i + 1}. ${s.title}\n\n${s.points.map((p) => "- " + splitPoint(p).filter(Boolean).join(": ")).join("\n")}\n\n### Notatki prowadzącego\n\n${s.notes}`,
      )
      .join("\n\n")
  );
}
