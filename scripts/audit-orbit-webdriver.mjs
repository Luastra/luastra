import { spawn } from "node:child_process";
import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { runProject } from "../project/run-project.mjs";
import { orbitBrowserBudgets as budgets, orbitBrowserTargets as targets } from "./orbit-browser-budgets.mjs";

function fail(message) { throw new Error(message); }
function delay(milliseconds) { return new Promise((accept) => setTimeout(accept, milliseconds)); }

function parseArguments(values) {
  const result = { browser: null, cycles: 10, driver: null, driverPort: 4449, firefoxBinary: "/Applications/Firefox.app/Contents/MacOS/firefox", output: null, port: 4201 };
  for (const value of values) {
    const [name, raw] = value.split("=", 2);
    if (name === "--browser") result.browser = raw;
    else if (name === "--cycles") result.cycles = Number(raw);
    else if (name === "--driver") result.driver = raw;
    else if (name === "--driver-port") result.driverPort = Number(raw);
    else if (name === "--firefox-binary") result.firefoxBinary = raw;
    else if (name === "--out") result.output = raw;
    else if (name === "--port") result.port = Number(raw);
    else fail(`unknown option: ${value}`);
  }
  if (!new Set(["firefox", "safari"]).has(result.browser)) fail("--browser must be firefox or safari");
  result.driver ??= result.browser === "safari" ? "/usr/bin/safaridriver" : "geckodriver";
  for (const [name, value, minimum, maximum] of [
    ["cycles", result.cycles, budgets.minimumCycles, 1_000],
    ["driver-port", result.driverPort, 1, 65_535],
    ["port", result.port, 1, 65_535],
  ]) if (!Number.isSafeInteger(value) || value < minimum || value > maximum) fail(`invalid --${name}`);
  if (!result.driver || !result.firefoxBinary) fail("invalid driver or Firefox binary");
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
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    fail(`WebDriver ${method} ${path} transport failed: ${String(error)}`);
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.value?.error) fail(`WebDriver ${method} ${path} failed: ${JSON.stringify(payload)}`);
  return payload?.value;
}

async function waitForDriver(base, process) {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (process.exitCode !== null) fail(`WebDriver exited before readiness (${process.exitCode})`);
    const response = await fetch(`${base}/status`).catch(() => null);
    if (response?.ok) return;
    await delay(50);
  }
  fail("WebDriver readiness timeout");
}

async function execute(base, sessionId, script, args = []) {
  return webdriver(base, "POST", `/session/${sessionId}/execute/sync`, { script, args });
}

async function waitFor(base, sessionId, script, description) {
  for (let attempt = 0; attempt < 240; attempt += 1) {
    if (await execute(base, sessionId, script)) return;
    await delay(25);
  }
  fail(`timeout waiting for ${description}`);
}

async function click(base, sessionId, id) {
  const clicked = await execute(base, sessionId, `
    const node = document.querySelector(arguments[0]);
    if (!node) return false;
    node.click();
    return true;
  `, [`[data-luastra-id="${id}"]`]);
  if (!clicked) fail(`missing element: ${id}`);
}

async function diagnostics(base, sessionId) {
  return execute(base, sessionId, "return window.__luastraDiagnostics.snapshot()");
}

async function openExamples(base, sessionId) {
  await click(base, sessionId, "orbit/example-galaxy");
  await waitFor(base, sessionId, "return location.hash === '#/orbit/examples' && window.__luastraDiagnostics.snapshot().orbitLayout.nodeCount === 54", "Examples constellation");
}

async function returnRoot(base, sessionId) {
  await click(base, sessionId, "orbit/path/root");
  await waitFor(base, sessionId, "return location.hash === '#/orbit'", "root constellation");
}

async function openBuild(base, sessionId) {
  await click(base, sessionId, "orbit/explore");
  await waitFor(base, sessionId, "return location.hash === '#/orbit/build' && window.__luastraDiagnostics.snapshot().orbitLayout.nodeCount === 11", "Build constellation");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.browser === "safari" && process.platform !== "darwin") fail("Safari audit requires macOS");
  const repository = resolve(import.meta.dirname, "..");
  const applicationEvents = [];
  const application = await runProject({
    manifestPath: resolve(repository, "examples/constellation-orbit/luastra.json"),
    port: options.port,
    watch: false,
    onEvent: (event) => applicationEvents.push(event),
  });
  const driverPath = options.driver.includes("/") ? resolve(repository, options.driver) : options.driver;
  if (driverPath.includes("/")) await access(driverPath).catch(() => fail(`WebDriver executable is unavailable: ${driverPath}`));
  const driverArguments = options.browser === "safari" ? ["-p", String(options.driverPort)] : ["--port", String(options.driverPort)];
  const driver = spawn(driverPath, driverArguments, { stdio: ["ignore", "pipe", "pipe"] });
  let driverOutput = "";
  driver.stdout.on("data", (value) => { driverOutput += value; });
  driver.stderr.on("data", (value) => { driverOutput += value; });
  const base = `http://127.0.0.1:${options.driverPort}`;
  let sessionId = null;
  try {
    await waitForDriver(base, driver);
    const alwaysMatch = options.browser === "safari"
      ? { browserName: "safari" }
      : { browserName: "firefox", "moz:firefoxOptions": { binary: options.firefoxBinary, args: ["-headless"] } };
    const created = await webdriver(base, "POST", "/session", { capabilities: { alwaysMatch } });
    sessionId = created?.sessionId ?? fail("WebDriver did not return a session id");
    const browserCapabilities = {
      browserName: created.capabilities?.browserName ?? options.browser,
      browserVersion: created.capabilities?.browserVersion ?? null,
      platformName: created.capabilities?.platformName ?? null,
    };
    await webdriver(base, "POST", `/session/${sessionId}/window/rect`, { width: 1024, height: 800, x: 40, y: 40 });
    const url = `${application.url}?luastraDiagnostics=1#/orbit`;
    await webdriver(base, "POST", `/session/${sessionId}/url`, { url });
    await waitFor(base, sessionId, "return window.__luastraPreview?.result === 'PASS'", "Luastra preview PASS");
    await execute(base, sessionId, `
      window.__luastraOrbitAudit = { errors: [] };
      addEventListener("error", (event) => window.__luastraOrbitAudit.errors.push(String(event.error?.message ?? event.message ?? "error")));
      addEventListener("unhandledrejection", (event) => window.__luastraOrbitAudit.errors.push(String(event.reason?.message ?? event.reason ?? "unhandled rejection")));
      return true;
    `);
    const motionText = await execute(base, sessionId, "return document.querySelector('[data-luastra-id=\"orbit/path/motion\"]')?.textContent ?? ''");
    if (!motionText.includes("Off")) await click(base, sessionId, "orbit/path/motion");

    await openExamples(base, sessionId);
    await returnRoot(base, sessionId);
    await openBuild(base, sessionId);
    await returnRoot(base, sessionId);
    const initial = await diagnostics(base, sessionId);
    const stateSamples = [];
    for (let index = 0; index < options.cycles; index += 1) {
      await openExamples(base, sessionId);
      stateSamples.push({ cycle: index + 1, state: "examples", diagnostics: await diagnostics(base, sessionId) });
      await returnRoot(base, sessionId);
      stateSamples.push({ cycle: index + 1, state: "root-after-examples", diagnostics: await diagnostics(base, sessionId) });
      await openBuild(base, sessionId);
      stateSamples.push({ cycle: index + 1, state: "build", diagnostics: await diagnostics(base, sessionId) });
      await returnRoot(base, sessionId);
      stateSamples.push({ cycle: index + 1, state: "root-after-build", diagnostics: await diagnostics(base, sessionId) });
    }
    await delay(100);
    const final = await diagnostics(base, sessionId);
    const browserState = await execute(base, sessionId, `return {
      errors: [...window.__luastraOrbitAudit.errors],
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    }`);
    const orbitSamples = stateSamples.map((entry) => entry.diagnostics.orbitLayout);
    const measuredLayoutPasses = final.orbitLayout.layoutPasses - initial.orbitLayout.layoutPasses;
    const measuredLayoutDurationMs = (final.orbitLayout.averageLayoutDurationMs * final.orbitLayout.layoutPasses)
      - (initial.orbitLayout.averageLayoutDurationMs * initial.orbitLayout.layoutPasses);
    const measuredAverageLayoutDurationMs = measuredLayoutPasses === 0 ? 0 : measuredLayoutDurationMs / measuredLayoutPasses;
    const measuredMaximumLayoutDurationMs = Math.max(...orbitSamples.map((value) => value.lastLayoutDurationMs));
    const assertions = {
      previewPass: final.result === "PASS",
      noErrors: browserState.errors.length === 0,
      noPendingRequests: final.pendingRequests === 0,
      noActiveMotion: final.activeMotionCount === 0,
      noFrameTask: final.activeFrameTaskCount === 0 && final.framePending === false,
      boundedAverageLayout: measuredAverageLayoutDurationMs <= budgets.averageLayoutDurationMs,
      boundedMaximumLayout: measuredMaximumLayoutDurationMs <= budgets.maximumLayoutDurationMs,
      boundedWasmGrowth: final.wasmMemoryBytes - initial.wasmMemoryBytes <= budgets.wasmMemoryGrowthBytes,
      boundedRetainedConstellations: orbitSamples.every((value) => value.constellationCount <= budgets.maximumConstellationCount),
      boundedRetainedNodes: orbitSamples.every((value) => value.nodeCount <= budgets.maximumRetainedNodeCount),
      stableRootDom: final.domNodeCount === initial.domNodeCount,
      stableRootLayers: final.orbitLayout.constellationCount === initial.orbitLayout.constellationCount,
      stableRootNodes: final.orbitLayout.nodeCount === initial.orbitLayout.nodeCount,
      noHorizontalOverflow: browserState.horizontalOverflow === 0,
    };
    const targetsMet = {
      averageLayout: measuredAverageLayoutDurationMs <= targets.averageLayoutDurationMs,
      maximumLayout: measuredMaximumLayoutDurationMs <= targets.maximumLayoutDurationMs,
    };
    const result = Object.values(assertions).every(Boolean) ? "PASS" : "FAIL";
    const report = {
      schemaVersion: 1,
      evidenceClass: `REAL_${options.browser.toUpperCase()}_ORBIT_INTERACTION_PERFORMANCE`,
      startedAt: new Date().toISOString(),
      browser: options.browser,
      browserCapabilities,
      project: "dev.luastra.constellation-orbit",
      url,
      cycles: options.cycles,
      interactions: options.cycles * 4,
      budgets,
      targets,
      applicationEvents,
      measuredLayoutPasses,
      measuredAverageLayoutDurationMs,
      measuredMaximumLayoutDurationMs,
      assertions,
      targetsMet,
      initial,
      final,
      browserState,
      stateSummary: stateSamples.map(({ cycle, state, diagnostics: value }) => ({ cycle, state, orbitLayout: value.orbitLayout })),
      result,
      boundary: `${options.browser} WebDriver measures the real browser host, Wasm memory, DOM retention, and Orbit diagnostics. It does not expose a comparable explicitly garbage-collected JavaScript heap measurement and does not replace assistive-technology, native-shell, or low-end-device evidence.`,
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
