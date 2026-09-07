import { execFileSync } from "node:child_process";
import { copyFile, mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { sections } from "../site/reference-data.js";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const cli = resolve(root, "cli", "luastra.mjs");
const recipes = [
  "beginner-tutorial",
  "advanced-tutorial",
  "recipe-timer",
  "recipe-navigation",
  "recipe-storage",
  "recipe-history",
  "recipe-form-modal",
  "recipe-assets-visuals",
  "recipe-motion",
  "recipe-server",
  "recipe-media",
  "recipe-orbit",
];
const defaultRecipeFiles = Object.freeze([
  ["2. Replace luastra.json", "luastra.json"],
  ["3. Replace src/main.luau", "src/main.luau"],
  ["4. Replace tests/smoke.luau", "tests/smoke.luau"],
]);
const recipeFiles = Object.freeze({
  "recipe-server": [
    ["2. Replace luastra.json", "luastra.json"],
    ["3. Create backend/functions.json", "backend/functions.json"],
    ["4. Create backend/handlers.mjs", "backend/handlers.mjs"],
    ["6. Replace src/main.luau", "src/main.luau"],
    ["7. Replace tests/smoke.luau", "tests/smoke.luau"],
  ],
});
const recipeAssets = Object.freeze({
  "recipe-assets-visuals": [
    { source: "examples/live-visuals/assets/luastra-mark.png", destination: "assets/luastra-mark.png" },
  ],
  "recipe-media": [
    { source: "examples/media-player/assets/focus.wav", destination: "assets/focus.wav" },
  ],
});
const temporaryRoot = await mkdtemp(resolve(tmpdir(), "luastra-doc-recipes-"));
const results = [];

function cardCode(section, name) {
  const matches = (section.cards ?? []).filter((card) => card.name === name);
  if (matches.length !== 1 || typeof matches[0].code !== "string") {
    throw new Error(`${section.id} must contain exactly one ${name} code card`);
  }
  return matches[0].code;
}

try {
  for (const id of recipes) {
    const section = sections.find((candidate) => candidate.id === id);
    if (!section) throw new Error(`missing documentation recipe: ${id}`);

    const files = recipeFiles[id] ?? defaultRecipeFiles;
    const manifestText = cardCode(section, "2. Replace luastra.json");
    JSON.parse(manifestText);
    if (id === "recipe-server") JSON.parse(cardCode(section, "3. Create backend/functions.json"));

    const project = resolve(temporaryRoot, id);
    for (const [cardName, destinationName] of files) {
      const destination = resolve(project, destinationName);
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, `${cardCode(section, cardName)}\n`, "utf8");
    }
    for (const asset of recipeAssets[id] ?? []) {
      const destination = resolve(project, asset.destination);
      await mkdir(dirname(destination), { recursive: true });
      await copyFile(resolve(root, asset.source), destination);
    }

    const commands = id === "recipe-server" ? ["generate", "check", "test"] : ["check", "test"];
    for (const command of commands) {
      const output = execFileSync(process.execPath, [cli, command, `--project=${project}/luastra.json`], {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }).trim();
      const report = JSON.parse(output);
      if (report.result !== "PASS") throw new Error(`${id} ${command} did not report PASS`);
      if (command === "test" && (report.tests !== 1 || report.passed !== 1)) {
        throw new Error(`${id} test did not execute exactly one passing recipe test`);
      }
    }
    results.push(id);
  }
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}

process.stdout.write(`${JSON.stringify({ result: "PASS", recipes: results })}\n`);
