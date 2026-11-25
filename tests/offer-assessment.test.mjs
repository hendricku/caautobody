import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
function loadRoute(mocks) {
  const source = readFileSync(new URL("../src/app/api/enquiries/route.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const loadedModule = { exports: {} };
  new Function("require", "module", "exports", outputText)((id) => Object.hasOwn(mocks, id) ? mocks[id] : require(id), loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

function setup(offerResult = { data: { slug: "new-offer" }, error: null }) {
  let sent = 0;
  let delivered;
  const filters = [];
  const database = { from(table) {
    if (table === "cms_offers") {
      const query = { select() { return query; }, eq(key, value) { filters.push([key, value]); return query; }, async maybeSingle() { return offerResult; } };
      return query;
    }
    const query = {
      select() { return query; }, eq() { return query; }, async maybeSingle() { return { data: null, error: null }; },
      insert() { return query; }, async single() { return { data: { id: "enquiry-1", delivery_status: "pending" }, error: null }; },
      update() { return { async eq() { return { error: null }; } }; },
    };
    return query;
  } };
  const route = loadRoute({
    "next/server": { NextResponse: { json: (body, options = {}) => Response.json(body, options) } },
    "@/lib/cms/admin-server": { sameOrigin: () => true },
    "@/lib/cms/service-client": { serviceClient: () => database },
    "@/lib/email/resend": { assertEmailConfiguration: () => {}, sendEnquiryEmail: async (input) => { sent++; delivered = input; } },
    "@/lib/security/public-rate-limit": { consumePublicRateLimit: async () => true },
  });
  return { route, filters, sent: () => sent, delivered: () => delivered };
}

function request(slug, photos = 1) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ submissionId: "00000000-0000-4000-8000-000000000001", enquiryType: "landing-assessment", name: "Test", phone: "0400000000", service: "Repairs", landingPage: slug })) form.set(key, value);
  for (let index = 0; index < photos; index++) form.append("photos", new File([new Uint8Array([0xff, 0xd8, 0xff, 0x00])], `photo-${index}.jpg`, { type: "image/jpeg" }));
  return { headers: new Headers({ "content-type": "multipart/form-data" }), formData: async () => form };
}

test("published CMS offers accept assessments and send an email", async () => {
  const context = setup();
  const response = await context.route.POST(request("new-offer"));
  assert.equal(response.status, 200);
  assert.deepEqual(context.filters, [["slug", "new-offer"], ["status", "published"]]);
  assert.equal(context.sent(), 1);
});

test("unpublished or missing CMS offers cannot receive assessments", async () => {
  const context = setup({ data: null, error: null });
  const response = await context.route.POST(request("draft-offer"));
  assert.equal(response.status, 400);
  assert.equal(context.sent(), 0);
});

test("database errors fail closed, and malformed slugs are rejected", async () => {
  const context = setup({ data: null, error: { code: "database-unavailable" } });
  assert.equal((await context.route.POST(request("new-offer"))).status, 503);
  assert.equal((await context.route.POST(request("../other"))).status, 400);
  assert.equal(context.sent(), 0);
});

test("built-in offer assessments also require publication", async () => {
  const context = setup({ data: null, error: null });
  const response = await context.route.POST(request("tesla-approved-body-shop-melbourne"));
  assert.equal(response.status, 400);
  assert.deepEqual(context.filters, [["slug", "tesla-approved-body-shop-melbourne"], ["status", "published"]]);
  assert.equal(context.sent(), 0);
});

test("offer assessments require a photo and send attachments", async () => {
  const context = setup();
  assert.equal((await context.route.POST(request("new-offer", 0))).status, 400);
  assert.equal((await context.route.POST(request("new-offer", 3))).status, 200);
  assert.equal(context.delivered().attachments.length, 3);
  assert.equal((await context.route.POST(request("new-offer", 4))).status, 400);
});

function contactRequest(overrides = {}, photos = 1) {
  const form = new FormData();
  const values = { submissionId: "00000000-0000-4000-8000-000000000001", enquiryType: "contact", name: "Test Customer", phone: "0400000000", email: "customer@example.com", suburb: "Chelsea", service: "Repairs", message: "Please contact me.", ...overrides };
  for (const [key, value] of Object.entries(values)) form.set(key, value);
  for (let index = 0; index < photos; index++) form.append("photos", new File([new Uint8Array([0xff, 0xd8, 0xff, 0x00])], `photo-${index}.jpg`, { type: "image/jpeg" }));
  return { headers: new Headers({ "content-type": "multipart/form-data" }), formData: async () => form };
}

test("contact enquiries deliver up to three images as email attachments", async () => {
  const context = setup();
  assert.equal((await context.route.POST(contactRequest({}, 3))).status, 200);
  assert.equal(context.sent(), 1);
  assert.equal(context.delivered().attachments.length, 3);
  assert.equal(context.delivered().attachments[0].contentType, "image/jpeg");
});

test("contact enquiries reject missing fields, missing photos, excess photos and honeypot input", async () => {
  const context = setup();
  for (const overrides of [{ name: "" }, { phone: "" }, { email: "" }, { suburb: "" }, { service: "" }, { message: "" }, { company: "spam" }]) {
    assert.equal((await context.route.POST(contactRequest(overrides))).status, 400);
  }
  assert.equal((await context.route.POST(contactRequest({}, 0))).status, 400);
  assert.equal((await context.route.POST(contactRequest({}, 4))).status, 400);
  assert.equal(context.sent(), 0);
});

test("contact enquiries reject oversized or disguised attachments", async () => {
  const context = setup();
  const oversized = contactRequest();
  const oversizedForm = await oversized.formData();
  oversizedForm.set("photos", new File([new Uint8Array(3.5 * 1024 * 1024 + 1)], "large.jpg", { type: "image/jpeg" }));
  assert.equal((await context.route.POST(oversized)).status, 400);
  const disguised = contactRequest();
  const disguisedForm = await disguised.formData();
  disguisedForm.set("photos", new File(["not an image"], "fake.jpg", { type: "image/jpeg" }));
  assert.equal((await context.route.POST(disguised)).status, 400);
  assert.equal(context.sent(), 0);
});
