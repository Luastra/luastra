#!/usr/bin/env node

import { spawn } from "node:child_process";
import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { runProject } from "../project/run-project.mjs";

const themes = ["luastra", "abyss", "sakura", "atlas", "arctic", "biolume", "arcade", "bauhaus", "editorial", "copper", "candy"];
const viewports = [
  { id: "desktop", width: 1440, height: 900 },
  { id: "tablet-portrait", width: 768, height: 1024 },
  { id: "phone-landscape", width: 844, height: 390, constrained: true },
  { id: "phone", width: 430, height: 932, constrained: true },
];

function fail(message) { throw new Error(message); }
function delay(milliseconds) { return new Promise((accept) => setTimeout(accept, milliseconds)); }

function options(values) {
  const result = {
    browser: null,
    driver: null,
    driverPort: 4460,
    firefoxBinary: "/Applications/Firefox.app/Contents/MacOS/firefox",
    output: null,
    port: 4210,
  };
  for (const value of values) {
    const [name, raw] = value.split("=", 2);
    if (name === "--browser") result.browser = raw;
    else if (name === "--driver") result.driver = raw;
    else if (name === "--driver-port") result.driverPort = Number(raw);
    else if (name === "--firefox-binary") result.firefoxBinary = raw;
    else if (name === "--out") result.output = raw;
    else if (name === "--port") result.port = Number(raw);
    else fail(`unknown option: ${value}`);
  }
  if (!new Set(["firefox", "safari"]).has(result.browser)) fail("--browser must be firefox or safari");
  result.driver ??= result.browser === "safari" ? "/usr/bin/safaridriver" : "geckodriver";
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
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    fail(`WebDriver ${method} ${path} transport failed: ${String(error)}`);
  }
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
  for (let attempt = 0; attempt < 320; attempt += 1) {
    if (await execute(base, sessionId, script)) return;
    await delay(25);
  }
  fail(`timeout waiting for ${description}`);
}

async function route(base, sessionId, hash, condition) {
  await execute(base, sessionId, "location.hash = arguments[0]; return true", [hash]);
  await waitFor(base, sessionId, condition, hash);
  await delay(100);
}

async function viewport(base, sessionId, target) {
  let outer = { width: target.width, height: target.height };
  let actual = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await webdriver(base, "POST", `/session/${sessionId}/window/rect`, { ...outer, x: 20, y: 20 });
    await delay(100);
    actual = await execute(base, sessionId, "return { width: innerWidth, height: innerHeight }");
    const widthDelta = target.width - actual.width;
    const heightDelta = target.height - actual.height;
    if (Math.abs(widthDelta) <= 1 && Math.abs(heightDelta) <= 1) break;
    outer = { width: Math.max(300, outer.width + widthDelta), height: Math.max(300, outer.height + heightDelta) };
  }
  return actual;
}

async function sample(base, sessionId) {
  return execute(base, sessionId, `
    const visible = (node) => node && !node.hidden && node.getClientRects().length > 0 && getComputedStyle(node).visibility !== "hidden";
    const rect = (node) => {
      const value = node.getBoundingClientRect();
      return { left: value.left, top: value.top, right: value.right, bottom: value.bottom, width: value.width, height: value.height };
    };
    const orbit = document.querySelector('[data-luastra-id="landing/orbit"]');
    const path = document.querySelector('[data-luastra-id="landing/path"]');
    const constellation = document.querySelector('.luastra-constellation-state-active');
    const focus = document.querySelector('[data-luastra-id="landing/focus"]');
    const brand = document.querySelector('.luastra-host-lockup img');
    const controls = [...document.querySelectorAll('button,input,a[href]')].filter(visible);
    const nodes = constellation ? [...constellation.querySelectorAll('.luastra-orbit-node')].filter(visible) : [];
    const icons = [...document.querySelectorAll('.luastra-button[data-luastra-icon]')].filter(visible);
    const viewportWidth = document.documentElement.clientWidth;
    const horizontallyInside = (bounds, container) => bounds.left >= container.left - 1 && bounds.right <= container.right + 1;
    const mode = orbit?.dataset.luastraOrbitMode ?? null;
    const constellationStyle = constellation ? getComputedStyle(constellation) : null;
    return {
      hash: location.hash,
      theme: orbit?.dataset.luastraOrbitTheme ?? null,
      mode,
      viewport: { width: viewportWidth, height: innerHeight },
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - viewportWidth),
      pathHeight: path ? rect(path).height : null,
      focus: focus && focus.open ? rect(focus) : null,
      brand: brand ? { ...rect(brand), alt: brand.alt, loaded: brand.complete && brand.naturalWidth > 0, source: brand.getAttribute('src') } : null,
      minimumTarget: controls.reduce((minimum, node) => Math.min(minimum, rect(node).width, rect(node).height), Infinity),
      nodesInsideOrbit: Boolean(orbit) && nodes.every((node) => horizontallyInside(rect(node), rect(orbit))) &&
        (mode !== "list" || ["auto", "scroll"].includes(constellationStyle?.overflowY)),
      labelledControls: controls.every((node) => (node.getAttribute('aria-label') ?? node.textContent ?? '').trim().length > 0),
      icons: icons.map((node) => ({ name: node.dataset.luastraIcon, svg: Boolean(node.querySelector(':scope > svg[aria-hidden="true"]')), bounds: rect(node) })),
      errors: [...(window.__luastraSiteWebDriverAudit?.errors ?? [])],
    };
  `);
}

function samplePass(value, { constrained = false, focus = false } = {}) {
  return value.horizontalOverflow === 0 && value.minimumTarget >= 44 && value.nodesInsideOrbit && value.labelledControls &&
    value.brand?.loaded === true && value.brand.alt === "Luastra" && value.brand.source?.endsWith("/brand/luastra-lockup.svg") && value.brand.width >= 112 &&
    value.icons.length === 2 && value.icons.every((icon) => icon.svg && icon.bounds.width >= 44 && icon.bounds.height >= 44) &&
    Math.abs(value.pathHeight - 56) <= 1 && (!constrained || value.mode === "list") &&
    (!focus || (value.focus && value.focus.left >= -1 && value.focus.right <= value.viewport.width + 1 && value.focus.top >= -1 && value.focus.bottom <= value.viewport.height + 1));
}

async function main() {
  const selected = options(process.argv.slice(2));
  if (selected.browser === "safari" && process.platform !== "darwin") fail("Safari audit requires macOS");
  const repository = resolve(import.meta.dirname, "..");
  const applicationEvents = [];
  const application = await runProject({
    manifestPath: resolve(repository, "website/app/luastra.json"), port: selected.port, watch: false,
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
    const url = `${application.url}?luastraDiagnostics=1#/`;
    await webdriver(base, "POST", `/session/${sessionId}/url`, { url });
    await waitFor(base, sessionId, "return window.__luastraPreview?.result === 'PASS'", "Luastra preview PASS");
    await execute(base, sessionId, `
      window.__luastraSiteWebDriverAudit = { errors: [] };
      addEventListener("error", (event) => window.__luastraSiteWebDriverAudit.errors.push(String(event.error?.message ?? event.message ?? "error")));
      addEventListener("unhandledrejection", (event) => window.__luastraSiteWebDriverAudit.errors.push(String(event.reason?.message ?? event.reason ?? "unhandled rejection")));
      return true;
    `);

    const viewportSamples = [];
    for (const target of viewports) {
      const actual = await viewport(base, sessionId, target);
      await route(base, sessionId, "#/", "return location.hash === '#/' && Boolean(document.querySelector('[data-luastra-id=\"landing/root\"].luastra-constellation-state-active')) && document.querySelector('[data-luastra-id=\"landing/focus\"]')?.open !== true");
      const root = await sample(base, sessionId);
      await route(base, sessionId, "#/product/ui", "return location.hash === '#/product/ui' && document.querySelector('[data-luastra-id=\"landing/focus\"]')?.open === true");
      const focus = await sample(base, sessionId);
      viewportSamples.push({ ...target, actual, root, focus, exactViewport: Math.abs(actual.width - target.width) <= 1 && Math.abs(actual.height - target.height) <= 1,
        pass: samplePass(root, target) && samplePass(focus, { ...target, focus: true }) });
    }

    const narrowViewport = await viewport(base, sessionId, { width: 430, height: 932 });
    const themeSamples = [];
    for (let index = 0; index < themes.length; index += 1) {
      await route(base, sessionId, "#/", "return location.hash === '#/'");
      await execute(base, sessionId, "document.querySelector('[data-luastra-id=\"landing/path/theme\"]')?.click(); return true");
      await waitFor(base, sessionId, "return document.querySelector('[data-luastra-id=\"landing/theme-picker\"]')?.open === true", "theme picker");
      await execute(base, sessionId, "document.querySelector('[data-luastra-id=\"landing/theme-picker/choice-' + arguments[0] + '\"]')?.click(); return true", [index + 1]);
      await route(base, sessionId, "#/product/ui", "return location.hash === '#/product/ui' && document.querySelector('[data-luastra-id=\"landing/focus\"]')?.open === true");
      const value = await sample(base, sessionId);
      themeSamples.push({ expected: themes[index], ...value, pass: value.theme === themes[index] && samplePass(value, { constrained: true, focus: true }) });
    }

    await route(base, sessionId, "#/docs/overview", "return location.hash === '#/docs/overview' && Boolean(document.querySelector('[data-luastra-id=\"docs/root\"]'))");
    const documentation = await execute(base, sessionId, `
      const brand = document.querySelector('[data-luastra-id="docs/header/brand"]');
      const bounds = brand?.getBoundingClientRect();
      const pseudo = brand ? getComputedStyle(brand, '::before') : null;
      const controls = [...document.querySelectorAll('button,input,a[href]')].filter((node) => node.getClientRects().length > 0);
      return {
        horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
        brandVisible: Boolean(bounds && bounds.width > 0 && bounds.height >= 40),
        canonicalBrandImage: pseudo?.backgroundImage?.includes('luastra-mark.svg') === true,
        approximateClipPathRemoved: !pseudo || pseudo.clipPath === 'none',
        minimumTarget: controls.reduce((minimum, node) => { const rect = node.getBoundingClientRect(); return Math.min(minimum, rect.width, rect.height); }, Infinity),
        smallTargets: controls.map((node) => {
          const rect = node.getBoundingClientRect();
          return { id: node.dataset.luastraId ?? null, tag: node.tagName, width: rect.width, height: rect.height, name: (node.getAttribute('aria-label') ?? node.textContent ?? '').trim().slice(0, 80) };
        }).filter((node) => Math.min(node.width, node.height) < 44).sort((left, right) => Math.min(left.width, left.height) - Math.min(right.width, right.height)),
        errors: [...(window.__luastraSiteWebDriverAudit?.errors ?? [])],
      };
    `);

    const allErrors = [...viewportSamples.flatMap((value) => [...value.root.errors, ...value.focus.errors]), ...themeSamples.flatMap((value) => value.errors), ...documentation.errors];
    const assertions = {
      viewportMatrix: viewportSamples.every((value) => value.pass),
      themeMatrix: themeSamples.every((value) => value.pass),
      documentationLayout: documentation.horizontalOverflow === 0 && documentation.minimumTarget >= 44,
      canonicalDocumentationBrand: documentation.brandVisible && documentation.canonicalBrandImage && documentation.approximateClipPathRemoved,
      noBrowserErrors: allErrors.length === 0,
    };
    const result = Object.values(assertions).every(Boolean) ? "PASS" : "FAIL";
    const report = {
      schemaVersion: 1,
      evidenceClass: `REAL_${selected.browser.toUpperCase()}_LUASTRA_DEV_RESPONSIVE`,
      startedAt: new Date().toISOString(),
      browser: selected.browser,
      browserCapabilities,
      project: "dev.luastra.sdk-reference",
      url,
      applicationEvents,
      assertions,
      viewportSamples,
      narrowViewport,
      themeSamples,
      documentation,
      result,
      boundary: `${selected.browser} WebDriver covers real-engine luastra.dev layout, all Orbit themes, Focus Surface geometry, target sizes and canonical documentation branding. Window-manager minimums are recorded instead of being presented as exact phone emulation. It does not replace native browser zoom, assistive technology, Capacitor, Tauri or physical-device evidence.`,
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
