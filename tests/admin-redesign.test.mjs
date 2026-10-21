import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const shell = read("src/components/Admin/AdminShell.tsx");
const services = read("src/app/caautobodyadmin/(protected)/services/page.tsx");
const serviceEditor = read("src/components/Admin/AdminServiceEditor.tsx");
const structuredEditor = read("src/components/Admin/AdminStructuredEditor.tsx");
const libraryEditor = read("src/components/Admin/AdminLibraryEditor.tsx");
const style = read("src/app/admin-redesign.css");

test("dashboard navigation groups content, operations and administration", () => {
  ["Workspace", "Content", "Operations", "Administration", "Notes & guide"].forEach((label) => assert.match(shell, new RegExp(label)));
});

test("content lists send staff to full-page editors instead of edit modals", () => {
  assert.match(services, /\/caautobodyadmin\/services\/new/);
  assert.doesNotMatch(services, /AdminModal/);
  ["Save draft", "Publish service", "Preview draft"].forEach((label) => assert.match(serviceEditor, new RegExp(label)));
  assert.match(structuredEditor, /admin-editor/);
  assert.match(libraryEditor, /admin-editor/);
});

test("editor system includes mobile, status and reduced-motion safeguards", () => {
  assert.match(style, /admin-status-badge--published/);
  assert.match(style, /@media\(max-width:720px\)/);
  assert.match(style, /prefers-reduced-motion/);
});

test("previewing a published item does not convert it into a draft", () => {
  [serviceEditor, structuredEditor, libraryEditor].forEach((editor) => {
    assert.match(editor, /form\.status === "published"/);
    assert.match(editor, /Preview published page|Preview/);
  });
  assert.match(serviceEditor, /window\.open\(`\/caautobodyadmin\/services\/\$\{form\.slug\}\/preview`/);
  assert.match(structuredEditor, /window\.open\(`\/caautobodyadmin\/\$\{collection\}\/\$\{form\.slug\}\/preview`/);
});
