import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildBundle } from "./build-bundle.mjs";
import { runStartupBundle } from "./run-startup-bundle.mjs";

// The wrapper runs inside the same restricted startup VM. It never ships.
export async function buildStartupFailure(stage, runtime) {
  const manifest = JSON.parse(await readFile(stage.manifestPath, "utf8"));
  const entry = manifest.project.entry;
  let id = "app/generated-startup-failure";
  while (manifest.modules.some(module => module.id === id)) id += "-wrapper";
  const source = "startup-failure-wrapper.luau";
  await writeFile(resolve(stage.temporary, source), `--!strict
local Startup: any = require(${JSON.stringify(entry)})
local UI = require("luastra/ui")
return { render = function(): UI.Node
    if Startup.renderFailure ~= nil then
        assert(type(Startup.renderFailure) == "function", "startup.renderFailure must be a function")
        return (Startup.renderFailure :: any)()
    end
    return UI.Screen { id = "failure", padding = "xl", backgroundColor = "#F4EFE3", textColor = "#16342E", mutedColor = "#526A64", accentColor = "#2F7568",
        UI.Column { id = "failure/content", gap = "lg",
            UI.Text { id = "failure/title", text = "We couldn’t open the application.", variant = "title" },
            UI.Text { id = "failure/detail", text = "Check your connection and try again.", tone = "muted" },
            UI.Button { id = "failure/retry", text = "Try again", onTap = "startup.retry" },
        },
    }
end }
`);
  manifest.modules.push({ id, source, dependencies: [entry, "luastra/ui"] });
  manifest.project.entry = id;
  await writeFile(stage.manifestPath, JSON.stringify(manifest));
  const outputDirectory = resolve(stage.temporary, "failure-compiled");
  const bundle = await buildBundle({ manifestPath: stage.manifestPath, outputDirectory,
    analyzerPath: runtime.analyzer, compilerPath: runtime.compiler });
  const tree = await runStartupBundle({ bundlePath: resolve(outputDirectory, "luastra.bundle.json"), runtimeModulePath: runtime.runtimeJavaScript });
  return { tree, contentSha256: bundle.contentSha256 };
}
