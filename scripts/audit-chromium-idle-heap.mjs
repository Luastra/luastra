import { spawn } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";

import { runProject } from "../project/run-project.mjs";

function fail(message) { throw new Error(message); }
function delay(milliseconds) { return new Promise((accept) => setTimeout(accept, milliseconds)); }

function parseArguments(values) {
  const result = {
    browser: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    browserPort: 9228,
    durationMs: 900_000,
    output: null,
    port: 4198,
    project: "examples/animated-catalogue/luastra.json",
    sampleMs: 30_000,
  };
  for (const value of values) {
    const [name, raw] = value.split("=", 2);
    if (name === "--browser") result.browser = raw;
    else if (name === "--browser-port") result.browserPort = Number(raw);
    else if (name === "--duration-ms") result.durationMs = Number(raw);
    else if (name === "--out") result.output = raw;
    else if (name === "--port") result.port = Number(raw);
    else if (name === "--project") result.project = raw;
    else if (name === "--sample-ms") result.sampleMs = Number(raw);
    else fail(`unknown option: ${value}`);
  }
  for (const [name, value, minimum, maximum] of [
    ["browser-port", result.browserPort, 1, 65_535],
    ["duration-ms", result.durationMs, 1_000, 3_600_000],
    ["port", result.port, 1, 65_535],
    ["sample-ms", result.sampleMs, 250, 60_000],
  ]) if (!Number.isSafeInteger(value) || value < minimum || value > maximum) fail(`invalid --${name}`);
  if (!result.browser || !result.project) fail("invalid browser or project");
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
    return new Promise((resolvePromise, reject) => {
      this.#pending.set(id, { method, resolve: resolvePromise, reject });
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
  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (await evaluate(client, expression)) return;
    await delay(25);
  }
  fail(`timeout waiting for ${description}`);
}

async function heapSample(client) {
  await client.send("HeapProfiler.collectGarbage");
  const heap = await client.send("Runtime.getHeapUsage");
  const page = await evaluate(client, `(() => ({
    diagnostics: window.__luastraDiagnostics?.snapshot?.() ?? null,
    errors: [...(window.__luastraChromiumIdleAudit?.errors ?? [])],
    frameRequests: window.__luastraChromiumIdleAudit?.frameRequests ?? null,
    frameCallbacks: window.__luastraChromiumIdleAudit?.frameCallbacks ?? null,
    horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
  }))()`);
  return { heap, page };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const prototype = resolve(import.meta.dirname, "..");
  const profile = await mkdtemp(resolve(tmpdir(), "luastra-chromium-idle-"));
  const applicationEvents = [];
  const application = await runProject({
    manifestPath: resolve(prototype, options.project),
    port: options.port,
    watch: false,
    onEvent: (event) => applicationEvents.push(event),
  });
  const url = `${application.url}?luastraDiagnostics=1`;
  const browser = spawn(options.browser, [
    "--headless=new",
    `--remote-debugging-port=${options.browserPort}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    url,
  ], { stdio: "ignore" });
  let client = null;
  try {
    const page = await waitForPage(options.browserPort, browser);
    client = new CdpClient(page.webSocketDebuggerUrl);
    await client.ready;
    await client.send("Runtime.enable");
    await client.send("HeapProfiler.enable");
    await waitFor(client, "window.__luastraPreview?.result === 'PASS'", "Luastra preview PASS");
    await evaluate(client, `(() => {
      const state = { errors: [], frameCallbacks: 0, frameRequests: 0 };
      const original = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (callback) => {
        state.frameRequests += 1;
        return original((timestamp) => { state.frameCallbacks += 1; callback(timestamp); });
      };
      window.addEventListener('error', (event) => state.errors.push(String(event.error?.message ?? event.message ?? 'error')));
      window.addEventListener('unhandledrejection', (event) => state.errors.push(String(event.reason?.message ?? event.reason ?? 'unhandled rejection')));
      window.__luastraChromiumIdleAudit = state;
      document.querySelector('[data-luastra-id="catalogue/focus/select"]')?.click();
      return true;
    })()`);
    await delay(2_000);
    const startedAt = new Date().toISOString();
    const samples = [{ elapsedMs: 0, value: await heapSample(client) }];
    const deadline = Date.now() + options.durationMs;
    while (Date.now() < deadline) {
      await delay(Math.min(options.sampleMs, deadline - Date.now()));
      samples.push({ elapsedMs: options.durationMs - Math.max(0, deadline - Date.now()), value: await heapSample(client) });
    }
    const initial = samples[0].value;
    const final = samples.at(-1).value;
    const heapGrowthBytes = final.heap.usedSize - initial.heap.usedSize;
    const peakHeapGrowthBytes = Math.max(...samples.map((sample) => sample.value.heap.usedSize - initial.heap.usedSize));
    const assertions = {
      previewPass: final.page.diagnostics?.result === "PASS",
      noErrors: final.page.errors.length === 0,
      noPendingRequests: final.page.diagnostics?.pendingRequests === 0,
      noActiveMotion: final.page.diagnostics?.activeMotionCount === 0,
      noFrameTask: final.page.diagnostics?.activeFrameTaskCount === 0 && final.page.diagnostics?.framePending === false,
      noIdleFrameRequests: final.page.frameRequests === initial.page.frameRequests && final.page.frameCallbacks === initial.page.frameCallbacks,
      boundedCollectedHeapGrowth: heapGrowthBytes <= 8 * 1024 * 1024 && peakHeapGrowthBytes <= 8 * 1024 * 1024,
      boundedWasmGrowth: final.page.diagnostics?.wasmMemoryBytes - initial.page.diagnostics?.wasmMemoryBytes <= 4 * 1024 * 1024,
      stableDom: final.page.diagnostics?.domNodeCount === initial.page.diagnostics?.domNodeCount,
      noHorizontalOverflow: final.page.horizontalOverflow === 0,
    };
    const result = Object.values(assertions).every(Boolean) ? "PASS" : "FAIL";
    const report = {
      schemaVersion: 1,
      blocker: 10,
      evidenceClass: "REAL_CHROMIUM_GC_NORMALIZED_IDLE_HEAP",
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: options.durationMs,
      sampleIntervalMs: options.sampleMs,
      browser: "Google Chrome headless via CDP",
      project: "dev.luastra.animated-catalogue",
      url,
      applicationEvents,
      heapGrowthBytes,
      peakHeapGrowthBytes,
      assertions,
      initial,
      final,
    samples,
      result,
      boundary: "Chromium CDP supplies explicit garbage collection and Runtime.getHeapUsage for the frozen 8 MiB application-heap gate. Page error and unhandled-rejection events are asserted separately from headless-browser process diagnostics. This evidence complements but does not replace the real Safari/WebKit idle, keyboard, layout or assistive-technology evidence.",
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
