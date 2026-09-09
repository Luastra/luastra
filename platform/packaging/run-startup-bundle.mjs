import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";

const execute = promisify(execFile);
const worker = resolve(import.meta.dirname, "startup-worker.mjs");

// Hard termination is outside the VM: neither pcall nor a loop in a native
// library can catch or indefinitely delay it. Only platform-owned JS runs here.
export async function runStartupBundle({ bundlePath, runtimeModulePath, timeoutMs = 5000 }) {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000) throw new Error("startup timeout must be 1..30000ms");
  try {
    const { stdout } = await execute(process.execPath, ["--max-old-space-size=64", worker, resolve(bundlePath), resolve(runtimeModulePath)], {
      timeout: timeoutMs, killSignal: "SIGKILL", maxBuffer: 2 * 1024 * 1024, encoding: "utf8",
      // Do not inherit NODE_OPTIONS or preload hooks from the build environment.
      env: process.platform === "win32" ? { SystemRoot: process.env.SystemRoot } : {},
    });
    return JSON.parse(stdout);
  } catch (error) {
    if (error.killed) throw new Error(`startup execution exceeded its ${timeoutMs}ms time or output budget`);
    throw new Error(`startup execution failed: ${String(error.stderr || error.message).slice(0, 4096)}`);
  }
}
