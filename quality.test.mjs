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
