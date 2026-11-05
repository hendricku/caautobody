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
    "@/lib/email/resend": { assertEmailConfiguration: () => {}, sendEnquiryEmail: async () => { sent++; } },
    "@/lib/security/public-rate-limit": { consumePublicRateLimit: async () => true },
  });
  return { route, filters, sent: () => sent };
}

function request(slug) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ submissionId: "00000000-0000-4000-8000-000000000001", enquiryType: "landing-assessment", name: "Test", phone: "0400000000", service: "Repairs", landingPage: slug })) form.set(key, value);
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

test("existing built-in offer assessments remain available", async () => {
  const context = setup({ data: null, error: null });
  const response = await context.route.POST(request("tesla-approved-body-shop-melbourne"));
  assert.equal(response.status, 200);
  assert.equal(context.filters.length, 0);
  assert.equal(context.sent(), 1);
});
