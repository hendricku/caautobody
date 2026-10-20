import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";

const project = fileURLToPath(new URL("../", import.meta.url));

test("mobile service carousel controls do not blur the slide", () => {
  const css = readFileSync(path.resolve(project, "src/app/v4.css"), "utf8");
  const root = postcss.parse(css);
  const mobileControlsRules = [];

  root.walkAtRules("media", (media) => {
    if (media.params.replace(/\s+/g, "") !== "(max-width:720px)") return;

    media.walkRules(".hp-service-controls", (rule) => {
      mobileControlsRules.push(rule);
    });
  });

  assert.ok(
    mobileControlsRules.some((rule) =>
      ["backdrop-filter", "-webkit-backdrop-filter"].every((property) =>
        rule.nodes.some((node) => node.type === "decl" && node.prop === property && node.value === "none"),
      ),
    ),
  );
});
