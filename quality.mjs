export function review(deck) {
  const issues = [];
  const add = (slide, area, message) => issues.push({ slide, area, message });
  deck.slides.forEach((s, i) => {
    if (s.title.length > 85)
      add(i + 1, "design", "Długi tytuł — skróć do jednego wniosku.");
    if (s.points.join(" ").split(/\s+/).length > 55)
      add(i + 1, "design", "Dużo tekstu — przenieś szczegóły do notatek.");
    if (s.notes.length < 80)
      add(i + 1, "content", "Rozbuduj notatki o przykład i pytanie do grupy.");
    if (
      i > 1 &&
      s.layout === deck.slides[i - 1].layout &&
      s.layout === deck.slides[i - 2].layout
    )
      add(
        i + 1,
        "coherence",
        "Trzeci taki sam układ z rzędu — zmień rytm narracji.",
      );
  });
  if (!deck.slides.some((s) => s.layout === "exercise"))
    add(null, "coherence", "Brak ćwiczenia praktycznego.");
  return {
    kind: "rule-based",
    visualVerified: false,
    issues,
    summary: issues.length
      ? `${issues.length} wskazówek do przeglądu`
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
          `## ${i + 1}. ${s.title}\n\n${s.points.map((p) => "- " + p).join("\n")}\n\n### Notatki prowadzącego\n\n${s.notes}`,
      )
      .join("\n\n")
  );
}
