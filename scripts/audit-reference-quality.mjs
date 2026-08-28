import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { isAbsolute, resolve } from "node:path";

import { canonicalJson } from "../assets/package-assets.mjs";
import { resolveRuntime } from "../platform/resolve-runtime.mjs";
import { runWasmBundle } from "../platform/packaging/run-wasm-bundle.mjs";
import { assertRendererTreeQuality } from "../platform/quality/audit-render-tree.mjs";
import { buildProject } from "../project/build-project.mjs";
import { loadProject } from "../project/load-project.mjs";
import { referenceProjects } from "./conform-references.mjs";

export const referencePerformanceBudgets = Object.freeze({
  cycles: 20,
  p95CycleMs: 100,
  wasmMemoryGrowthBytes: 1024 * 1024,
});

function fail(message) { throw new Error(message); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }

export async function auditReferenceQuality() {
  const prototype = resolve(import.meta.dirname, "..");
  const runtime = await resolveRuntime();
  const workspace = await mkdtemp(resolve(tmpdir(), "luastra-reference-quality-"));
  const projects = [];
  try {
    for (const reference of referenceProjects) {
      const manifestPath = resolve(prototype, reference.path);
      const project = await loadProject(manifestPath);
      const output = resolve(workspace, project.id.replaceAll(".", "-"));
      await buildProject({ manifestPath, outputDirectory: output, target: "bundle" });
      const execution = await runWasmBundle({
        bundlePath: resolve(output, "luastra.bundle.json"),
        runtimeModulePath: runtime.artifacts.runtimeJavaScript,
        allowedCapabilities: [...project.capabilities].sort(),
        cycles: referencePerformanceBudgets.cycles,
        requireRendererTree: true,
      });
      const semantics = assertRendererTreeQuality(execution.renderTree);
      if (execution.pendingRequests !== 0) fail(`${project.id} initial render left ${execution.pendingRequests} pending host requests`);
      if (execution.timing.p95CycleMs > referencePerformanceBudgets.p95CycleMs) {
        fail(`${project.id} initial render p95 exceeded: ${execution.timing.p95CycleMs}ms > ${referencePerformanceBudgets.p95CycleMs}ms`);
      }
      if (execution.memory.growthBytes > referencePerformanceBudgets.wasmMemoryGrowthBytes) {
        fail(`${project.id} Wasm memory growth exceeded: ${execution.memory.growthBytes} > ${referencePerformanceBudgets.wasmMemoryGrowthBytes}`);
      }
      projects.push(Object.freeze({
        role: reference.role,
        project: project.id,
        result: "PASS",
        runtimeOrigin: runtime.origin,
        semantics,
        performance: Object.freeze({
          result: "PASS",
          cycles: execution.cycles,
          initializationMs: execution.timing.initializationMs,
          p95CycleMs: execution.timing.p95CycleMs,
          maximumCycleMs: execution.timing.maximumCycleMs,
          wasmMemoryGrowthBytes: execution.memory.growthBytes,
          budgets: referencePerformanceBudgets,
        }),
      }));
    }
    const stable = {
      schemaVersion: 1,
      profile: "reference-quality-v1",
      projects: projects.map((project) => ({ role: project.role, project: project.project, semantics: project.semantics, performanceBudgets: project.performance.budgets })),
    };
    return Object.freeze({
      schemaVersion: 1,
      command: "quality:references",
      profile: stable.profile,
      result: "PASS",
      host: Object.freeze({ platform: process.platform, architecture: process.arch }),
      runtimeOrigin: runtime.origin,
      projects: Object.freeze(projects),
      reportSha256: sha256(canonicalJson(stable)),
      measurementIdentityBoundary: "wall-clock measurements are reported but excluded from reportSha256; semantic results and budgets remain identity-bound",
    });
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  auditReferenceQuality()
    .then(async (result) => {
      const values = process.argv.slice(2);
      if (values.length > 1 || (values.length === 1 && !values[0].startsWith("--output="))) fail("usage: audit-reference-quality.mjs [--output=<file>]");
      const serialized = canonicalJson(result);
      if (values.length === 1) {
        const output = values[0].slice("--output=".length);
        if (!isAbsolute(output)) fail("reference quality output must be an absolute path");
        await writeFile(resolve(output), serialized, { flag: "wx" });
      }
      process.stdout.write(serialized);
    })
    .catch((error) => { process.stderr.write(`Luastra: ${String(error?.message ?? error)}\n`); process.exitCode = 1; });
}
