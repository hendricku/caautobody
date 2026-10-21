import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const services = read("src/components/Admin/AdminServiceEditor.tsx");
const layoutEditor = read("src/components/Admin/ServiceLayoutEditor.tsx");
const guidePage = read("src/app/caautobodyadmin/(protected)/guide/page.tsx");
const guide = read("src/components/Admin/AdminGuide.tsx");
const route = read("src/app/api/admin/cms/[collection]/route.ts");
const styles = read("src/app/admin-editor.css");

test("services CMS replaces raw JSON editing with named layout fields", () => {
  assert.match(services, /ServiceLayoutEditor/);
  assert.doesNotMatch(services, /presentationJson/);
  assert.match(layoutEditor, /Standard service page/);
  assert.match(layoutEditor, /Editorial service page/);
  assert.match(layoutEditor, /Brand repair page/);
  assert.match(layoutEditor, /CmsImageField/);
});

test("friendly structured service layouts remain server-validated", () => {
  assert.match(route, /function validServicePresentation/);
  assert.match(route, /const presentation = validServicePresentation\(input\.presentation\)/);
  assert.match(route, /\["paragraph", "subheading", "bullet"\]/);
  assert.match(route, /function promoteServicePresentationImages/);
  assert.match(route, /row\.content_json = await promoteServicePresentationImages/);
});

test("Notes and Guide is a dedicated responsive dashboard destination", () => {
  assert.match(guidePage, /<AdminGuide \/>/);
  ["Blogs", "Services", "Gallery", "Analytics", "Team and access", "Settings"].forEach((chapter) => assert.match(guide, new RegExp(chapter)));
  assert.match(styles, /\.admin-guide__layout/);
  assert.match(styles, /@media\(max-width:700px\)/);
});
