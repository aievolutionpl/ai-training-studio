import { test } from "node:test";
import assert from "node:assert/strict";
import JSZip from "jszip";
import fs from "node:fs/promises";
import { styles, exportDeck } from "./engine.mjs";
import { genericLayouts } from "./layouts.mjs";
import { palette, contrast, splitPoint, semanticIcon, fit } from "./design.mjs";
import { iconNames } from "./icons.mjs";

test("every style keeps slide text readable on its own surfaces", () => {
  for (const style of styles) {
    const p = palette(style),
      where = (name) => `${style.id}: ${name}`;
    assert.ok(contrast(p.panel, p.fg) >= 7, where("tekst na panelu"));
    assert.ok(contrast(p.panelAlt, p.fg) >= 7, where("tekst na drugim panelu"));
    assert.ok(contrast(p.panel, p.muted) >= 3.5, where("tekst uzupełniający"));
    assert.ok(contrast(p.accent, p.onAccent) >= 4.5, where("tekst na akcencie"));
    assert.ok(contrast(p.bg, p.accent) >= 3, where("akcent na tle"));
  }
});

test("bullets split into a headline and an explanation", () => {
  assert.deepEqual(splitPoint("Cel:: co ma powstać"), ["Cel", "co ma powstać"]);
  assert.deepEqual(splitPoint("Cel: co ma powstać"), ["Cel", "co ma powstać"]);
  assert.deepEqual(splitPoint("Zdanie bez podziału"), ["Zdanie bez podziału", ""]);
  // A sentence that merely contains a colon late is not a headline.
  assert.equal(splitPoint("Model proponuje warianty, a człowiek decyduje: tak działa podział")[1], "");
});

test("icons follow the meaning of the text and exist in the icon set", () => {
  assert.equal(semanticIcon("Dane osobowe w promptach"), "shield");
  assert.equal(semanticIcon("Tydzień 2: test na dziesięciu sprawach"), "clock");
  assert.equal(semanticIcon("Koszt i wskaźniki jakości"), "chart");
  for (const value of ["cokolwiek", "Rola w zespole", "Prompt systemowy"])
    assert.ok(iconNames.includes(semanticIcon(value)));
});

test("long text shrinks to fit its box instead of overflowing", () => {
  const long = fit("Bardzo długie zdanie ".repeat(12), 4, 1.2, 28, "Aptos", false);
  assert.ok(long.size < 28);
  assert.ok(long.height <= 1.3);
  assert.equal(fit("Krótko", 6, 1.2, 28, "Aptos", true).size, 28);
});

test("all generic layouts export native, on-canvas shapes", async () => {
  const deck = {
    title: "Wszystkie układy",
    style: "noir",
    slides: genericLayouts.map((layout, i) => ({
      title: `Układ ${layout} w praktyce`,
      layout,
      points: [
        "Hasło pierwsze:: wyjaśnienie w jednym zdaniu dla uczestnika",
        "Hasło drugie:: druga myśl, także opisana jednym zdaniem",
        "Hasło trzecie:: trzecia myśl z konkretnym przykładem",
      ],
      notes: "Notatka trenera.",
      activityMinutes: layout === "exercise" ? 10 : 0,
    })),
  };
  const zip = await JSZip.loadAsync(await exportDeck(deck));
  const names = Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n));
  assert.equal(names.length, genericLayouts.length);
  for (const name of names) {
    const xml = await zip.file(name).async("string");
    // Short messages on purpose: a failing slide XML is thousands of characters long.
    assert.ok(!/<a:ext[^>]*(?:cx|cy)="-/.test(xml), `${name}: ujemny rozmiar kształtu`);
    assert.ok(/<a:t>/.test(xml), `${name}: brak edytowalnego tekstu`);
    assert.ok(/<p:fade\/>/.test(xml), `${name}: brak przejścia`);
    const offsets = [...xml.matchAll(/<a:off x="(-?\d+)" y="(-?\d+)"\/>/g)].map((m) => [
      Number(m[1]),
      Number(m[2]),
    ]);
    assert.ok(offsets.length > 4, `${name}: zbyt mało obiektów`);
    // Decorative shapes may bleed off the canvas, content may not.
    assert.ok(
      offsets.every(([x, y]) => x >= -914400 && y >= -914400 && x < 12192000 && y < 6858000),
      `${name}: obiekt poza slajdem`,
    );
  }
});

test("the editor offers exactly the layouts the renderer supports", async () => {
  const app = await fs.readFile(new URL("./public/app.js", import.meta.url), "utf8"),
    listed = app.match(/\["cover",[^\]]*\]\.map\(\(l\) =>/);
  assert.ok(listed, "lista układów w edytorze");
  assert.deepEqual(JSON.parse(listed[0].slice(0, listed[0].indexOf("]") + 1)), genericLayouts);
});
