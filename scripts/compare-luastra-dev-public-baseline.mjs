#!/usr/bin/env node

import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";

import { runProject } from "../project/run-project.mjs";

const DEFAULT_CYCLES = 5;

function fail(message) { throw new Error(message); }
function delay(milliseconds) { return new Promise((accept) => setTimeout(accept, milliseconds)); }

function options(values) {
  const result = {
    baselineUrl: "https://luastra.dev/",
    browser: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    browserPort: 9233,
    candidatePort: 4205,
    cycles: DEFAULT_CYCLES,
    output: null,
  };
  for (const value of values) {
    const [name, raw] = value.split("=", 2);
    if (name === "--baseline-url") result.baselineUrl = raw;
    else if (name === "--browser") result.browser = raw;
    else if (name === "--browser-port") result.browserPort = Number(raw);
    else if (name === "--candidate-port") result.candidatePort = Number(raw);
    else if (name === "--cycles") result.cycles = Number(raw);
    else if (name === "--out") result.output = raw;
    else fail(`unknown option: ${value}`);
  }
  for (const [name, value] of [["browser-port", result.browserPort], ["candidate-port", result.candidatePort]]) {
    if (!Number.isSafeInteger(value) || value < 1 || value > 65_535) fail(`invalid --${name}`);
  }
  if (!Number.isSafeInteger(result.cycles) || result.cycles < 3 || result.cycles > 20) fail("--cycles must be an integer from 3 to 20");
  if (!/^https:\/\//.test(result.baselineUrl)) fail("--baseline-url must use HTTPS");
  if (result.output !== null && !result.output) fail("invalid --out");
  return result;
}

class CdpClient {
  #id = 0; #pending = new Map(); #socket;
  constructor(url) {
    this.#socket = new WebSocket(url);
    this.ready = new Promise((accept, reject) => {
      this.#socket.addEventListener("open", accept, { once: true });
      this.#socket.addEventListener("error", () => reject(new Error("CDP WebSocket failed")), { once: true });
    });
    this.#socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (!message.id) return;
      const pending = this.#pending.get(message.id);
      if (!pending) return;
      this.#pending.delete(message.id);
      if (message.error) pending.reject(new Error(`CDP ${pending.method} failed: ${JSON.stringify(message.error)}`));
      else pending.resolve(message.result);
    });
  }
  async send(method, params = {}) {
    await this.ready;
    const id = ++this.#id;
    return new Promise((accept, reject) => {
      this.#pending.set(id, { method, resolve: accept, reject });
      this.#socket.send(JSON.stringify({ id, method, params }));
    });
  }
  close() { this.#socket.close(); }
}

async function waitForPage(port, process) {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (process.exitCode !== null) fail(`Chromium exited before readiness (${process.exitCode})`);
    const pages = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.ok ? response.json() : null).catch(() => null);
    const page = pages?.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
    if (page) return page;
    await delay(50);
  }
  fail("Chromium CDP readiness timeout");
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) fail(`browser evaluation failed: ${result.exceptionDetails.text}`);
  return result.result?.value;
}

async function waitFor(client, expression, description) {
  for (let attempt = 0; attempt < 400; attempt += 1) {
    if (await evaluate(client, expression)) return;
    await delay(25);
  }
  fail(`timeout waiting for ${description}`);
}

function metricMap(metrics) {
  return Object.fromEntries(metrics.map(({ name, value }) => [name, value]));
}

function percentile(values, fraction) {
  const ordered = [...values].sort((left, right) => left - right);
  return ordered[Math.min(ordered.length - 1, Math.ceil(ordered.length * fraction) - 1)];
}

function summary(samples, key) {
  const values = samples.map((sample) => sample[key]);
  return {
    minimum: Math.min(...values),
    median: percentile(values, 0.5),
    p95: percentile(values, 0.95),
    maximum: Math.max(...values),
  };
}

async function coldNavigation(client, url, docsHash) {
  await client.send("Network.clearBrowserCache");
  await client.send("Page.navigate", { url });
  await waitFor(client, `document.readyState === "complete" && document.querySelector("#host-root")?.children.length > 0 && !document.querySelector("#error:not([hidden])")`, url);
  await evaluate(client, "new Promise((accept) => requestAnimationFrame(() => requestAnimationFrame(accept)))");
  await delay(100);

  const page = await evaluate(client, `(() => {
    const navigation = performance.getEntriesByType("navigation")[0];
    const paints = Object.fromEntries(performance.getEntriesByType("paint").map((entry) => [entry.name, entry.startTime]));
    const resources = performance.getEntriesByType("resource");
    const error = document.querySelector("#error:not([hidden])");
    return {
      url: location.href,
      title: document.title,
      readyState: document.readyState,
      responseStartMs: navigation?.responseStart ?? 0,
      domContentLoadedMs: navigation?.domContentLoadedEventEnd ?? 0,
      loadEventMs: navigation?.loadEventEnd ?? 0,
      firstPaintMs: paints["first-paint"] ?? 0,
      firstContentfulPaintMs: paints["first-contentful-paint"] ?? 0,
      transferSizeBytes: (navigation?.transferSize ?? 0) + resources.reduce((total, entry) => total + (entry.transferSize ?? 0), 0),
      encodedBodySizeBytes: (navigation?.encodedBodySize ?? 0) + resources.reduce((total, entry) => total + (entry.encodedBodySize ?? 0), 0),
      decodedBodySizeBytes: (navigation?.decodedBodySize ?? 0) + resources.reduce((total, entry) => total + (entry.decodedBodySize ?? 0), 0),
      resourceCount: resources.length + 1,
      largestResources: [navigation, ...resources].filter(Boolean).map((entry) => ({
        url: entry.name,
        type: entry.entryType === "navigation" ? "document" : entry.initiatorType,
        transferSizeBytes: entry.transferSize ?? 0,
        encodedBodySizeBytes: entry.encodedBodySize ?? 0,
        decodedBodySizeBytes: entry.decodedBodySize ?? 0,
        durationMs: entry.duration ?? 0,
      })).sort((left, right) => right.encodedBodySizeBytes - left.encodedBodySizeBytes).slice(0, 10),
      domNodeCount: document.getElementsByTagName("*").length,
      visibleTextCharacters: (document.body.innerText ?? "").replace(/\s+/g, " ").trim().length,
      horizontalOverflowPx: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      error: error?.textContent?.trim() ?? null,
    };
  })()`);
  const before = metricMap((await client.send("Performance.getMetrics")).metrics);
  const interactionMs = await evaluate(client, `new Promise((accept, reject) => {
    const started = performance.now();
    location.hash = ${JSON.stringify(docsHash)};
    const deadline = started + 5000;
    const check = () => {
      const content = document.querySelector('[data-luastra-id="docs/content"], #content');
      if (content) requestAnimationFrame(() => requestAnimationFrame(() => accept(performance.now() - started)));
      else if (performance.now() >= deadline) reject(new Error("documentation route timeout"));
      else setTimeout(check, 16);
    };
    check();
  })`);
  const after = metricMap((await client.send("Performance.getMetrics")).metrics);
  return {
    ...page,
    interactionToDocumentationMs: interactionMs,
    jsHeapUsedBytes: after.JSHeapUsedSize ?? 0,
    cdpNodeCount: after.Nodes ?? 0,
    layoutDurationMs: ((after.LayoutDuration ?? 0) - (before.LayoutDuration ?? 0)) * 1000,
    recalcStyleDurationMs: ((after.RecalcStyleDuration ?? 0) - (before.RecalcStyleDuration ?? 0)) * 1000,
    taskDurationMs: ((after.TaskDuration ?? 0) - (before.TaskDuration ?? 0)) * 1000,
  };
}

function summarize(samples) {
  const keys = [
    "responseStartMs", "domContentLoadedMs", "loadEventMs", "firstPaintMs", "firstContentfulPaintMs",
    "transferSizeBytes", "encodedBodySizeBytes", "decodedBodySizeBytes", "resourceCount", "domNodeCount", "visibleTextCharacters",
    "interactionToDocumentationMs", "jsHeapUsedBytes", "cdpNodeCount", "layoutDurationMs", "recalcStyleDurationMs", "taskDurationMs",
  ];
  return Object.fromEntries(keys.map((key) => [key, summary(samples, key)]));
}

function ratios(baseline, candidate) {
  const result = {};
  for (const key of Object.keys(candidate)) {
    const denominator = baseline[key]?.median;
    result[key] = denominator > 0 ? candidate[key].median / denominator : null;
  }
  return result;
}

async function main() {
  const selected = options(process.argv.slice(2));
  const repository = resolve(import.meta.dirname, "..");
  const profile = await mkdtemp(resolve(tmpdir(), "luastra-public-baseline-"));
  const applicationEvents = [];
  const application = await runProject({
    manifestPath: resolve(repository, "website/app/luastra.json"), port: selected.candidatePort, watch: false,
    onEvent: (event) => applicationEvents.push(event),
  });
  const candidateUrl = `${application.url}?luastraDiagnostics=1#/`;
  const browser = spawn(selected.browser, [
    "--headless=new", `--remote-debugging-port=${selected.browserPort}`, `--user-data-dir=${profile}`,
    "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "about:blank",
  ], { stdio: "ignore" });
  let client = null;
  try {
    const page = await waitForPage(selected.browserPort, browser);
    client = new CdpClient(page.webSocketDebuggerUrl);
    await client.ready;
    await client.send("Runtime.enable");
    await client.send("Network.enable");
    await client.send("Page.enable");
    await client.send("Performance.enable");
    await client.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    const browserVersion = await client.send("Browser.getVersion");

    const baselineSamples = [];
    const candidateSamples = [];
    for (let cycle = 0; cycle < selected.cycles; cycle += 1) {
      baselineSamples.push(await coldNavigation(client, selected.baselineUrl, "#docs/content"));
      candidateSamples.push(await coldNavigation(client, candidateUrl, "#/docs/overview"));
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
      schemaVersion: 1,
      evidenceClass: "REAL_CHROMIUM_PUBLIC_BASELINE_COMPARISON",
      startedAt: new Date().toISOString(),
      browser: browserVersion,
      cycles: selected.cycles,
      urls: { baseline: selected.baselineUrl, candidate: candidateUrl },
      applicationEvents,
      assertions,
      baseline: { summary: baselineSummary, samples: baselineSamples },
      candidate: { summary: candidateSummary, samples: candidateSamples },
      candidateToBaselineMedianRatio: ratios(baselineSummary, candidateSummary),
      result,
      boundary: "Cold navigation timing for the public baseline includes the live GitHub Pages network path while the private candidate is served locally. Runtime DOM, heap, style, layout, task, and documentation-route measurements are directly comparable in the same Chromium process; navigation ratios are observational and are not a release budget.",
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
    client?.close();
    browser.kill("SIGTERM");
    await application.close();
    await rm(profile, { recursive: true, force: true });
  }
}

main().catch((error) => {
  process.stderr.write(`${String(error?.stack ?? error)}\n`);
  process.exitCode = 1;
});
