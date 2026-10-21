import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("contact suburbs use the complete supplied Melbourne-wide list", () => {
  const suburbs = JSON.parse(read("caautobody_341_suburbs (1).json"));
  assert.equal(suburbs.length, 341);
  assert.equal(new Set(suburbs.map(({ suburb }) => suburb.trim().toLocaleLowerCase("en-AU"))).size, 341);

  const options = read("src/lib/contact-options.ts");
  assert.match(options, /caautobody_341_suburbs \(1\)\.json/);
  assert.match(options, /localeCompare\(right, "en-AU"/);
});

test("contact form provides keyboard-searchable suburbs and groups current public content", () => {
  const form = read("src/components/Public/ContactForm.tsx");
  const contactPage = read("src/app/contact/page.tsx");
  const options = read("src/lib/contact-options.ts");

  assert.match(form, /role="combobox"/);
  assert.match(form, /startsWith\(query\)/);
  assert.match(form, /role="listbox"/);
  assert.match(form, /Other \/ outside listed area/);
  assert.match(form, /<optgroup label="Services">/);
  assert.match(form, /<optgroup label="Brand repairs">/);
  assert.match(form, /Other \/ not sure/);
  assert.match(contactPage, /getPublishedServices/);
  assert.match(contactPage, /contactSuburbs/);
  assert.match(options, /service\.presentation\?\.variant === "brand"/);
  assert.match(options, /brandServiceSlugs/);
});
