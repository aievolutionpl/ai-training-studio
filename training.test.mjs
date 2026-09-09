import test from "node:test";
import assert from "node:assert/strict";
import JSZip from "jszip";
import { demo, exportDeck, validate } from "./engine.mjs";
import {
  materials,
  trainerScript,
  trainingReview,
  trainingPackage,
  validateTraining,
} from "./training.mjs";
import { trainingPrompt } from "./training-prompt.mjs";
const fixture = () => {
  const d = demo("swiss");
  d.slides.forEach((s) => {
    s.voiceScript = "Skrypt wyjaśniający " + s.title;
    s.participantNotes = "Objaśnienie uczestnika.";
    s.notes = "PRYWATNE WSKAZÓWKI TRENERA";
    s.icon = "target";
  });
  d.glossary = [
    {
      term: "Brief",
      definition: "Opis oczekiwanego zadania.",
      example: "Napisz podsumowanie dla menedżera.",
    },
  ];
  return d;
};
test("materials separate trainer content and optional answer key", () => {
  const d = fixture(),
    m = materials(d);
  assert.ok(!m["materialy-uczestnika.md"].includes("PRYWATNE"));
  assert.ok(!m["test-uczestnika.md"]);
  assert.equal(
    (trainerScript(d).match(/## Slajd /g) || []).length,
    d.slides.length,
  );
  d.quiz = [
    {
      question: "Cel?",
      options: ["A", "B"],
      correctIndex: 1,
      explanation: "TAJNY KLUCZ",
    },
  ];
  const q = materials(d);
  assert.ok(!q["test-uczestnika.md"].includes("TAJNY"));
  assert.ok(q["TYLKO-TRENER-klucz-testu.md"].includes("TAJNY"));
});
test("package contains PPTX, separate narration and participant resources", async () => {
  const z = await JSZip.loadAsync(await trainingPackage(fixture()));
  for (const f of [
    "prezentacja.pptx",
    "skrypt-trenera.md",
    "materialy-uczestnika.md",
    "slownik.md",
    "cwiczenia.md",
    "zrodla.md",
    "kontrola-jakosci.json",
    "deck.json",
  ])
    assert.ok(z.file(f), f);
});
test("PowerPoint embeds Astra icons and voice script in notes", async () => {
  const z = await JSZip.loadAsync(await exportDeck(fixture()));
  assert.ok(Object.keys(z.files).some((n) => n.endsWith(".svg")));
  const notes = await z.file("ppt/notesSlides/notesSlide1.xml").async("string");
  assert.ok(notes.includes("Skrypt wyjaśniający"));
  assert.ok(notes.includes("PRYWATNE"));
  const rels = Object.keys(z.files).filter(
    (n) => n.startsWith("ppt/slides/_rels/") && n.endsWith(".rels"),
  );
  for (const n of rels)
    assert.ok(
      !(await z.file(n).async("string")).includes('TargetMode="External"'),
    );
});
test("review flags incomplete narration and absent research", () => {
  const r = trainingReview(demo());
  assert.equal(r.issues.filter((i) => i.area === "script").length, 8);
  assert.ok(r.issues.some((i) => i.area === "research"));
});
test("malformed course data and icon paths fail validation", () => {
  assert.throws(() => validate({ title: "a", style: "swiss", slides: {} }));
  const d = fixture();
  d.slides[0].icon = "../secret";
  assert.throws(() => validateTraining(d));
  d.slides[0].icon = "ai";
  d.quiz = [
    { question: "x", options: ["x", "y"], correctIndex: 9, explanation: "x" },
  ];
  assert.throws(() => validateTraining(d));
});
test("prompt explicitly respects optional quiz and teaching requirements", () => {
  const p = trainingPrompt({ topic: "AI", includeQuiz: false }, "swiss", 20);
  assert.ok(p.includes("empty array"));
  assert.ok(p.includes("120–280"));
  assert.ok(p.includes("primary sources"));
  assert.ok(
    trainingPrompt({ includeQuiz: true }, "swiss", 20).includes("5 questions"),
  );
});
