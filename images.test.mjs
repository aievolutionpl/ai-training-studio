import { test } from "node:test";
import assert from "node:assert/strict";
import { imagePlan, createImage, profiles } from "./images.mjs";
test("Codex returns an imagegen handoff without invoking fal", async () => {
  const r = await createImage(
    { prompt: "A calm abstract neural network", provider: "codex" },
    {
      fetcher: () => {
        throw Error("Network must not run");
      },
    },
  );
  assert.equal(r.status, "needs_codex_imagegen");
});
test("quality and style are part of cache key", () => {
  const a = { prompt: "A calm abstract neural network" };
  assert.notEqual(imagePlan(a).id, imagePlan({ ...a, quality: "final" }).id);
  assert.notEqual(imagePlan(a).id, imagePlan({ ...a, style: "green" }).id);
  assert.equal(profiles.draft.steps, 4);
});
test("fal fails clearly without key", async () => {
  await assert.rejects(
    createImage(
      { prompt: "A calm abstract neural network", provider: "fal" },
      { key: "" },
    ),
    /FAL_KEY/,
  );
});
