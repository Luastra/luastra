import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { resolveRuntime } from "../../platform/resolve-runtime.mjs";
import { generatedPages } from "../site/generated-reference-data.js";
import { sections } from "../site/reference-data.js";

const runtime = await resolveRuntime();
const temporaryRoot = await mkdtemp(resolve(tmpdir(), "luastra-doc-code-"));
const checked = [];
const checkedByProjectValidator = new Set([
  "luau-types",
  "beginner-tutorial", "advanced-tutorial",
  "recipe-timer", "recipe-navigation", "recipe-storage", "recipe-history",
  "recipe-form-modal", "recipe-assets-visuals", "recipe-motion", "recipe-server",
  "recipe-media", "recipe-orbit",
]);

function admittedLanguage(value) {
  return value === undefined || value === "Luau";
}

function compile(id, code) {
  const source = resolve(temporaryRoot, `${checked.length + 1}.luau`);
  const bytecode = resolve(temporaryRoot, `${checked.length + 1}.luauc`);
  return writeFile(source, `${code}\n`, "utf8").then(() => {
    const result = spawnSync(runtime.artifacts.compiler, [source, bytecode], { encoding: "utf8" });
    if (result.status !== 0) {
      throw new Error(`${id} is not valid Luau syntax:\n${result.stderr || result.stdout || result.error}`);
    }
    checked.push(id);
  });
}

try {
  for (const page of generatedPages) {
    if (!checkedByProjectValidator.has(page.sectionId) && typeof page.code === "string" && admittedLanguage(page.language)) {
      await compile(`page:${page.routeId}`, page.code);
    }
  }
  for (const section of sections) {
    if (!checkedByProjectValidator.has(section.id) && section.module?.startsWith("luastra/") && typeof section.example === "string") {
      await compile(`section:${section.id}`, section.example);
    }
  }
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}

process.stdout.write(`${JSON.stringify({ result: "PASS", compiledLuauBlocks: checked.length })}\n`);
