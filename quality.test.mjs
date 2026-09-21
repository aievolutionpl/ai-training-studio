import { test } from "node:test";
import assert from "node:assert/strict";
import { demo } from "./engine.mjs";
import { review, handout } from "./quality.mjs";
test("review detects missing exercise and never claims visual verification", () => {
  const d = demo();
  d.slides = d.slides.filter((s) => s.layout !== "exercise");
  const r = review(d);
  assert.equal(r.visualVerified, false);
  assert.ok(r.issues.some((i) => i.message.includes("Brak ćwiczenia")));
});
test("trainer source includes all slide titles and notes", () => {
  const d = demo();
  const md = handout(d);
  for (const s of d.slides) {
    assert.ok(md.includes(s.title));
    assert.ok(md.includes(s.notes));
  }
});

test("review scores structure and names the concrete fix", () => {
  const d = demo();
  d.slides[2].points = ["1. Numerowany punkt", "Trzy role asystenta w zespole"];
  d.slides[3].title = "Brief";
  const r = review(d);
  assert.ok(r.score >= 0 && r.score <= 100);
  assert.ok(r.issues.some((i) => i.message.includes("numeracja")));
  assert.ok(r.issues.some((i) => i.message.includes("powtarza tytuł")));
  assert.ok(r.issues.some((i) => i.area === "content" && i.slide === 4));
  assert.ok(review(demo()).score > r.score, "czysty moduł ma wyższą ocenę");
});

test("review rejects marketing filler and a cover in the middle of the deck", () => {
  const d = demo();
  d.slides[1].points = ["AI rewolucjonizuje pracę i zmienia wszystko"];
  d.slides[4].layout = "cover";
  const r = review(d);
  assert.ok(r.issues.some((i) => i.area === "language"));
  assert.ok(r.issues.some((i) => i.message.includes("okładk") || i.message.includes("cover")));
});
