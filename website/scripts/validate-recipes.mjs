import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { sections } from "../site/reference-data.js";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const cli = resolve(root, "cli", "luastra.mjs");
const recipes = ["recipe-timer", "recipe-navigation", "recipe-storage", "recipe-history"];
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

    const manifestText = cardCode(section, "2. Replace luastra.json");
    const sourceText = cardCode(section, "3. Replace src/main.luau");
    const testText = cardCode(section, "4. Replace tests/smoke.luau");
    JSON.parse(manifestText);

    const project = resolve(temporaryRoot, id);
    await mkdir(resolve(project, "src"), { recursive: true });
    await mkdir(resolve(project, "tests"), { recursive: true });
    await writeFile(resolve(project, "luastra.json"), `${manifestText}\n`, "utf8");
    await writeFile(resolve(project, "src", "main.luau"), `${sourceText}\n`, "utf8");
    await writeFile(resolve(project, "tests", "smoke.luau"), `${testText}\n`, "utf8");

    for (const command of ["check", "test"]) {
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
