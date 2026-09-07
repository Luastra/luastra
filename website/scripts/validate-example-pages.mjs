import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const landingSource = await readFile(resolve(root, "website/app/src/landing.luau"), "utf8");
const examples = Object.freeze([
  ["catalogue", "animated-catalogue"],
  ["orbit", "constellation-orbit"],
  ["meditation", "meditation"],
  ["forms", "forms-crud"],
  ["media", "media-player"],
  ["routing", "routing-lab"],
  ["visuals", "live-visuals"],
  ["debug", "debug-lab"],
]);

function fail(message) {
  throw new Error(message);
}

function detailBlock(id) {
  const marker = `    ["landing/examples/${id}"] = {`;
  const start = landingSource.indexOf(marker);
  if (start < 0) fail(`missing example page: ${id}`);
  const next = landingSource.indexOf("\n    [\"landing/examples/", start + marker.length);
  const end = next >= 0 ? next : landingSource.indexOf("\n}\n\nlocal productDetails", start);
  if (end < 0) fail(`cannot find the end of example page: ${id}`);
  return landingSource.slice(start, end);
}

const checked = [];
for (const [id, directory] of examples) {
  const manifest = JSON.parse(await readFile(resolve(root, `examples/${directory}/luastra.json`), "utf8"));
  const block = detailBlock(id);
  for (const field of ["title", "summary", "difficulty", "body", "commands", "keyFiles", "capabilities", "evidence", "docs"]) {
    if (!block.includes(`${field} = `)) fail(`${id} example page misses ${field}`);
  }
  const capabilitySummary = manifest.capabilities.join(" · ");
  if (!block.includes(`capabilities = ${JSON.stringify(capabilitySummary)}`)) {
    fail(`${id} example page capabilities differ from its manifest`);
  }
  const entryModule = manifest.modules.find((module) => module.id === manifest.project.entry);
  if (!entryModule || !block.includes(`examples/${directory}/${entryModule.source}`)) {
    fail(`${id} example page misses its entry source file`);
  }
  for (const command of ["check", "run"]) {
    if (!block.includes(`luastra ${command} --project=examples/${directory}`)) {
      fail(`${id} example page misses its ${command} command`);
    }
  }
  if (manifest.tests.length > 0 && !block.includes(`luastra test --project=examples/${directory}`)) {
    fail(`${id} example page misses its test command`);
  }
  if (manifest.backend && !block.includes(`luastra generate --project=examples/${directory}`)) {
    fail(`${id} backend example page misses its generate command`);
  }
  checked.push(id);
}

process.stdout.write(`${JSON.stringify({ result: "PASS", examplePages: checked })}\n`);
