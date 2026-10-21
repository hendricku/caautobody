import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/app/v4.css", import.meta.url), "utf8");

test("mobile accident-help strip stays in normal document flow", () => {
  assert.match(css, /\.hp-home-priority \.hp-accident-strip\{top:auto;gap:10px/);
  assert.doesNotMatch(css, /\.hp-home-priority \.hp-accident-strip\{top:84px/);
  assert.doesNotMatch(css, /\.hp-home-priority \.hp-accident-strip\{top:90px/);
});
