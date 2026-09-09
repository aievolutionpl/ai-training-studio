import { test } from "node:test";
import assert from "node:assert/strict";
import { generateWithPresenton } from "./presenton.mjs";
import { demo } from "./engine.mjs";
test("Presenton serializes authored slides without regenerating their structure", async () => {
  let request;
  const result = await generateWithPresenton(demo(), {
    baseUrl: "http://localhost:5001",
    key: "test-only",
    fetcher: async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => ({ presentation_id: "example" }) };
    },
  });
  assert.equal(request.url.pathname, "/api/v1/ppt/presentation/generate");
  assert.equal(JSON.parse(request.options.body).slides_markdown.length, 8);
  assert.equal(result.presentation_id, "example");
});
