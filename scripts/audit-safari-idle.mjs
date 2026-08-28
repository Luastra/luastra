import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { runProject } from "../project/run-project.mjs";

function fail(message) { throw new Error(message); }
function delay(milliseconds) { return new Promise((accept) => setTimeout(accept, milliseconds)); }
function parseArguments(values) {
  const result = { durationMs: 900_000, driverPort: 4444, output: null, port: 4192, project: "examples/animated-catalogue/luastra.json" };
  for (const value of values) {
    const [name, raw] = value.split("=", 2);
    if (name === "--duration-ms") result.durationMs = Number(raw);
    else if (name === "--driver-port") result.driverPort = Number(raw);
    else if (name === "--out") result.output = raw;
    else if (name === "--port") result.port = Number(raw);
    else if (name === "--project") result.project = raw;
    else fail(`unknown option: ${value}`);
  }
  for (const [name, value] of [["duration-ms", result.durationMs], ["driver-port", result.driverPort], ["port", result.port]]) {
    if (!Number.isSafeInteger(value) || value < (name === "duration-ms" ? 1_000 : 1) || value > (name === "duration-ms" ? 3_600_000 : 65_535)) fail(`invalid --${name}`);
  }
  if (!result.project) fail("invalid --project");
  if (result.output !== null && !result.output) fail("invalid --out");
  return result;
}

async function webdriver(base, method, path, body) {
  let response;
  try {
    response = await fetch(`${base}${path}`, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    fail(`WebDriver ${method} ${path} transport failed: ${String(error)}`);
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.value?.error) fail(`WebDriver ${method} ${path} failed: ${JSON.stringify(payload)}`);
  return payload?.value;
}

async function waitForDriver(base, process) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (process.exitCode !== null) fail(`SafariDriver exited before readiness (${process.exitCode})`);
    const response = await fetch(`${base}/status`).catch(() => null);
    if (response?.ok) return;
    await delay(100);
  }
  fail("SafariDriver readiness timeout");
}

async function execute(base, sessionId, script, args = []) {
  return webdriver(base, "POST", `/session/${sessionId}/execute/sync`, { script, args });
}

async function main() {
  if (process.platform !== "darwin") fail("Safari idle audit requires macOS");
  const options = parseArguments(process.argv.slice(2));
  const prototype = resolve(import.meta.dirname, "..");
  const applicationEvents = [];
  const application = await runProject({
    manifestPath: resolve(prototype, options.project),
    port: options.port,
    watch: false,
    onEvent: (event) => applicationEvents.push(event),
  });
  const driver = spawn("/usr/bin/safaridriver", ["-p", String(options.driverPort)], { stdio: ["ignore", "pipe", "pipe"] });
  let driverOutput = "";
  driver.stdout.on("data", (value) => { driverOutput += value; });
  driver.stderr.on("data", (value) => { driverOutput += value; });
  const base = `http://127.0.0.1:${options.driverPort}`;
  let sessionId = null;
  try {
    await waitForDriver(base, driver);
    const created = await webdriver(base, "POST", "/session", { capabilities: { alwaysMatch: { browserName: "safari" } } });
    sessionId = created?.sessionId ?? fail("SafariDriver did not return a session id");
    await webdriver(base, "POST", `/session/${sessionId}/window/rect`, { width: 1024, height: 800, x: 40, y: 40 });
    const url = `${application.url}?luastraDiagnostics=1`;
    await webdriver(base, "POST", `/session/${sessionId}/url`, { url });
    let preview = null;
    for (let attempt = 0; attempt < 200; attempt += 1) {
      preview = await execute(base, sessionId, "return window.__luastraPreview ?? null");
      if (preview?.result === "PASS") break;
      if (preview?.result === "FAIL") fail(`Luastra preview failed: ${preview.error}`);
      await delay(50);
    }
    if (preview?.result !== "PASS") fail("Luastra preview readiness timeout");
    const installed = await execute(base, sessionId, `
      if (!window.__luastraDiagnostics?.snapshot) return { installed: false };
      const state = { errors: [], frameCallbacks: 0, frameRequests: 0 };
      const original = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (callback) => {
        state.frameRequests += 1;
        return original((timestamp) => { state.frameCallbacks += 1; callback(timestamp); });
      };
      window.addEventListener("error", (event) => state.errors.push(String(event.error?.message ?? event.message ?? "error")));
      window.addEventListener("unhandledrejection", (event) => state.errors.push(String(event.reason?.message ?? event.reason ?? "unhandled rejection")));
      window.__luastraIdleAudit = state;
      document.querySelector("button")?.click();
      return { installed: true };
    `);
    if (!installed?.installed) fail("Luastra diagnostics were not installed");
    await delay(2_000);
    const startedAt = new Date().toISOString();
    const samples = [];
    const sample = async () => execute(base, sessionId, `
      return {
        diagnostics: window.__luastraDiagnostics.snapshot(),
        errors: [...window.__luastraIdleAudit.errors],
        frameCallbacks: window.__luastraIdleAudit.frameCallbacks,
        frameRequests: window.__luastraIdleAudit.frameRequests,
        horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      };
    `);
    samples.push({ elapsedMs: 0, value: await sample() });
    const deadline = Date.now() + options.durationMs;
    while (Date.now() < deadline) {
      await delay(Math.min(30_000, deadline - Date.now()));
      samples.push({ elapsedMs: options.durationMs - Math.max(0, deadline - Date.now()), value: await sample() });
    }
    const initial = samples[0].value;
    const final = samples.at(-1).value;
    const assertions = {
      previewPass: final.diagnostics.result === "PASS",
      noErrors: final.errors.length === 0,
      noPendingRequests: final.diagnostics.pendingRequests === 0,
      noActiveMotion: final.diagnostics.activeMotionCount === 0,
      noFrameTask: final.diagnostics.activeFrameTaskCount === 0 && final.diagnostics.framePending === false,
      noIdleFrameRequests: final.frameRequests === initial.frameRequests && final.frameCallbacks === initial.frameCallbacks,
      boundedWasmGrowth: final.diagnostics.wasmMemoryBytes - initial.diagnostics.wasmMemoryBytes <= 4 * 1024 * 1024,
      stableDom: final.diagnostics.domNodeCount === initial.diagnostics.domNodeCount,
      noHorizontalOverflow: final.horizontalOverflow === 0,
    };
    const result = Object.values(assertions).every(Boolean) ? "PASS" : "FAIL";
    const report = {
      schemaVersion: 1,
      blocker: 10,
      evidenceClass: "REAL_SAFARI_IDLE_AFTER_INTERACTION",
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: options.durationMs,
      browser: "Safari via Apple SafariDriver",
      project: preview.project,
      url,
      applicationEvents,
      assertions,
      initial,
      final,
      samples,
      result,
      boundary: "Safari WebDriver does not expose a stable garbage-collected JavaScript heap metric. This run proves Wasm-memory, DOM, scheduler, frame-request and runtime-error bounds; the separate 8 MiB application-heap gate remains open.",
    };
    const reportText = `${JSON.stringify(report, null, 2)}\n`;
    if (options.output !== null) {
      const output = resolve(options.output);
      await mkdir(dirname(output), { recursive: true });
      await writeFile(output, reportText);
    }
    process.stdout.write(reportText);
    if (result !== "PASS") process.exitCode = 1;
  } finally {
    if (sessionId) await webdriver(base, "DELETE", `/session/${sessionId}`).catch(() => {});
    driver.kill("SIGTERM");
    await application.close();
    if (driverOutput.trim()) process.stderr.write(driverOutput);
  }
}

main().catch((error) => {
  process.stderr.write(`${String(error?.stack ?? error)}\n`);
  process.exitCode = 1;
});
