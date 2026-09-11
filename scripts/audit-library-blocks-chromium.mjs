import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { runProject } from "../project/run-project.mjs";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const debuggerPort = 9246;

function fail(message) { throw new Error(message); }
function delay(milliseconds) { return new Promise((accept) => setTimeout(accept, milliseconds)); }

class CdpClient {
  #id = 0;
  #pending = new Map();
  #socket;

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

async function waitForPage(browser) {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (browser.exitCode !== null) fail(`Chromium exited before readiness (${browser.exitCode})`);
    const pages = await fetch(`http://127.0.0.1:${debuggerPort}/json/list`).then((response) => response.ok ? response.json() : null).catch(() => null);
    const page = pages?.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
    if (page) return page;
    await delay(50);
  }
  fail("Chromium CDP readiness timeout");
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) fail(`browser evaluation failed: ${result.exceptionDetails.exception?.description ?? result.exceptionDetails.text}`);
  return result.result?.value;
}

async function waitFor(client, expression, description) {
  for (let attempt = 0; attempt < 400; attempt += 1) {
    if (await evaluate(client, expression)) return;
    await delay(25);
  }
  fail(`timeout waiting for ${description}`);
}

async function inspectFixture(client, url, fixture) {
  await client.send("Emulation.setDeviceMetricsOverride", { width: 320, height: 480, deviceScaleFactor: 1, mobile: false });
  await client.send("Emulation.setEmulatedMedia", { features: [
    { name: "prefers-color-scheme", value: "dark" },
    { name: "prefers-reduced-motion", value: "reduce" },
  ] });
  await client.send("Page.navigate", { url: `${url}?luastraDiagnostics=1` });
  try {
    await waitFor(client, `window.__luastraPreview?.result === "PASS" && document.querySelector('[data-luastra-id="${fixture.root}"]')`, fixture.id);
  } catch (error) {
    const diagnostic = await evaluate(client, `({ location: location.href, preview: window.__luastraPreview ?? null, error: document.getElementById("error")?.textContent ?? "", html: document.body?.textContent?.slice(0, 600) ?? "" })`);
    throw new Error(`${error.message}: ${JSON.stringify(diagnostic)}`);
  }

  const report = await evaluate(client, `(async () => {
    document.documentElement.style.fontSize = "200%";
    const longLabel = "A deliberately long localized navigation label that must remain usable";
    const longControl = document.querySelector('[data-luastra-id=${JSON.stringify(fixture.longControl)}]');
    if (longControl) longControl.textContent = longLabel;
    await new Promise((accept) => requestAnimationFrame(() => requestAnimationFrame(accept)));
    const buttons = [...document.querySelectorAll("button")];
    const appBar = document.querySelector('[data-luastra-id=${JSON.stringify(fixture.appBar)}]');
    const navigation = document.querySelector('[data-luastra-id=${JSON.stringify(fixture.navigation)}]');
    const icon = document.querySelector('[data-luastra-id=${JSON.stringify(fixture.icon)}] svg');
    buttons[0]?.focus();
    return {
      preview: window.__luastraPreview?.result,
      project: document.documentElement.dataset.luastraProject,
      viewport: { width: innerWidth, height: innerHeight },
      media: {
        dark: matchMedia("(prefers-color-scheme: dark)").matches,
        reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      },
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      controlTargets: buttons.map((button) => {
        const bounds = button.getBoundingClientRect();
        return { id: button.dataset.luastraId, width: bounds.width, height: bounds.height };
      }),
      firstControlFocused: document.activeElement === buttons[0],
      appBarSticky: getComputedStyle(appBar).position === "sticky",
      navigationSticky: getComputedStyle(navigation).position === "sticky",
      navigationRole: navigation?.getAttribute("role"),
      selectedState: navigation?.querySelector('[aria-current="page"]') !== null,
      iconRendered: icon !== null,
      library: ${JSON.stringify(fixture.library)},
    };
  })()`);

  await client.send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value: "active" }] });
  report.forcedColors = await evaluate(client, `matchMedia("(forced-colors: active)").matches`);
  await client.send("Emulation.setEmulatedMedia", { features: [] });
  return report;
}

const repository = resolve(import.meta.dirname, "..");
const fixtures = [
  {
    id: "catalogue",
    project: "test-fixtures/library-catalogue/luastra.json",
    root: "catalogue",
    appBar: "catalogue/bar",
    navigation: "catalogue/navigation",
    longControl: "catalogue/navigation/products",
    icon: "catalogue/saved/icon",
  },
  {
    id: "activity-log",
    project: "test-fixtures/library-activity-log/luastra.json",
    root: "activity",
    appBar: "activity/bar",
    navigation: "activity/navigation",
    longControl: "activity/navigation/log",
    icon: "activity/offline/icon",
  },
];
for (const fixture of fixtures) {
  const lock = JSON.parse(await readFile(resolve(repository, fixture.project, "../luastra.lock.json"), "utf8"));
  fixture.library = lock.libraries?.[0] ?? null;
}

const profile = await mkdtemp(resolve(tmpdir(), "luastra-library-blocks-chromium-"));
const browser = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--disable-background-networking",
  "--no-first-run",
  "--no-default-browser-check",
  `--remote-debugging-port=${debuggerPort}`,
  `--user-data-dir=${profile}`,
  "about:blank",
], { stdio: "ignore" });
let client = null;
const controllers = [];
try {
  const page = await waitForPage(browser);
  client = new CdpClient(page.webSocketDebuggerUrl);
  await client.send("Runtime.enable");
  await client.send("Page.enable");
  const samples = [];
  for (const fixture of fixtures) {
    const controller = await runProject({ manifestPath: resolve(repository, fixture.project), port: 0, watch: false });
    controllers.push(controller);
    samples.push(await inspectFixture(client, controller.url, fixture));
    await controller.close();
    controllers.pop();
  }
  const sharedDigest = samples[0].library?.contentSha256;
  const assertions = {
    realLuauWasmRenderer: samples.every((sample) => sample.preview === "PASS"),
    twoUnrelatedProjects: new Set(samples.map((sample) => sample.project)).size === 2,
    exactLibraryReuse: typeof sharedDigest === "string" && samples.every((sample) => sample.library?.id === "dev.luastra.universal-blocks" && sample.library?.version === "1.0.0" && sample.library?.contentSha256 === sharedDigest),
    narrowShortAndText200: samples.every((sample) => sample.viewport.width === 320 && sample.viewport.height === 480 && sample.overflow <= 1),
    minimumControlTargets: samples.every((sample) => sample.controlTargets.length > 0 && sample.controlTargets.every((target) => target.width >= 44 && target.height >= 44)),
    keyboardFocus: samples.every((sample) => sample.firstControlFocused),
    stickySafeCompositions: samples.every((sample) => sample.appBarSticky && sample.navigationSticky),
    navigationSemantics: samples.every((sample) => sample.navigationRole === "navigation" && sample.selectedState),
    boundedIcons: samples.every((sample) => sample.iconRendered),
    mediaPreferences: samples.every((sample) => sample.media.dark && sample.media.reducedMotion && sample.forcedColors),
  };
  const report = {
    schemaVersion: 1,
    evidenceClass: "REAL_CHROMIUM_REUSABLE_LIBRARY_BLOCKS",
    browser: "Google Chrome headless via CDP",
    assertions,
    samples,
    result: Object.values(assertions).every(Boolean) ? "PASS" : "FAIL",
    boundary: "This automated gate covers the actual Luau/Wasm renderer in two unrelated web fixtures at 320 by 480 CSS pixels with 200% root text, long-label stress, keyboard focus, 44-pixel controls, sticky navigation, semantic icons, dark preference, forced colors, reduced motion, and an identical locked library digest. It does not replace owner-observed VoiceOver, NVDA, native shell, or physical-device certification.",
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.result !== "PASS") process.exitCode = 1;
} finally {
  client?.close();
  if (browser.exitCode === null) browser.kill("SIGTERM");
  for (const controller of controllers) await controller.close();
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
