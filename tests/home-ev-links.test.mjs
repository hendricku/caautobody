import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const home = readFileSync(new URL("../src/components/Public/HomeV4.tsx", import.meta.url), "utf8");

test("homepage EV section links each designated brand and keeps other EVs unlinked", () => {
  assert.match(home, /href="\/services\/tesla-approved-repair-centre">Tesla<\/Link>/);
  assert.match(home, /href="\/services\/services-zeekr-approved-repairer-melbourne">Zeekr<\/Link>/);
  assert.match(home, /href="\/services\/byd-approved-repairer-melbourne">BYD<\/Link>/);
  assert.match(home, /<span>Other EVs<\/span>/);
  assert.match(home, /href="\/contact" variant="gold" arrow>Book a repair assessment<\/Button>/);
  assert.doesNotMatch(home, /Explore approved repairs/);
});
