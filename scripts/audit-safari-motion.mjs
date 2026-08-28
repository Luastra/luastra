import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { runProject } from "../project/run-project.mjs";

function fail(message) { throw new Error(message); }
function delay(milliseconds) { return new Promise((accept) => setTimeout(accept, milliseconds)); }

function parseArguments(values) {
  const result = { driverPort: 4448, expected: null, output: null, port: 4196, project: "examples/animated-catalogue/luastra.json" };
  for (const value of values) {
    const [name, raw] = value.split("=", 2);
    if (name === "--driver-port") result.driverPort = Number(raw);
    else if (name === "--expected") result.expected = raw;
    else if (name === "--out") result.output = raw;
    else if (name === "--port") result.port = Number(raw);
    else if (name === "--project") result.project = raw;
    else fail(`unknown option: ${value}`);
  }
  if (!new Set(["reduce", "no-preference"]).has(result.expected)) fail("--expected must be reduce or no-preference");
  for (const [name, value] of [["driver-port", result.driverPort], ["port", result.port]]) {
    if (!Number.isSafeInteger(value) || value < 1 || value > 65_535) fail(`invalid --${name}`);
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

async function execute(base, sessionId, script) {
  return webdriver(base, "POST", `/session/${sessionId}/execute/sync`, { script, args: [] });
}

async function waitFor(base, sessionId, script, description) {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (await execute(base, sessionId, script)) return;
    await delay(25);
  }
  fail(`timeout waiting for ${description}`);
}

async function click(base, sessionId, selector) {
  const clicked = await webdriver(base, "POST", `/session/${sessionId}/execute/sync`, {
    script: `
      const node = document.querySelector(arguments[0]);
      if (!node) return false;
      node.click();
      return true;
    `,
    args: [selector],
  });
  if (!clicked) fail(`missing element: ${selector}`);
}

function isFinal(sample) {
  return sample.exists && sample.opacity === 1 && /translate3d\(0px, 0px, 0px\)/.test(sample.transform);
}

async function main() {
  if (process.platform !== "darwin") fail("Safari motion audit requires macOS");
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
    await webdriver(base, "POST", `/session/${sessionId}/window/rect`, { width: 1024, height: 850, x: 30, y: 30 });
    const url = `${application.url}?luastraDiagnostics=1`;
    await webdriver(base, "POST", `/session/${sessionId}/url`, { url });
    await waitFor(base, sessionId, "return window.__luastraPreview?.result === 'PASS'", "Luastra preview PASS");
    await execute(base, sessionId, `
      window.__luastraSafariMotionAudit = { errors: [] };
      window.addEventListener('error', (event) => window.__luastraSafariMotionAudit.errors.push(String(event.error?.message ?? event.message ?? 'error')));
      window.addEventListener('unhandledrejection', (event) => window.__luastraSafariMotionAudit.errors.push(String(event.reason?.message ?? event.reason ?? 'unhandled rejection')));
    `);

    const reducedMotion = await execute(base, sessionId, "return matchMedia('(prefers-reduced-motion: reduce)').matches");
    await click(base, sessionId, '[data-luastra-id="catalogue/breathe/open"]');
    await waitFor(base, sessionId, "return Boolean(document.querySelector('[data-luastra-id=\"detail/back\"]'))", "detail route");
    await click(base, sessionId, '[data-luastra-id="detail/back"]');
    await waitFor(base, sessionId, "return Boolean(document.querySelector('[data-luastra-id=\"catalogue/breathe\"]'))", "catalogue return");

    const started = performance.now();
    const samples = [];
    for (let index = 0; index < 35; index += 1) {
      const value = await execute(base, sessionId, `
        const node = document.querySelector('[data-luastra-id="catalogue/breathe"]');
        return {
          exists: Boolean(node),
          opacity: node ? Number.parseFloat(node.style.opacity || getComputedStyle(node).opacity) : null,
          transform: node?.style.transform ?? '',
          activeMotionCount: window.__luastraDiagnostics?.snapshot?.().activeMotionCount ?? null,
        };
      `);
      samples.push({ elapsedMs: performance.now() - started, ...value });
      await delay(10);
    }
    await delay(350);
    const final = await execute(base, sessionId, `
      const node = document.querySelector('[data-luastra-id="catalogue/breathe"]');
      return {
        exists: Boolean(node),
        opacity: node ? Number.parseFloat(node.style.opacity || getComputedStyle(node).opacity) : null,
        transform: node?.style.transform ?? '',
        activeMotionCount: window.__luastraDiagnostics?.snapshot?.().activeMotionCount ?? null,
      };
    `);
    const errors = await execute(base, sessionId, "return [...window.__luastraSafariMotionAudit.errors]");
    const observedIntermediate = samples.some((sample) => sample.activeMotionCount > 0 || (sample.opacity > 0 && sample.opacity < 1) || (sample.transform && !isFinal(sample)));
    const expectedReduced = options.expected === "reduce";
    const assertions = {
      systemPreferenceMatchesExpectation: reducedMotion === expectedReduced,
      noErrors: errors.length === 0,
      finalStateMatches: isFinal(final) && final.activeMotionCount === 0,
      ordinaryMotionObserved: expectedReduced || observedIntermediate,
      reducedMotionScheduledNothing: !expectedReduced || samples.every((sample) => sample.activeMotionCount === 0 && isFinal(sample)),
    };
    const result = Object.values(assertions).every(Boolean) ? "PASS" : "FAIL";
    const report = {
      schemaVersion: 1,
      blocker: 10,
      evidenceClass: "REAL_SAFARI_SYSTEM_REDUCED_MOTION",
      startedAt: new Date().toISOString(),
      browser: "Safari via Apple SafariDriver",
      project: "dev.luastra.animated-catalogue",
      url,
      expectedPreference: options.expected,
      observedReducedMotion: reducedMotion,
      applicationEvents,
      samples,
      final,
      errors,
      assertions,
      result,
      boundary: "This runner reads the real macOS/Safari prefers-reduced-motion setting and never emulates or overrides it. A complete A/B gate requires one PASS with no-preference and one PASS with reduce on the same code.",
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
