import { spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { resolveRuntime } from "../platform/resolve-runtime.mjs";
import { buildProject } from "./build-project.mjs";
import { loadProject } from "./load-project.mjs";

const worker = resolve(dirname(fileURLToPath(import.meta.url)), "test-worker.mjs");
const testTimeoutMs = 2_000;

function fail(message) { throw new Error(message); }

export async function testProject(manifestPath) {
  const [project, binarySdk] = await Promise.all([loadProject(manifestPath), resolveRuntime()]);
  if (project.tests.length === 0) fail("project declares no Luau tests");
  const workspace = await mkdtemp(resolve(tmpdir(), "luastra-tests-"));
  const results = [];
  try {
    for (let index = 0; index < project.tests.length; index += 1) {
      const id = project.tests[index];
      const output = resolve(workspace, `test-${index + 1}`);
      const built = await buildProject({ manifestPath, outputDirectory: output, target: "bundle", entry: id, roots: [id] });
      const execution = spawnSync(process.execPath, [
        worker,
        resolve(output, "luastra.bundle.json"),
        binarySdk.artifacts.runtimeJavaScript,
        [...project.capabilities].sort().join(","),
      ], { encoding: "utf8", timeout: testTimeoutMs, maxBuffer: 1024 * 1024 });
      if (execution.error?.code === "ETIMEDOUT") fail(`test timed out after ${testTimeoutMs}ms: ${id}`);
      if (execution.status !== 0) fail(`test failed: ${id}\n${(execution.stderr || execution.stdout || "unknown VM failure").trim()}`);
      const result = JSON.parse(execution.stdout);
      results.push(Object.freeze({ id, contentSha256: built.contentSha256, output: result.output, memoryGrowthBytes: result.memoryGrowthBytes }));
    }
    return Object.freeze({
      command: "test",
      result: "PASS",
      project: project.id,
      tests: results.length,
      passed: results.length,
      timeoutMs: testTimeoutMs,
      results: Object.freeze(results),
    });
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}
