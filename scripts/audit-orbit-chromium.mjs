import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";

import { runProject } from "../project/run-project.mjs";
import { orbitBrowserBudgets as budgets, orbitBrowserTargets as targets } from "./orbit-browser-budgets.mjs";

function fail(message) { throw new Error(message); }
function delay(milliseconds) { return new Promise((accept) => setTimeout(accept, milliseconds)); }

function parseArguments(values) {
  const result = {
    browser: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    browserPort: 9230,
    cycles: 20,
    output: null,
    port: 4200,
    project: "examples/constellation-orbit/luastra.json",
  };
  for (const value of values) {
    const [name, raw] = value.split("=", 2);
    if (name === "--browser") result.browser = raw;
    else if (name === "--browser-port") result.browserPort = Number(raw);
    else if (name === "--cycles") result.cycles = Number(raw);
    else if (name === "--out") result.output = raw;
    else if (name === "--port") result.port = Number(raw);
    else if (name === "--project") result.project = raw;
    else fail(`unknown option: ${value}`);
  }
  for (const [name, value, minimum, maximum] of [
    ["browser-port", result.browserPort, 1, 65_535],
    ["cycles", result.cycles, budgets.minimumCycles, 1_000],
    ["port", result.port, 1, 65_535],
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
  for (let attempt = 0; attempt < 240; attempt += 1) {
    if (await evaluate(client, expression)) return;
    await delay(25);
  }
  fail(`timeout waiting for ${description}`);
}

async function click(client, id) {
  const clicked = await evaluate(client, `(() => {
    const node = document.querySelector(${JSON.stringify(`[data-luastra-id="${id}"]`)});
    if (!node) return false;
    node.click();
    return true;
  })()`);
  if (!clicked) fail(`missing element: ${id}`);
}

async function sample(client) {
  await client.send("HeapProfiler.collectGarbage");
  const heap = await client.send("Runtime.getHeapUsage");
  const page = await evaluate(client, `(() => ({
    diagnostics: window.__luastraDiagnostics?.snapshot?.() ?? null,
    errors: [...(window.__luastraOrbitAudit?.errors ?? [])],
    hash: location.hash,
    horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
  }))()`);
  return { heap, page };
}

async function openExamples(client) {
  await click(client, "orbit/example-galaxy");
  await waitFor(client, "location.hash === '#/orbit/examples' && window.__luastraDiagnostics.snapshot().orbitLayout.nodeCount === 54", "Examples constellation");
}

async function returnRoot(client) {
  await click(client, "orbit/path/root");
  await waitFor(client, "location.hash === '#/orbit'", "root constellation");
}

async function openBuild(client) {
  await click(client, "orbit/explore");
  await waitFor(client, "location.hash === '#/orbit/build' && window.__luastraDiagnostics.snapshot().orbitLayout.nodeCount === 11", "Build constellation");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const repository = resolve(import.meta.dirname, "..");
  const profile = await mkdtemp(resolve(tmpdir(), "luastra-orbit-chromium-"));
  const applicationEvents = [];
  const application = await runProject({
    manifestPath: resolve(repository, options.project),
    port: options.port,
    watch: false,
    onEvent: (event) => applicationEvents.push(event),
  });
  const url = `${application.url}?luastraDiagnostics=1#/orbit`;
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
    const browserVersion = await client.send("Browser.getVersion");
    await waitFor(client, "window.__luastraPreview?.result === 'PASS'", "Luastra preview PASS");
    await evaluate(client, `(() => {
      const state = { errors: [] };
      addEventListener("error", (event) => state.errors.push(String(event.error?.message ?? event.message ?? "error")));
      addEventListener("unhandledrejection", (event) => state.errors.push(String(event.reason?.message ?? event.reason ?? "unhandled rejection")));
      window.__luastraOrbitAudit = state;
      return true;
    })()`);
    const motionText = await evaluate(client, "document.querySelector('[data-luastra-id=\"orbit/path/motion\"]')?.textContent ?? ''");
    if (!motionText.includes("Off")) await click(client, "orbit/path/motion");

    await openExamples(client);
    await returnRoot(client);
    await openBuild(client);
    await returnRoot(client);
    const initial = await sample(client);
    const stateSamples = [];
    for (let index = 0; index < options.cycles; index += 1) {
      await openExamples(client);
      stateSamples.push({ cycle: index + 1, state: "examples", diagnostics: await evaluate(client, "window.__luastraDiagnostics.snapshot()") });
      await returnRoot(client);
      stateSamples.push({ cycle: index + 1, state: "root-after-examples", diagnostics: await evaluate(client, "window.__luastraDiagnostics.snapshot()") });
      await openBuild(client);
      stateSamples.push({ cycle: index + 1, state: "build", diagnostics: await evaluate(client, "window.__luastraDiagnostics.snapshot()") });
      await returnRoot(client);
      stateSamples.push({ cycle: index + 1, state: "root-after-build", diagnostics: await evaluate(client, "window.__luastraDiagnostics.snapshot()") });
    }
    await delay(100);
    const final = await sample(client);
    const heapGrowthBytes = final.heap.usedSize - initial.heap.usedSize;
    const orbitSamples = stateSamples.map((entry) => entry.diagnostics.orbitLayout);
    const initialOrbit = initial.page.diagnostics.orbitLayout;
    const finalOrbit = final.page.diagnostics.orbitLayout;
    const measuredLayoutPasses = finalOrbit.layoutPasses - initialOrbit.layoutPasses;
    const measuredLayoutDurationMs = (finalOrbit.averageLayoutDurationMs * finalOrbit.layoutPasses)
      - (initialOrbit.averageLayoutDurationMs * initialOrbit.layoutPasses);
    const measuredAverageLayoutDurationMs = measuredLayoutPasses === 0 ? 0 : measuredLayoutDurationMs / measuredLayoutPasses;
    const measuredMaximumLayoutDurationMs = Math.max(...orbitSamples.map((value) => value.lastLayoutDurationMs));
    const assertions = {
      previewPass: final.page.diagnostics?.result === "PASS",
      noErrors: final.page.errors.length === 0,
      noPendingRequests: final.page.diagnostics?.pendingRequests === 0,
      noActiveMotion: final.page.diagnostics?.activeMotionCount === 0,
      noFrameTask: final.page.diagnostics?.activeFrameTaskCount === 0 && final.page.diagnostics?.framePending === false,
      boundedAverageLayout: measuredAverageLayoutDurationMs <= budgets.averageLayoutDurationMs,
      boundedMaximumLayout: measuredMaximumLayoutDurationMs <= budgets.maximumLayoutDurationMs,
      boundedCollectedHeapGrowth: heapGrowthBytes <= budgets.collectedHeapGrowthBytes,
      boundedWasmGrowth: final.page.diagnostics?.wasmMemoryBytes - initial.page.diagnostics?.wasmMemoryBytes <= budgets.wasmMemoryGrowthBytes,
      boundedRetainedConstellations: orbitSamples.every((value) => value.constellationCount <= budgets.maximumConstellationCount),
      boundedRetainedNodes: orbitSamples.every((value) => value.nodeCount <= budgets.maximumRetainedNodeCount),
      stableRootDom: final.page.diagnostics?.domNodeCount === initial.page.diagnostics?.domNodeCount,
      stableRootLayers: final.page.diagnostics?.orbitLayout.constellationCount === initial.page.diagnostics?.orbitLayout.constellationCount,
      stableRootNodes: final.page.diagnostics?.orbitLayout.nodeCount === initial.page.diagnostics?.orbitLayout.nodeCount,
      noHorizontalOverflow: final.page.horizontalOverflow === 0,
    };
    const targetsMet = {
      averageLayout: measuredAverageLayoutDurationMs <= targets.averageLayoutDurationMs,
      maximumLayout: measuredMaximumLayoutDurationMs <= targets.maximumLayoutDurationMs,
    };
    const result = Object.values(assertions).every(Boolean) ? "PASS" : "FAIL";
    const report = {
      schemaVersion: 1,
      evidenceClass: "REAL_CHROMIUM_ORBIT_INTERACTION_PERFORMANCE",
      startedAt: new Date().toISOString(),
      browser: "Google Chrome headless via CDP",
      browserVersion,
      project: "dev.luastra.constellation-orbit",
      url,
      cycles: options.cycles,
      interactions: options.cycles * 4,
      budgets,
      targets,
      applicationEvents,
      heapGrowthBytes,
      measuredLayoutPasses,
      measuredAverageLayoutDurationMs,
      measuredMaximumLayoutDurationMs,
      assertions,
      targetsMet,
      initial,
      final,
      stateSummary: stateSamples.map(({ cycle, state, diagnostics }) => ({ cycle, state, orbitLayout: diagnostics.orbitLayout })),
      result,
      boundary: "This gate measures the real Chromium host, GC-normalized JavaScript heap, Wasm memory, and Orbit diagnostics. It does not represent Safari, Firefox, assistive technology, native shells, or low-end physical devices.",
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
