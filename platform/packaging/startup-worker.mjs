import { resolve } from "node:path";
import { runWasmBundle } from "./run-wasm-bundle.mjs";

const [bundlePath, runtimeModulePath] = process.argv.slice(2);
if (!bundlePath || !runtimeModulePath) throw new Error("startup worker requires bundle and runtime paths");
const result = await runWasmBundle({
  bundlePath: resolve(bundlePath), runtimeModulePath: resolve(runtimeModulePath),
  allowedCapabilities: ["ui.render"], requireRendererTree: true, executionProfile: "startup",
});
process.stdout.write(JSON.stringify(result.renderTree));
