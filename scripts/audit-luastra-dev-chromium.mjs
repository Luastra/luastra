#!/usr/bin/env node

import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";

import { runProject } from "../project/run-project.mjs";
import { generatedPages } from "../website/site/generated-reference-data.js";

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

function referenceHash(pageId) {
  return `#/reference/${encodeURIComponent(pageId)}`;
}

async function auditDetailSequence(client) {
  const sections = Map.groupBy(generatedPages, (page) => page.sectionId);
  for (const pages of sections.values()) {
    for (let index = 0; index < pages.length; index += 1) {
      if ((pages[index - 1]?.id ?? null) !== pages[index].previousPageId) fail(`${pages[index].id} has an invalid Previous target`);
      if ((pages[index + 1]?.id ?? null) !== pages[index].nextPageId) fail(`${pages[index].id} has an invalid Next target`);
    }
  }
  const pages = sections.get("beginner-tutorial");
  await route(client, referenceHash(pages[0].id), `location.hash === ${JSON.stringify(referenceHash(pages[0].id))} && Boolean(document.querySelector('[data-luastra-id="docs/detail"]'))`);
  let browserForwardClicks = 0;
  let browserBackwardClicks = 0;
  for (let index = 1; index < pages.length; index += 1) {
    const expected = referenceHash(pages[index].id);
    await evaluate(client, `document.querySelector('[data-luastra-id="docs/detail/next"]')?.click()`);
    await waitFor(client, `location.hash === ${JSON.stringify(expected)}`, `detail Next ${expected}`);
    browserForwardClicks += 1;
  }
  for (let index = pages.length - 2; index >= 0; index -= 1) {
    const expected = referenceHash(pages[index].id);
    await evaluate(client, `document.querySelector('[data-luastra-id="docs/detail/previous"]')?.click()`);
    await waitFor(client, `location.hash === ${JSON.stringify(expected)}`, `detail Previous ${expected}`);
    browserBackwardClicks += 1;
  }
  return {
    pages: generatedPages.length,
    sections: sections.size,
    forwardTargets: generatedPages.length - sections.size,
    backwardTargets: generatedPages.length - sections.size,
    browserPages: pages.length,
    browserForwardClicks,
    browserBackwardClicks,
  };
}

async function viewport(client, target) {
  await client.send("Emulation.setDeviceMetricsOverride", { width: target.width, height: target.height, deviceScaleFactor: 1, mobile: false });
  await delay(80);
}

async function key(client, value, code = value) {
  const keyCode = { "/": 191, ArrowRight: 39, End: 35, Enter: 13, Escape: 27, Home: 36, Tab: 9 }[value] ?? 0;
  const params = { key: value, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode };
  await client.send("Input.dispatchKeyEvent", { type: "rawKeyDown", ...params });
  await client.send("Input.dispatchKeyEvent", { type: "keyUp", ...params });
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
    const brand = document.querySelector('.luastra-brand img, .luastra-host-lockup img');
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
      brand: brand ? { ...rect(brand), alt: brand.alt, loaded: brand.complete && brand.naturalWidth > 0, source: brand.getAttribute('src') } : null,
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
    value.brand?.loaded === true && value.brand.alt === "Luastra" && value.brand.source?.endsWith("/brand/luastra-lockup.svg") && value.brand.width >= 112 &&
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

    await viewport(client, { width: 1024, height: 768 });
    await route(client, "#/", "location.hash === '#/' && Boolean(document.querySelector('[data-luastra-id=\"landing/root\"].luastra-constellation-state-active')) && document.querySelector('[data-luastra-id=\"landing/focus\"]')?.open !== true");
    const focusNode = async (id) => evaluate(client, `(() => {
      const selector = '[data-luastra-id=${JSON.stringify(id)}]';
      const node = document.querySelector('.luastra-constellation-state-active ' + selector) ?? document.querySelector(selector);
      node?.focus();
      return document.activeElement?.dataset?.luastraId ?? null;
    })()`);
    const keyboard = { initial: await focusNode("landing/product") };
    await key(client, "/", "Slash");
    keyboard.searchShortcut = await evaluate(client, "document.activeElement?.dataset?.luastraId ?? null");
    keyboard.rootBeforeArrow = await focusNode("landing/product");
    await key(client, "ArrowRight");
    keyboard.rootAfterArrow = await evaluate(client, "document.activeElement?.dataset?.luastraId ?? null");
    keyboard.rootRovingStops = await evaluate(client, "document.querySelectorAll('.luastra-constellation-state-active .luastra-orbit-node[tabindex=\"0\"]').length");
    await focusNode("landing/product");
    await key(client, "Enter");
    await waitFor(client, "location.hash === '#/product' && Boolean(document.querySelector('[data-luastra-id=\"landing/product-map\"].luastra-constellation-state-active'))", "keyboard child navigation");
    keyboard.child = await focusNode("landing/product/ui");
    await key(client, "Enter");
    await waitFor(client, "location.hash === '#/product/ui' && document.querySelector('[data-luastra-id=\"landing/focus\"]')?.open === true", "keyboard Focus Surface open");
    keyboard.focusHeading = await evaluate(client, "document.activeElement?.dataset?.luastraId ?? null");
    await key(client, "Tab");
    keyboard.focusTab = await evaluate(client, "document.activeElement?.dataset?.luastraId ?? null");
    await key(client, "Escape");
    await waitFor(client, "location.hash === '#/product' && Boolean(document.querySelector('[data-luastra-id=\"landing/product-map\"].luastra-constellation-state-active')) && document.querySelector('[data-luastra-id=\"landing/focus\"]')?.open !== true", "keyboard Focus Surface close");
    keyboard.restoredLeaf = await evaluate(client, "document.activeElement?.dataset?.luastraId ?? null");
    await key(client, "Escape");
    await waitFor(client, "location.hash === '#/' && Boolean(document.querySelector('[data-luastra-id=\"landing/root\"].luastra-constellation-state-active'))", "keyboard ancestor return");
    keyboard.restoredRoot = await evaluate(client, "document.activeElement?.dataset?.luastraId ?? null");
    keyboard.errors = await evaluate(client, "[...(window.__luastraSiteAudit?.errors ?? [])]");

    await client.send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value: "active" }] });
    await viewport(client, { width: 390, height: 844 });
    await route(client, "#/", "location.hash === '#/'");
    await focusNode("landing/path/theme");
    const forcedRoot = await sample(client);
    const forcedColors = await evaluate(client, `(() => {
      const focused = document.activeElement;
      const style = focused ? getComputedStyle(focused) : null;
      const icons = [...document.querySelectorAll('.luastra-button-icon')].map((icon) => getComputedStyle(icon).stroke);
      return {
        active: matchMedia('(forced-colors: active)').matches,
        focusedId: focused?.dataset?.luastraId ?? null,
        outlineStyle: style?.outlineStyle ?? null,
        outlineWidth: Number.parseFloat(style?.outlineWidth ?? '0'),
        iconStrokes: icons,
      };
    })()`);
    await route(client, "#/product/ui", "location.hash === '#/product/ui' && document.querySelector('[data-luastra-id=\"landing/focus\"]')?.open === true");
    const forcedFocus = await sample(client);
    await client.send("Emulation.setEmulatedMedia", { features: [] });

    await viewport(client, { width: 390, height: 844 });
    await route(client, "#/docs/beginner-tutorial", "location.hash === '#/docs/beginner-tutorial' && Boolean(document.querySelector('[data-luastra-id=\"docs/pages/beginner-tutorial\"]'))");
    const beginnerTutorial = await evaluate(client, `(() => ({
      title: document.querySelector('[data-luastra-id="docs/section/title"]')?.textContent ?? null,
      detailLinks: document.querySelectorAll('[data-luastra-id="docs/pages/beginner-tutorial"] a').length,
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      errors: [...(window.__luastraSiteAudit?.errors ?? [])],
    }))()`);
    await route(client, "#/docs/first-app", "location.hash === '#/docs/first-app' && Boolean(document.querySelector('[data-luastra-id=\"docs/section\"]'))");
    const firstAppCheckpoint = await evaluate(client, `(() => ({
      title: document.querySelector('[data-luastra-id="docs/section/title"]')?.textContent ?? null,
      beginnerLink: document.querySelector('[data-luastra-id="docs/section/link-1"]')?.getAttribute('href') ?? null,
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      errors: [...(window.__luastraSiteAudit?.errors ?? [])],
    }))()`);
    await route(client, "#/docs/advanced-tutorial", "location.hash === '#/docs/advanced-tutorial' && Boolean(document.querySelector('[data-luastra-id=\"docs/pages/advanced-tutorial\"]'))");
    const advancedTutorial = await evaluate(client, `(() => ({
      title: document.querySelector('[data-luastra-id="docs/section/title"]')?.textContent ?? null,
      detailLinks: document.querySelectorAll('[data-luastra-id="docs/pages/advanced-tutorial"] a').length,
      relatedLinks: [...document.querySelectorAll('[data-luastra-id^="docs/section/link-"]')].map((link) => link.getAttribute('href')),
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      errors: [...(window.__luastraSiteAudit?.errors ?? [])],
    }))()`);
    await route(client, "#/docs/luau-types", "location.hash === '#/docs/luau-types' && Boolean(document.querySelector('[data-luastra-id=\"docs/pages/luau-types\"]'))");
    const typingGuide = await evaluate(client, `(() => ({
      title: document.querySelector('[data-luastra-id="docs/section/title"]')?.textContent ?? null,
      detailLinks: document.querySelectorAll('[data-luastra-id="docs/pages/luau-types"] a').length,
      analyzerLink: [...document.querySelectorAll('[data-luastra-id="docs/pages/luau-types"] a')].find((link) => link.textContent?.includes("Read analyzer errors"))?.getAttribute('href') ?? null,
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      errors: [...(window.__luastraSiteAudit?.errors ?? [])],
    }))()`);
    await route(client, "#/docs/events-errors", "location.hash === '#/docs/events-errors' && Boolean(document.querySelector('[data-luastra-id=\"docs/pages/events-errors\"]'))");
    const eventsGuide = await evaluate(client, `(() => ({
      title: document.querySelector('[data-luastra-id="docs/section/title"]')?.textContent ?? null,
      detailLinks: document.querySelectorAll('[data-luastra-id="docs/pages/events-errors"] a').length,
      relatedLinks: [...document.querySelectorAll('[data-luastra-id^="docs/section/link-"]')].map((link) => link.getAttribute('href')),
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      errors: [...(window.__luastraSiteAudit?.errors ?? [])],
    }))()`);
    await route(client, "#/docs/ui", "location.hash === '#/docs/ui' && Boolean(document.querySelector('[data-luastra-id=\"docs/pages/ui\"]'))");
    await evaluate(client, `(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
      document.querySelector('[data-luastra-id^="docs/page-link-"][href="#/reference/ui%2Fitem-8"]')?.click();
      return true;
    })()`);
    await waitFor(client, "location.hash === '#/reference/ui%2Fitem-8' && Boolean(document.querySelector('[data-luastra-id=\"docs/detail\"]'))", "detail navigation");
    await delay(80);
    const detailOpenedAtTop = await evaluate(client, "window.scrollY <= 1");
    const wheelTarget = await evaluate(client, `(() => {
      const node = document.querySelector('[data-luastra-id="docs/detail/parameters-scroll"]');
      node?.scrollIntoView({ block: 'center' });
      const bounds = node?.getBoundingClientRect();
      return bounds ? { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2, before: window.scrollY } : null;
    })()`);
    if (wheelTarget) {
      await client.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: wheelTarget.x, y: wheelTarget.y });
      await client.send("Input.dispatchMouseEvent", { type: "mouseWheel", x: wheelTarget.x, y: wheelTarget.y, deltaX: 0, deltaY: 240 });
      await delay(120);
    }
    const verticalWheelEscapesTable = wheelTarget !== null &&
      await evaluate(client, `window.scrollY > ${JSON.stringify(wheelTarget?.before ?? Number.MAX_SAFE_INTEGER)}`);
    const documentationDetail = await evaluate(client, `(() => {
      const related = [...document.querySelectorAll('a[data-luastra-id^="docs/detail/related-"]')];
      const previous = document.querySelector('[data-luastra-id="docs/detail/previous"]');
      const next = document.querySelector('[data-luastra-id="docs/detail/next"]');
      const parametersScroll = document.querySelector('[data-luastra-id="docs/detail/parameters-scroll"]');
      return {
        hash: location.hash,
        horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
        relatedCount: related.length,
        relatedCanonical: related.every((link) => link.getAttribute('href')?.startsWith('#/reference/')),
        previous: previous?.getAttribute('href') ?? null,
        next: next?.getAttribute('href') ?? null,
        parametersScrollContained: parametersScroll != null && parametersScroll.scrollWidth > parametersScroll.clientWidth &&
          getComputedStyle(parametersScroll).overflowX === 'auto',
        detailOpenedAtTop: ${JSON.stringify(detailOpenedAtTop)},
        verticalWheelEscapesTable: ${JSON.stringify(verticalWheelEscapesTable)},
        errors: [...(window.__luastraSiteAudit?.errors ?? [])],
      };
    })()`);
    await route(client, "#/reference/ui%2Fitem-7", "location.hash === '#/reference/ui%2Fitem-7' && Boolean(document.querySelector('[data-luastra-id=\"docs/detail/recipe/link\"]'))");
    const recipeLinkBounds = await evaluate(client, `(() => {
      const node = document.querySelector('[data-luastra-id="docs/detail/recipe/link"]');
      node?.scrollIntoView({ block: 'center' });
      const bounds = node?.getBoundingClientRect();
      return bounds ? { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 } : null;
    })()`);
    if (recipeLinkBounds) {
      await client.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: recipeLinkBounds.x, y: recipeLinkBounds.y });
      await delay(80);
    }
    const recipeHover = await evaluate(client, `(() => {
      const link = document.querySelector('[data-luastra-id="docs/detail/recipe/link"]');
      const surface = document.querySelector('[data-luastra-id="docs/detail/recipe"]');
      const parse = (value) => (value.match(/[\\d.]+/g) ?? []).slice(0, 3).map(Number);
      const luminance = (value) => {
        const channels = parse(value).map((part) => part / 255).map((part) => part <= .04045 ? part / 12.92 : ((part + .055) / 1.055) ** 2.4);
        return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
      };
      const foreground = link ? getComputedStyle(link).color : 'rgb(0, 0, 0)';
      const background = surface ? getComputedStyle(surface).backgroundColor : 'rgb(255, 255, 255)';
      const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
      return { hovered: link?.matches(':hover') === true, foreground, background, contrast: (values[0] + .05) / (values[1] + .05) };
    })()`);
    const detailSequence = await auditDetailSequence(client);

    const assertions = {
      viewportMatrix: viewportSamples.every((value) => value.pass),
      themeMatrix: themeSamples.every((value) => value.pass),
      reducedMotionSettles: reducedMotion.diagnostics?.activeMotionCount === 0 && reducedMotion.diagnostics?.framePending === false,
      keyboardOnly: keyboard.initial === "landing/product" && keyboard.searchShortcut === "landing/search/input" &&
        keyboard.rootBeforeArrow === "landing/product" && keyboard.rootAfterArrow !== keyboard.rootBeforeArrow && keyboard.rootRovingStops === 1 &&
        keyboard.child === "landing/product/ui" && keyboard.focusHeading === "landing/focus/title" && keyboard.focusTab === "landing/focus/close" &&
        keyboard.restoredLeaf === "landing/product/ui" && keyboard.restoredRoot === "landing/product",
      forcedColors: forcedColors.active && forcedColors.focusedId === "landing/path/theme" && forcedColors.outlineStyle !== "none" &&
        forcedColors.outlineWidth >= 2 && forcedColors.iconStrokes.length === 2 && forcedColors.iconStrokes.every((stroke) => stroke !== "none") &&
        samplePass(forcedRoot, { constrained: true }) && samplePass(forcedFocus, { constrained: true, focus: true }),
      documentationOnboarding: beginnerTutorial.title === "Beginner tutorial: build an accessible counter" &&
        beginnerTutorial.detailLinks === 8 && beginnerTutorial.horizontalOverflow === 0 &&
        firstAppCheckpoint.title === "Complete mini-app checkpoint" &&
        firstAppCheckpoint.beginnerLink === "#/docs/beginner-tutorial" && firstAppCheckpoint.horizontalOverflow === 0 &&
        advancedTutorial.title === "Advanced tutorial: build a routed reading list" &&
        advancedTutorial.detailLinks === 8 &&
        JSON.stringify(advancedTutorial.relatedLinks) === JSON.stringify(["#/docs/recipe-navigation", "#/docs/recipe-storage", "#/docs/recipe-history"]) &&
        advancedTutorial.horizontalOverflow === 0 && typingGuide.title === "Luau typing quick reference" &&
        typingGuide.detailLinks === 19 && typingGuide.analyzerLink === "#/reference/luau-types%2Fitem-17" && typingGuide.horizontalOverflow === 0 &&
        eventsGuide.title === "Events and errors" && eventsGuide.detailLinks === 10 && eventsGuide.relatedLinks.length === 4 &&
        eventsGuide.relatedLinks.every((href) => href?.startsWith("#/docs/recipe-")) && eventsGuide.horizontalOverflow === 0,
      documentationDetail: documentationDetail.hash === "#/reference/ui%2Fitem-8" && documentationDetail.horizontalOverflow === 0 &&
        documentationDetail.relatedCount >= 1 && documentationDetail.relatedCount <= 4 && documentationDetail.relatedCanonical &&
        documentationDetail.previous === "#/reference/ui%2Fitem-7" && documentationDetail.next === "#/reference/ui%2Fitem-9" &&
        documentationDetail.parametersScrollContained && documentationDetail.detailOpenedAtTop && documentationDetail.verticalWheelEscapesTable &&
        recipeHover.hovered && recipeHover.contrast >= 4.5,
      detailNavigationSequence: detailSequence.pages === generatedPages.length &&
        detailSequence.forwardTargets === generatedPages.length - detailSequence.sections &&
        detailSequence.backwardTargets === generatedPages.length - detailSequence.sections &&
        detailSequence.browserForwardClicks === detailSequence.browserPages - 1 &&
        detailSequence.browserBackwardClicks === detailSequence.browserPages - 1,
      noBrowserErrors: [...viewportSamples.flatMap((value) => [...value.root.errors, ...value.focus.errors]), ...themeSamples.flatMap((value) => value.errors),
        ...reducedMotion.errors, ...keyboard.errors, ...forcedRoot.errors, ...forcedFocus.errors,
        ...beginnerTutorial.errors, ...firstAppCheckpoint.errors, ...advancedTutorial.errors, ...typingGuide.errors,
        ...eventsGuide.errors, ...documentationDetail.errors].length === 0,
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
      keyboard,
      forcedColors: { media: forcedColors, root: forcedRoot, focus: forcedFocus },
      documentationOnboarding: { beginnerTutorial, firstAppCheckpoint, advancedTutorial, typingGuide, eventsGuide },
      documentationDetail,
      detailSequence,
      recipeHover,
      result,
      boundary: "This automated gate covers Chromium layout, target size, brand and icon rendering, theme/focus geometry, routed documentation detail links, keyboard-only flows, emulated forced colors and emulated reduced motion. It does not replace real browser zoom, assistive technology, Firefox, Safari, Capacitor, Tauri or physical-device evidence.",
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
