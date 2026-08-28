import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { runProject } from "../project/run-project.mjs";

function fail(message) {
  throw new Error(message);
}

function delay(milliseconds) {
  return new Promise((accept) => setTimeout(accept, milliseconds));
}

function parseArguments(values) {
  const result = { driverPort: 4450, expected: null, output: null, port: 4198 };
  for (const value of values) {
    const [name, raw] = value.split("=", 2);
    if (name === "--driver-port") result.driverPort = Number(raw);
    else if (name === "--expected") result.expected = raw;
    else if (name === "--out") result.output = raw;
    else if (name === "--port") result.port = Number(raw);
    else fail(`unknown option: ${value}`);
  }
  if (!["100", "200"].includes(result.expected)) fail("--expected must be 100 or 200");
  for (const [name, value] of [["driver-port", result.driverPort], ["port", result.port]]) {
    if (!Number.isSafeInteger(value) || value < 1 || value > 65_535) fail(`invalid --${name}`);
  }
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
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (await execute(base, sessionId, script)) return;
    await delay(50);
  }
  fail(`timeout waiting for ${description}`);
}

const layoutScript = `
  const visible = (node) => node && !node.hidden && node.getClientRects().length > 0;
  const actions = [...document.querySelectorAll('button, input, select, textarea, a[href]')].filter(visible);
  return {
    innerWidth: window.innerWidth,
    outerWidth: window.outerWidth,
    visualViewportWidth: window.visualViewport?.width ?? null,
    horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    minimumTarget: actions.reduce((minimum, node) => Math.min(minimum, node.getBoundingClientRect().height, node.getBoundingClientRect().width), Infinity),
    actions: actions.map((node) => ({ id: node.id, width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height })),
  };
`;

async function main() {
  if (process.platform !== "darwin") fail("Safari zoom audit requires macOS");
  const options = parseArguments(process.argv.slice(2));
  const prototype = resolve(import.meta.dirname, "..");
  const applicationEvents = [];
  const application = await runProject({
    manifestPath: resolve(prototype, "test-fixtures/accessibility-lab/luastra.json"),
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
    const observation = await execute(base, sessionId, layoutScript);
    const expectedZoomed = options.expected === "200";
    const observedScale = observation.outerWidth / observation.visualViewportWidth;
    const assertions = {
      viewportMatchesExpectedZoom: expectedZoomed
        ? observedScale >= 1.9 && observedScale <= 2.1
        : observedScale >= 0.98 && observedScale <= 1.02,
      noHorizontalOverflow: observation.horizontalOverflow === 0,
      targetsRemainOperable: observation.minimumTarget >= 44,
    };
    const result = Object.values(assertions).every(Boolean) ? "PASS" : "FAIL";
    const report = {
      schemaVersion: 1,
      blocker: 10,
      evidenceClass: "REAL_SAFARI_PERSISTED_BROWSER_ZOOM",
      startedAt: new Date().toISOString(),
      browser: "Safari via Apple SafariDriver after owner browser command",
      project: "dev.luastra.accessibility-lab",
      url,
      applicationEvents,
      expectedPercent: Number(options.expected),
      observedScale,
      observation,
      assertions,
      result,
      boundary: "The owner changed real Safari page zoom outside the remote session because Safari terminates a controlled session on manual interaction. This fresh session records Safari's persisted real page zoom; paired 100% and 200% reports are required and this is not CSS zoom emulation.",
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
