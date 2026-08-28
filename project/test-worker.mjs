import { resolve } from "node:path";

import { runWasmBundle } from "../platform/packaging/run-wasm-bundle.mjs";

const [bundlePath, runtimeModulePath, capabilitiesValue = ""] = process.argv.slice(2);
if (!bundlePath || !runtimeModulePath) throw new Error("test worker requires bundle and runtime paths");

const result = await runWasmBundle({
  bundlePath: resolve(bundlePath),
  runtimeModulePath: resolve(runtimeModulePath),
  allowedCapabilities: capabilitiesValue.split(",").filter(Boolean),
  requireRendererTree: false,
});

process.stdout.write(`${JSON.stringify({
  result: "PASS",
  output: result.output,
  memoryGrowthBytes: result.memory.growthBytes,
  contentSha256: result.contentSha256,
})}\n`);
