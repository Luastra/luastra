#!/usr/bin/env node

import { spawn } from "node:child_process";
import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { runProject } from "../project/run-project.mjs";

function fail(message) { throw new Error(message); }
function delay(milliseconds) { return new Promise((accept) => setTimeout(accept, milliseconds)); }

function options(values) {
  const result = {
    baselineUrl: "https://luastra.dev/", browser: null, candidatePort: 4213, cycles: 3,
    driver: null, driverPort: 4463,
    firefoxBinary: "/Applications/Firefox.app/Contents/MacOS/firefox", output: null,
  };
  for (const value of values) {
    const [name, raw] = value.split("=", 2);
    if (name === "--baseline-url") result.baselineUrl = raw;
    else if (name === "--browser") result.browser = raw;
    else if (name === "--candidate-port") result.candidatePort = Number(raw);
    else if (name === "--cycles") result.cycles = Number(raw);
    else if (name === "--driver") result.driver = raw;
    else if (name === "--driver-port") result.driverPort = Number(raw);
    else if (name === "--firefox-binary") result.firefoxBinary = raw;
    else if (name === "--out") result.output = raw;
    else fail(`unknown option: ${value}`);
  }
  if (!new Set(["firefox", "safari"]).has(result.browser)) fail("--browser must be firefox or safari");
  result.driver ??= result.browser === "safari" ? "/usr/bin/safaridriver" : "geckodriver";
  for (const [name, value] of [["candidate-port", result.candidatePort], ["driver-port", result.driverPort]]) {
    if (!Number.isSafeInteger(value) || value < 1 || value > 65_535) fail(`invalid --${name}`);
  }
  if (!Number.isSafeInteger(result.cycles) || result.cycles < 3 || result.cycles > 10) fail("--cycles must be an integer from 3 to 10");
  if (!/^https:\/\//.test(result.baselineUrl)) fail("--baseline-url must use HTTPS");
  if (result.output !== null && !result.output) fail("invalid --out");
  return result;
}

async function webdriver(base, method, path, body) {
  let response;
  try {
    response = await fetch(`${base}${path}`, {
      method, headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(20_000),
    });
  } catch (error) { fail(`WebDriver ${method} ${path} transport failed: ${String(error)}`); }
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
  for (let attempt = 0; attempt < 400; attempt += 1) {
    if (await execute(base, sessionId, script)) return;
    await delay(25);
  }
  fail(`timeout waiting for ${description}`);
}

function percentile(values, fraction) {
  const ordered = [...values].sort((left, right) => left - right);
  return ordered[Math.min(ordered.length - 1, Math.ceil(ordered.length * fraction) - 1)];
}

function summary(samples, key) {
  const values = samples.map((sample) => sample[key]);
  return { minimum: Math.min(...values), median: percentile(values, 0.5), p95: percentile(values, 0.95), maximum: Math.max(...values) };
}

function summarize(samples) {
  const keys = [
    "responseStartMs", "domContentLoadedMs", "loadEventMs", "firstPaintMs", "firstContentfulPaintMs",
    "transferSizeBytes", "encodedBodySizeBytes", "decodedBodySizeBytes", "resourceCount", "domNodeCount",
    "visibleTextCharacters", "interactionToDocumentationMs",
  ];
  return Object.fromEntries(keys.map((key) => [key, summary(samples, key)]));
}

function ratios(baseline, candidate) {
  return Object.fromEntries(Object.keys(candidate).map((key) => {
    const denominator = baseline[key]?.median;
    return [key, denominator > 0 ? candidate[key].median / denominator : null];
  }));
}

function selectedRatios(baseline, candidate, keys) {
  return Object.fromEntries(keys.map((key) => [key, baseline[key] > 0 ? candidate[key] / baseline[key] : null]));
}

function navigationUrl(baseUrl, cycle) {
  const url = new URL(baseUrl);
  url.searchParams.set("luastraBaselineCycle", String(cycle));
  return url.href;
}

async function navigationSample(base, sessionId, url, docsHash) {
  await webdriver(base, "POST", `/session/${sessionId}/url`, { url });
  await waitFor(base, sessionId,
    "return document.readyState === 'complete' && document.querySelector('#host-root')?.children.length > 0 && !document.querySelector('#error:not([hidden])')", url);
  await execute(base, sessionId, "return new Promise((accept) => requestAnimationFrame(() => requestAnimationFrame(() => accept(true))))");
  await delay(100);
  const page = await execute(base, sessionId, `
    const navigation = performance.getEntriesByType("navigation")[0];
    const paints = Object.fromEntries(performance.getEntriesByType("paint").map((entry) => [entry.name, entry.startTime]));
    const resources = performance.getEntriesByType("resource");
    const entries = [navigation, ...resources].filter(Boolean);
    const error = document.querySelector("#error:not([hidden])");
    return {
      url: location.href, title: document.title, readyState: document.readyState,
      responseStartMs: navigation?.responseStart ?? 0,
      domContentLoadedMs: navigation?.domContentLoadedEventEnd ?? 0,
      loadEventMs: navigation?.loadEventEnd ?? 0,
      firstPaintMs: paints["first-paint"] ?? 0,
      firstContentfulPaintMs: paints["first-contentful-paint"] ?? 0,
      paintTimingAvailable: Object.keys(paints).length > 0,
      transferSizeBytes: entries.reduce((total, entry) => total + (entry.transferSize ?? 0), 0),
      encodedBodySizeBytes: entries.reduce((total, entry) => total + (entry.encodedBodySize ?? 0), 0),
      decodedBodySizeBytes: entries.reduce((total, entry) => total + (entry.decodedBodySize ?? 0), 0),
      resourceCount: entries.length,
      largestResources: entries.map((entry) => ({
        url: entry.name, type: entry.entryType === "navigation" ? "document" : entry.initiatorType,
        transferSizeBytes: entry.transferSize ?? 0, encodedBodySizeBytes: entry.encodedBodySize ?? 0,
        decodedBodySizeBytes: entry.decodedBodySize ?? 0, durationMs: entry.duration ?? 0,
      })).sort((left, right) => right.decodedBodySizeBytes - left.decodedBodySizeBytes).slice(0, 10),
      domNodeCount: document.getElementsByTagName("*").length,
      visibleTextCharacters: (document.body.innerText ?? "").replace(/\\s+/g, " ").trim().length,
      horizontalOverflowPx: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      error: error?.textContent?.trim() ?? null,
    };
  `);
  const interactionToDocumentationMs = await execute(base, sessionId, `
    return new Promise((accept, reject) => {
      const started = performance.now();
      location.hash = arguments[0];
      const deadline = started + 5000;
      const check = () => {
        const content = document.querySelector('[data-luastra-id="docs/content"], #content');
        if (content) requestAnimationFrame(() => requestAnimationFrame(() => accept(performance.now() - started)));
        else if (performance.now() >= deadline) reject(new Error("documentation route timeout"));
        else setTimeout(check, 16);
      };
      check();
    });
  `, [docsHash]);
  await delay(100);
  return { ...page, interactionToDocumentationMs };
}

async function main() {
  const selected = options(process.argv.slice(2));
  if (selected.browser === "safari" && process.platform !== "darwin") fail("Safari audit requires macOS");
  const repository = resolve(import.meta.dirname, "..");
  const applicationEvents = [];
  const application = await runProject({
    manifestPath: resolve(repository, "website/app/luastra.json"), port: selected.candidatePort, watch: false,
    onEvent: (event) => applicationEvents.push(event),
  });
  const driverPath = selected.driver.includes("/") ? resolve(repository, selected.driver) : selected.driver;
  if (driverPath.includes("/")) await access(driverPath).catch(() => fail(`WebDriver executable is unavailable: ${driverPath}`));
  const driverArguments = selected.browser === "safari" ? ["-p", String(selected.driverPort)] : ["--port", String(selected.driverPort)];
  const driver = spawn(driverPath, driverArguments, { stdio: ["ignore", "pipe", "pipe"] });
  let driverOutput = "";
  driver.stdout.on("data", (value) => { driverOutput += value; });
  driver.stderr.on("data", (value) => { driverOutput += value; });
  const base = `http://127.0.0.1:${selected.driverPort}`;
  let sessionId = null;
  try {
    await waitForDriver(base, driver);
    const alwaysMatch = selected.browser === "safari"
      ? { browserName: "safari" }
      : { browserName: "firefox", "moz:firefoxOptions": { binary: selected.firefoxBinary, args: ["-headless"] } };
    const created = await webdriver(base, "POST", "/session", { capabilities: { alwaysMatch } });
    sessionId = created?.sessionId ?? fail("WebDriver did not return a session id");
    const browserCapabilities = {
      browserName: created.capabilities?.browserName ?? selected.browser,
      browserVersion: created.capabilities?.browserVersion ?? null,
      platformName: created.capabilities?.platformName ?? null,
    };
    const candidateUrl = `${application.url}#/`;
    const baselineSamples = [];
    const candidateSamples = [];
    for (let cycle = 1; cycle <= selected.cycles; cycle += 1) {
      baselineSamples.push(await navigationSample(base, sessionId, navigationUrl(selected.baselineUrl, cycle), "#docs/content"));
      candidateSamples.push(await navigationSample(base, sessionId, navigationUrl(candidateUrl, cycle), "#/docs/overview"));
    }
    const baselineSummary = summarize(baselineSamples);
    const candidateSummary = summarize(candidateSamples);
    const assertions = {
      baselineLoaded: baselineSamples.every((sample) => sample.readyState === "complete" && sample.error === null),
      candidateLoaded: candidateSamples.every((sample) => sample.readyState === "complete" && sample.error === null),
      noHorizontalOverflow: [...baselineSamples, ...candidateSamples].every((sample) => sample.horizontalOverflowPx === 0),
      finiteMeasurements: [...baselineSamples, ...candidateSamples].every((sample) =>
        Object.values(sample).every((value) => typeof value !== "number" || Number.isFinite(value))),
    };
    const result = Object.values(assertions).every(Boolean) ? "PASS" : "FAIL";
    const report = {
      schemaVersion: 1, evidenceClass: `REAL_${selected.browser.toUpperCase()}_PUBLIC_BASELINE_COMPARISON`,
      startedAt: new Date().toISOString(), browser: selected.browser, browserCapabilities, cycles: selected.cycles,
      urls: { baseline: selected.baselineUrl, candidate: candidateUrl }, applicationEvents, assertions,
      baseline: { summary: baselineSummary, samples: baselineSamples },
      candidate: { summary: candidateSummary, samples: candidateSamples },
      candidateToBaselineMedianRatio: ratios(baselineSummary, candidateSummary),
      firstNavigationResourceRatio: selectedRatios(baselineSamples[0], candidateSamples[0],
        ["transferSizeBytes", "encodedBodySizeBytes", "decodedBodySizeBytes", "resourceCount"]),
      result,
      boundary: `${selected.browser} WebDriver compares repeated public-network and local-candidate navigations in one browser session. A unique document query is used per cycle, but subresource cache control and reporting are browser-owned. Resource-size ratios must use firstNavigationResourceRatio because WebKit can omit cached response sizes in later Performance entries. Encoded transfer bytes reflect public HTTP compression while first-navigation decoded bytes are comparable. Paint Timing may be unavailable. The public baseline already renders documentation while the candidate measures an Orbit-to-documentation transition, so navigation and interaction ratios are observational rather than release budgets.`,
    };
    const reportText = `${JSON.stringify(report, null, 2)}\n`;
    if (selected.output !== null) {
      const output = resolve(selected.output);
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
