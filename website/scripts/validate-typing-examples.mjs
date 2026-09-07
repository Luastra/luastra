import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { sections } from "../site/reference-data.js";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const cli = resolve(root, "cli", "luastra.mjs");
const section = sections.find((candidate) => candidate.id === "luau-types");
if (!section) throw new Error("missing Luau typing section");

const temporaryRoot = await mkdtemp(resolve(tmpdir(), "luastra-doc-typing-"));
const results = [];

function applicationSuffix(requiredModule) {
  return `

local UI = require("luastra/ui")
local checkedExample = require(${JSON.stringify(requiredModule)})
assert(checkedExample ~= nil)

local Application = {}
function Application.render(): UI.Node
    return UI.Screen { id = "typing-example" }
end
return Application
`;
}

function manifest(modules) {
  return JSON.stringify({
    schemaVersion: 2,
    project: { id: "dev.luastra.typing-example", entry: "app/main" },
    sdk: { contract: 1 },
    capabilities: ["ui.render"],
    modules,
  }, null, 2);
}

try {
  for (const [index, card] of section.cards.entries()) {
    if (typeof card.code !== "string") throw new Error(`${card.name} has no code`);
    const project = resolve(temporaryRoot, `example-${index + 1}`);
    await mkdir(resolve(project, "src"), { recursive: true });

    if (card.name === "Exported module types") {
      const marker = "\n\n-- app/main.luau\n";
      const parts = card.code.split(marker);
      if (parts.length !== 2 || !parts[0].startsWith("-- app/cards.luau\n--!strict\n") || !parts[1].startsWith("--!strict\n")) {
        throw new Error("Exported module types must contain two complete strict files");
      }
      const cards = parts[0].replace("-- app/cards.luau\n", "");
      await writeFile(resolve(project, "src/cards.luau"), `${cards}\n`, "utf8");
      await writeFile(resolve(project, "src/main.luau"), `${parts[1]}${applicationSuffix("app/cards")}`, "utf8");
      await writeFile(resolve(project, "luastra.json"), `${manifest([
        { id: "app/cards", source: "src/cards.luau", dependencies: [] },
        { id: "app/main", source: "src/main.luau", dependencies: ["app/cards", "luastra/ui"] },
      ])}\n`, "utf8");
    } else {
      if (!card.code.startsWith("--!strict\n")) throw new Error(`${card.name} is not a self-contained strict example`);
      await writeFile(resolve(project, "src/example.luau"), `${card.code}\n\nreturn true\n`, "utf8");
      await writeFile(resolve(project, "src/main.luau"), applicationSuffix("example/snippet").trimStart(), "utf8");
      await writeFile(resolve(project, "luastra.json"), `${manifest([
        { id: "example/snippet", source: "src/example.luau", dependencies: [] },
        { id: "app/main", source: "src/main.luau", dependencies: ["example/snippet", "luastra/ui"] },
      ])}\n`, "utf8");
    }

    const output = execFileSync(process.execPath, [cli, "check", `--project=${resolve(project, "luastra.json")}`], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    const report = JSON.parse(output);
    if (report.result !== "PASS") throw new Error(`${card.name} did not report PASS`);
    results.push(card.name);
  }
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}

process.stdout.write(`${JSON.stringify({ result: "PASS", examples: results })}\n`);
