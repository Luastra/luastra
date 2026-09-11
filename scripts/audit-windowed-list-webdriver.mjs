import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { resolve } from "node:path";

import { runProject } from "../project/run-project.mjs";

function fail(message) { throw new Error(message); }
function delay(milliseconds) { return new Promise((accept) => setTimeout(accept, milliseconds)); }

function parseArguments(values) {
  const result = { browser: null, driver: null, driverPort: 4470, firefoxBinary: "/Applications/Firefox.app/Contents/MacOS/firefox", port: 4221 };
  for (const value of values) {
    const [name, raw] = value.split("=", 2);
    if (name === "--browser") result.browser = raw;
    else if (name === "--driver") result.driver = raw;
    else if (name === "--driver-port") result.driverPort = Number(raw);
    else if (name === "--firefox-binary") result.firefoxBinary = raw;
    else if (name === "--port") result.port = Number(raw);
    else fail(`unknown option: ${value}`);
  }
  if (!new Set(["firefox", "safari"]).has(result.browser)) fail("--browser must be firefox or safari");
  result.driver ??= result.browser === "safari" ? "/usr/bin/safaridriver" : "geckodriver";
  for (const [name, value] of [["driver-port", result.driverPort], ["port", result.port]]) {
    if (!Number.isSafeInteger(value) || value < 1 || value > 65_535) fail(`invalid --${name}`);
  }
  return result;
}

async function webdriver(base, method, path, body) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  }).catch((error) => fail(`WebDriver ${method} ${path} transport failed: ${String(error)}`));
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.value?.error) fail(`WebDriver ${method} ${path} failed: ${JSON.stringify(payload)}`);
  return payload?.value;
}

async function waitForDriver(base, process) {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (process.exitCode !== null) fail(`WebDriver exited before readiness (${process.exitCode})`);
    if ((await fetch(`${base}/status`).catch(() => null))?.ok) return;
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

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.browser === "safari" && process.platform !== "darwin") fail("Safari audit requires macOS");
  const repository = resolve(import.meta.dirname, "..");
  const application = await runProject({ manifestPath: resolve(repository, "examples/state-foundations/luastra.json"), port: options.port, watch: false });
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
    await webdriver(base, "POST", `/session/${sessionId}/window/rect`, { width: 900, height: 700, x: 30, y: 30 });
    await webdriver(base, "POST", `/session/${sessionId}/url`, { url: `${application.url}?luastraDiagnostics=1` });
    try {
      await waitFor(base, sessionId, "return window.__luastraPreview?.result === 'PASS'", "Luastra preview PASS");
    } catch (error) {
      const state = await execute(base, sessionId, `return {
        href: location.href,
        readyState: document.readyState,
        title: document.title,
        preview: window.__luastraPreview ?? null,
        diagnostics: window.__luastraDiagnostics?.snapshot?.() ?? null,
        startupState: document.querySelector('#startup-state')?.textContent ?? null,
        error: document.querySelector('#error')?.textContent ?? null,
        body: document.body?.innerText?.slice(0, 1000) ?? null,
      }`).catch(() => null);
      throw new Error(`${error.message}: ${JSON.stringify(state)}`);
    }
    await execute(base, sessionId, `
      window.__luastraWindowedAudit = { errors: [] };
      addEventListener("error", (event) => window.__luastraWindowedAudit.errors.push(String(event.error?.message ?? event.message ?? "error")));
      addEventListener("unhandledrejection", (event) => window.__luastraWindowedAudit.errors.push(String(event.reason?.message ?? event.reason ?? "unhandled rejection")));
      return true;
    `);

    await click(base, sessionId, "records/load");
    await waitFor(base, sessionId, "return document.querySelector('[data-luastra-id=\"records/count\"]')?.textContent === '100'", "initial records");
    for (let pageIndex = 0; pageIndex < 3; pageIndex += 1) await click(base, sessionId, "records/next");
    await waitFor(base, sessionId, "return document.querySelector('[data-luastra-id=\"records/first\"]')?.textContent === '101'", "forward eviction");
    const anchorBefore = await execute(base, sessionId, `
      const anchor = document.querySelector('[data-luastra-id="records/items/record-101"]');
      scrollTo(0, scrollY + anchor.getBoundingClientRect().top);
      window.dispatchEvent(new Event("scroll"));
      return anchor.getBoundingClientRect().top;
    `);
    try {
      await waitFor(base, sessionId, "return document.querySelector('[data-luastra-id=\"records/first\"]')?.textContent === '1'", "backward reload");
    } catch (error) {
      const state = await execute(base, sessionId, `
        const list = document.querySelector('[data-luastra-id="records/items"]');
        const anchor = document.querySelector('[data-luastra-id="records/items/record-101"]');
        return { first: document.querySelector('[data-luastra-id="records/first"]')?.textContent ?? null, scrollY, innerHeight, listTop: list?.getBoundingClientRect().top ?? null, anchorTop: anchor?.getBoundingClientRect().top ?? null, diagnostics: window.__luastraDiagnostics?.snapshot?.() ?? null };
      `).catch(() => null);
      throw new Error(`${error.message}: ${JSON.stringify(state)}`);
    }
    await delay(150);
    const anchorAfter = await execute(base, sessionId, "return document.querySelector('[data-luastra-id=\"records/items/record-101\"]')?.getBoundingClientRect().top ?? null");

    const remeasurement = await execute(base, sessionId, `
      document.documentElement.style.overflowAnchor = "none";
      document.body.style.overflowAnchor = "none";
      const list = document.querySelector('[data-luastra-id="records/items"]');
      const connected = [...list.children].filter((node) => node.dataset.luastraId);
      const anchorIndex = connected.findIndex((node) => node.getBoundingClientRect().top >= 0);
      const anchor = connected[Math.max(1, anchorIndex)];
      const changed = connected[Math.max(0, anchorIndex - 2)];
      const before = anchor.getBoundingClientRect().top;
      changed.style.minHeight = (changed.getBoundingClientRect().height + 120) + "px";
      changed.dispatchEvent(new Event("load", { bubbles: true }));
      window.__luastraWindowedAudit.remeasurement = { anchorId: anchor.dataset.luastraId, before };
      return true;
    `);
    if (!remeasurement) fail("unable to start remeasurement probe");
    await delay(150);
    const remeasurementResult = await execute(base, sessionId, `
      const probe = window.__luastraWindowedAudit.remeasurement;
      return { ...probe, after: document.querySelector('[data-luastra-id="' + probe.anchorId + '"]')?.getBoundingClientRect().top ?? null };
    `);

    const focusPin = await execute(base, sessionId, `
      const list = document.querySelector('[data-luastra-id="records/items"]');
      const node = [...list.children].find((item) => item.dataset.luastraId && item.getBoundingClientRect().bottom > 0);
      node.tabIndex = -1;
      node.focus();
      window.__luastraWindowedAudit.focusId = node.dataset.luastraId;
      scrollBy(0, 1800);
      return true;
    `);
    if (!focusPin) fail("unable to start focus probe");
    await delay(150);
    const focusResult = await execute(base, sessionId, `
      const list = document.querySelector('[data-luastra-id="records/items"]');
      const id = window.__luastraWindowedAudit.focusId;
      const node = document.querySelector('[data-luastra-id="' + id + '"]');
      const connected = [...list.children].filter((item) => item.dataset.luastraId);
      return { id, activeId: document.activeElement?.dataset?.luastraId ?? null, connected: node?.isConnected === true, connectedItems: connected.length, spacerCount: list.querySelectorAll(':scope > .luastra-window-spacer').length };
    `);
    await webdriver(base, "POST", `/session/${sessionId}/window/rect`, { width: 720, height: 600, x: 30, y: 30 });
    await delay(150);
    const sample = await execute(base, sessionId, `
      const list = document.querySelector('[data-luastra-id="records/items"]');
      const connected = [...list.children].filter((node) => node.dataset.luastraId);
      return {
        diagnostics: window.__luastraDiagnostics.snapshot(),
        errors: [...window.__luastraWindowedAudit.errors],
        windowState: list.dataset.luastraListWindowState,
        connectedItems: connected.length,
        spacerCount: list.querySelectorAll(':scope > .luastra-window-spacer').length,
        setSize: connected[0]?.getAttribute("aria-setsize") ?? null,
      };
    `);
    const listDiagnostics = sample.diagnostics.windowedLists[0];
    const assertions = {
      previewPass: sample.diagnostics.result === "PASS",
      noRuntimeErrors: sample.errors.length === 0,
      windowed: sample.windowState === "windowed",
      boundedDom: sample.connectedItems === listDiagnostics.realizedItems && sample.connectedItems < 50,
      boundedMeasurements: listDiagnostics.measuredItems <= 300,
      retainedCollection: listDiagnostics.retainedItems === 300,
      logicalTotal: sample.setSize === "100000",
      evictionAnchorStable: Number.isFinite(anchorAfter) && Math.abs(anchorAfter - anchorBefore) <= 2,
      remeasurementAnchorStable: Number.isFinite(remeasurementResult.after) && Math.abs(remeasurementResult.after - remeasurementResult.before) <= 2,
      boundedFocusPin: focusResult.activeId === focusResult.id && focusResult.connected && focusResult.connectedItems < 50 && focusResult.spacerCount === 3,
    };
    const report = {
      schemaVersion: 1,
      evidenceClass: `REAL_${options.browser.toUpperCase()}_WINDOWED_LIST`,
      browserCapabilities: created.capabilities,
      project: "dev.luastra.state-foundations",
      assertions,
      sample: { ...sample, anchorBefore, anchorAfter, remeasurement: remeasurementResult, focusPin: focusResult },
      result: Object.values(assertions).every(Boolean) ? "PASS" : "FAIL",
      boundary: `${options.browser} WebDriver covers bounded DOM and measurements, bidirectional eviction/reload, stable-anchor remeasurement, focus pinning, and a real window resize. It does not replace assistive-technology, native-shell, low-end-device, or font-scaling evidence.`,
    };
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (report.result !== "PASS") process.exitCode = 1;
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
