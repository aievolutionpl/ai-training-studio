import { test } from "node:test";
import assert from "node:assert/strict";
import { styles, demo, validate, exportDeck } from "./engine.mjs";
test("all eight styles export a real ZIP PowerPoint", async () => {
  assert.equal(styles.length, 8);
  for (const t of styles) {
    const b = await exportDeck(demo(t.id));
    assert.equal(b.subarray(0, 2).toString(), "PK");
    assert.ok(b.length > 10000);
  }
});
test("rejects unsupported layouts and excessive text", () => {
  const d = demo();
  d.slides[0].layout = "invalid";
  assert.throws(() => validate(d));
  d.slides[0].layout = "cover";
  d.slides[0].points = ["x".repeat(181)];
  assert.throws(() => validate(d));
});
