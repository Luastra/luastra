#!/usr/bin/env node

import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";

import { runProject } from "../project/run-project.mjs";

const themes = ["luastra", "abyss", "sakura", "atlas", "arctic", "biolume", "arcade", "bauhaus", "editorial", "copper", "candy"];
const viewports = [
  { id: "desktop", width: 1440, height: 900 },
  { id: "short-desktop", width: 1280, height: 720 },
  { id: "tablet-landscape", width: 1024, height: 768 },
  { id: "tablet-portrait", width: 768, height: 1024 },
  { id: "phone-landscape", width: 844, height: 390, constrained: true },
  { id: "phone-large", width: 430, height: 932, constrained: true },
  { id: "phone", width: 390, height: 844, constrained: true },
  { id: "legacy", width: 320, height: 568, constrained: true },
];

function fail(message) { throw new Error(message); }
function delay(milliseconds) { return new Promise((accept) => setTimeout(accept, milliseconds)); }

function options(values) {
  const result = { browser: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", browserPort: 9232, output: null, port: 4204 };
  for (const value of values) {
    const [name, raw] = value.split("=", 2);
    if (name === "--browser") result.browser = raw;
    else if (name === "--browser-port") result.browserPort = Number(raw);
    else if (name === "--out") result.output = raw;
    else if (name === "--port") result.port = Number(raw);
    else fail(`unknown option: ${value}`);
  }
  for (const [name, value] of [["browser-port", result.browserPort], ["port", result.port]]) {
    if (!Number.isSafeInteger(value) || value < 1 || value > 65_535) fail(`invalid --${name}`);
  }
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

async function route(client, hash, ready) {
  await evaluate(client, `location.hash = ${JSON.stringify(hash)}`);
  await waitFor(client, ready, hash);
  await delay(80);
}

async function viewport(client, target) {
  await client.send("Emulation.setDeviceMetricsOverride", { width: target.width, height: target.height, deviceScaleFactor: 1, mobile: false });
  await delay(80);
}

async function sample(client) {
  return evaluate(client, `(() => {
    const visible = (node) => node && !node.hidden && node.getClientRects().length > 0 && getComputedStyle(node).visibility !== "hidden";
    const rect = (node) => {
      const value = node.getBoundingClientRect();
      return { left: value.left, top: value.top, right: value.right, bottom: value.bottom, width: value.width, height: value.height };
    };
    const orbit = document.querySelector('[data-luastra-id="landing/orbit"]');
    const path = document.querySelector('[data-luastra-id="landing/path"]');
    const constellation = document.querySelector('.luastra-constellation-state-active');
    const focus = document.querySelector('[data-luastra-id="landing/focus"]');
    const controls = [...document.querySelectorAll('button,input,a[href]')].filter(visible);
    const nodes = constellation ? [...constellation.querySelectorAll('.luastra-orbit-node')].filter(visible) : [];
    const iconControls = [...document.querySelectorAll('.luastra-button[data-luastra-icon]')].filter(visible);
    const viewportWidth = document.documentElement.clientWidth;
    const inside = (bounds, container) => bounds.left >= container.left - 1 && bounds.right <= container.right + 1 && bounds.top >= container.top - 1 && bounds.bottom <= container.bottom + 1;
    const horizontallyInside = (bounds, container) => bounds.left >= container.left - 1 && bounds.right <= container.right + 1;
    const mode = orbit?.dataset.luastraOrbitMode ?? null;
    const constellationStyle = constellation ? getComputedStyle(constellation) : null;
    return {
      hash: location.hash,
      theme: orbit?.dataset.luastraOrbitTheme ?? null,
      mode,
      viewport: { width: viewportWidth, height: window.innerHeight },
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - viewportWidth),
      orbit: orbit ? rect(orbit) : null,
      path: path ? rect(path) : null,
      focus: focus && focus.open ? { ...rect(focus), scrollable: focus.scrollHeight > focus.clientHeight } : null,
      minimumTarget: controls.reduce((minimum, node) => Math.min(minimum, rect(node).width, rect(node).height), Infinity),
      nodesInsideOrbit: Boolean(orbit) && nodes.every((node) => horizontallyInside(rect(node), rect(orbit))) &&
        (mode === "list" ? ["auto", "scroll"].includes(constellationStyle?.overflowY) : nodes.every((node) => inside(rect(node), rect(orbit)))),
      labelledControls: controls.every((node) => (node.getAttribute('aria-label') ?? node.textContent ?? '').trim().length > 0),
      icons: iconControls.map((node) => ({ name: node.dataset.luastraIcon, svg: Boolean(node.querySelector(':scope > svg[aria-hidden="true"]')), bounds: rect(node) })),
      diagnostics: window.__luastraDiagnostics?.snapshot?.() ?? null,
      errors: [...(window.__luastraSiteAudit?.errors ?? [])],
    };
  })()`);
}

function samplePass(value, { constrained = false, focus = false } = {}) {
  return value.horizontalOverflow === 0 && value.minimumTarget >= 44 && value.nodesInsideOrbit && value.labelledControls &&
    value.errors.length === 0 && value.icons.length === 2 && value.icons.every((icon) => icon.svg && icon.bounds.width >= 44 && icon.bounds.height >= 44) &&
    Math.abs(value.path.height - 56) <= 1 && (!constrained || value.mode === "list") &&
    (!focus || (value.focus && value.focus.left >= -1 && value.focus.right <= value.viewport.width + 1 && value.focus.top >= -1 && value.focus.bottom <= value.viewport.height + 1));
}

async function main() {
  const selected = options(process.argv.slice(2));
  const repository = resolve(import.meta.dirname, "..");
  const profile = await mkdtemp(resolve(tmpdir(), "luastra-site-chromium-"));
  const applicationEvents = [];
  const application = await runProject({
    manifestPath: resolve(repository, "website/app/luastra.json"), port: selected.port, watch: false,
    onEvent: (event) => applicationEvents.push(event),
  });
  const url = `${application.url}?luastraDiagnostics=1#/`;
  const browser = spawn(selected.browser, [
    "--headless=new", `--remote-debugging-port=${selected.browserPort}`, `--user-data-dir=${profile}`,
    "--no-first-run", "--no-default-browser-check", "--disable-background-networking", url,
  ], { stdio: "ignore" });
  let client = null;
  try {
    const page = await waitForPage(selected.browserPort, browser);
    client = new CdpClient(page.webSocketDebuggerUrl);
    await client.ready;
    await client.send("Runtime.enable");
    const browserVersion = await client.send("Browser.getVersion");
    await waitFor(client, "window.__luastraPreview?.result === 'PASS'", "Luastra preview PASS");
    await evaluate(client, `(() => {
      window.__luastraSiteAudit = { errors: [] };
      addEventListener('error', (event) => window.__luastraSiteAudit.errors.push(String(event.error?.message ?? event.message ?? 'error')));
      addEventListener('unhandledrejection', (event) => window.__luastraSiteAudit.errors.push(String(event.reason?.message ?? event.reason ?? 'unhandled rejection')));
      return true;
    })()`);

    const viewportSamples = [];
    for (const target of viewports) {
      await viewport(client, target);
      await route(client, "#/", "location.hash === '#/' && Boolean(document.querySelector('[data-luastra-id=\"landing/root\"]'))");
      const root = await sample(client);
      await route(client, "#/product/ui", "location.hash === '#/product/ui' && document.querySelector('[data-luastra-id=\"landing/focus\"]')?.open === true");
      const focus = await sample(client);
      viewportSamples.push({ ...target, root, focus, pass: samplePass(root, target) && samplePass(focus, { ...target, focus: true }) });
    }

    await viewport(client, { width: 390, height: 844 });
    const themeSamples = [];
    for (let index = 0; index < themes.length; index += 1) {
      await route(client, "#/", "location.hash === '#/'");
      await evaluate(client, `document.querySelector('[data-luastra-id="landing/path/theme"]').click()`);
      await waitFor(client, "document.querySelector('[data-luastra-id=\"landing/theme-picker\"]')?.open === true", "theme picker");
      await evaluate(client, `document.querySelector('[data-luastra-id="landing/theme-picker/choice-${index + 1}"]').click()`);
      await route(client, "#/product/ui", "location.hash === '#/product/ui' && document.querySelector('[data-luastra-id=\"landing/focus\"]')?.open === true");
      const value = await sample(client);
      themeSamples.push({ expected: themes[index], ...value, pass: value.theme === themes[index] && samplePass(value, { constrained: true, focus: true }) });
    }

    await client.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    await route(client, "#/", "location.hash === '#/'");
    await evaluate(client, `document.querySelector('[data-luastra-id="landing/product"]').click()`);
    await waitFor(client, "location.hash === '#/product'", "reduced-motion navigation");
    await delay(80);
    const reducedMotion = await sample(client);
    await client.send("Emulation.setEmulatedMedia", { features: [] });

    const assertions = {
      viewportMatrix: viewportSamples.every((value) => value.pass),
      themeMatrix: themeSamples.every((value) => value.pass),
      reducedMotionSettles: reducedMotion.diagnostics?.activeMotionCount === 0 && reducedMotion.diagnostics?.framePending === false,
      noBrowserErrors: [...viewportSamples.flatMap((value) => [...value.root.errors, ...value.focus.errors]), ...themeSamples.flatMap((value) => value.errors), ...reducedMotion.errors].length === 0,
    };
    const result = Object.values(assertions).every(Boolean) ? "PASS" : "FAIL";
    const report = {
      schemaVersion: 1,
      evidenceClass: "REAL_CHROMIUM_LUASTRA_DEV_RESPONSIVE_ACCESSIBILITY",
      startedAt: new Date().toISOString(),
      browser: "Google Chrome headless via CDP",
      browserVersion,
      project: "dev.luastra.sdk-reference",
      url,
      applicationEvents,
      assertions,
      viewportSamples,
      themeSamples,
      reducedMotion,
      result,
      boundary: "This automated gate covers Chromium layout, target size, icon rendering, theme/focus geometry and emulated reduced motion. It does not replace real browser zoom, forced-colors, assistive technology, Firefox, Safari, Capacitor, Tauri or physical-device evidence.",
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
