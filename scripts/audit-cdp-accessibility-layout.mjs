#!/usr/bin/env node

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

function fail(message) { throw new Error(message); }

function parseArguments(values) {
  const options = {};
  for (const value of values) {
    const separator = value.indexOf("=");
    if (!value.startsWith("--") || separator < 3) fail(`invalid argument: ${value}`);
    const name = value.slice(2, separator);
    if (options[name] !== undefined) fail(`duplicate argument: --${name}`);
    options[name] = value.slice(separator + 1);
  }
  if (!options.endpoint || !options.host || !options["evidence-class"] || !options.orientation) {
    fail("usage: audit-cdp-accessibility-layout.mjs --endpoint=<url> --host=<identity> --evidence-class=<class> --orientation=<portrait|landscape> [--out=<file>] [--expected-columns=<1|2>] [--scroll-to=<luastra-id>] [--focus-to=<luastra-id>] [--include-values=<true|false>]");
  }
  if (!new Set(["portrait", "landscape"]).has(options.orientation)) fail("invalid --orientation");
  const expectedColumns = options["expected-columns"] === undefined ? null : Number(options["expected-columns"]);
  if (expectedColumns !== null && !new Set([1, 2]).has(expectedColumns)) fail("invalid --expected-columns");
  if (options["include-values"] !== undefined && !new Set(["true", "false"]).has(options["include-values"])) fail("invalid --include-values");
  return { ...options, expectedColumns, includeValues: options["include-values"] === "true" };
}

function delay(milliseconds) {
  return new Promise((accept) => setTimeout(accept, milliseconds));
}

async function evaluate(webSocketUrl, expression) {
  return new Promise((accept, reject) => {
    const socket = new WebSocket(webSocketUrl);
    const timeout = setTimeout(() => {
      socket.close();
      reject(new Error("CDP evaluation timed out"));
    }, 15_000);
    socket.addEventListener("open", () => socket.send(JSON.stringify({
      id: 1,
      method: "Runtime.evaluate",
      params: { expression, returnByValue: true, awaitPromise: true },
    })));
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id !== 1) return;
      clearTimeout(timeout);
      socket.close();
      if (message.error || message.result?.exceptionDetails) reject(new Error("CDP expression failed"));
      else accept(message.result?.result?.value);
    });
    socket.addEventListener("error", () => {
      clearTimeout(timeout);
      reject(new Error("CDP WebSocket failed"));
    });
  });
}

const options = parseArguments(process.argv.slice(2));
const endpoint = new URL(options.endpoint);
const pages = await (await fetch(new URL("/json/list", endpoint))).json();
const page = pages.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
if (!page) fail("no debuggable WebView page");

let preview = null;
for (let attempt = 0; attempt < 100; attempt += 1) {
  preview = await evaluate(page.webSocketDebuggerUrl, "globalThis.__luastraPreview ?? null");
  if (preview?.result === "PASS") break;
  if (preview?.result === "FAIL") fail(`Luastra preview failed: ${preview.error ?? "unknown error"}`);
  await delay(50);
}
if (preview?.result !== "PASS") fail("Luastra preview readiness timeout");

if (options["scroll-to"] !== undefined) {
  if (!/^[a-z0-9][a-z0-9/_-]{0,127}$/.test(options["scroll-to"])) fail("invalid --scroll-to");
  const found = await evaluate(page.webSocketDebuggerUrl, `(() => {
    const element = document.querySelector(${JSON.stringify(`[data-luastra-id="${options["scroll-to"]}"]`)});
    if (!element) return false;
    element.scrollIntoView({ block: "center", inline: "nearest" });
    return true;
  })()`);
  if (!found) fail(`scroll target not found: ${options["scroll-to"]}`);
  await delay(300);
}

if (options["focus-to"] !== undefined) {
  if (!/^[a-z0-9][a-z0-9/_-]{0,127}$/.test(options["focus-to"])) fail("invalid --focus-to");
  const focused = await evaluate(page.webSocketDebuggerUrl, `(() => {
    const element = document.querySelector(${JSON.stringify(`[data-luastra-id="${options["focus-to"]}"]`)});
    if (!(element instanceof HTMLElement)) return false;
    element.focus();
    element.click();
    return document.activeElement === element;
  })()`);
  if (!focused) fail(`focus target not found or not focusable: ${options["focus-to"]}`);
  await delay(500);
}

const metrics = await evaluate(page.webSocketDebuggerUrl, `(() => {
  const round = (value) => Math.round(value * 100) / 100;
  const rect = (element) => {
    const value = element.getBoundingClientRect();
    return { x: round(value.x), y: round(value.y), width: round(value.width), height: round(value.height), bottom: round(value.bottom) };
  };
  const controls = [...document.querySelectorAll("button,input,select,textarea,[role=button]")]
    .filter((element) => {
      const style = getComputedStyle(element);
      const bounds = element.getBoundingClientRect();
      return style.visibility !== "hidden" && style.display !== "none" && bounds.width > 0 && bounds.height > 0;
    })
    .map((element) => ({
      id: element.dataset.luastraId ?? element.id ?? null,
      tag: element.tagName.toLowerCase(),
      type: element.getAttribute("type"),
      label: element.getAttribute("aria-label") ?? element.textContent?.trim() ?? "",
      required: "required" in element ? element.required : element.getAttribute("aria-required") === "true",
      invalid: element.getAttribute("aria-invalid"),
      describedBy: element.getAttribute("aria-describedby"),
      disabled: "disabled" in element ? element.disabled : element.getAttribute("aria-disabled") === "true",
      inputMode: element.getAttribute("inputmode"),
      enterKeyHint: element.getAttribute("enterkeyhint"),
      autoComplete: element.getAttribute("autocomplete"),
      ...(${options.includeValues ? "true" : "false"} && "value" in element ? { value: element.value } : {}),
      ...(${options.includeValues ? "true" : "false"} && "selectionStart" in element ? {
        selectionStart: element.selectionStart,
        selectionEnd: element.selectionEnd,
        selectionDirection: element.selectionDirection,
      } : {}),
      bounds: rect(element),
    }));
  const textContainers = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,button,label")]
    .filter((element) => {
      const style = getComputedStyle(element);
      const bounds = element.getBoundingClientRect();
      return style.visibility !== "hidden" && style.display !== "none" && bounds.width > 0 && bounds.height > 0 && (element.textContent?.trim() ?? "") !== "";
    })
    .map((element) => {
      const style = getComputedStyle(element);
      return {
        id: element.dataset.luastraId ?? element.id ?? null,
        tag: element.tagName.toLowerCase(),
        text: element.textContent?.trim() ?? "",
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        clientWidth: element.clientWidth,
        clientHeight: element.clientHeight,
        scrollWidth: element.scrollWidth,
        scrollHeight: element.scrollHeight,
        overflowX: style.overflowX,
        overflowY: style.overflowY,
        clipped: (
          new Set(["hidden", "clip"]).has(style.overflowX) && element.scrollWidth > element.clientWidth + 2
        ) || (
          new Set(["hidden", "clip"]).has(style.overflowY) && element.scrollHeight > element.clientHeight + 2
        ),
        bounds: rect(element),
      };
    });
  const fields = document.querySelector('[data-luastra-id="accessibility/fields"]');
  const columns = fields ? getComputedStyle(fields).gridTemplateColumns.split(/\\s+/).filter(Boolean).length : 0;
  const main = [...document.querySelectorAll("main")].map((element) => ({ id: element.dataset.luastraId ?? null, bounds: rect(element) }));
  const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((element) => ({ level: Number(element.tagName.slice(1)), text: element.textContent?.trim() ?? "" }));
  const statuses = [...document.querySelectorAll('[role="status"],[role="alert"]')].map((element) => ({ role: element.getAttribute("role"), text: element.textContent?.trim() ?? "", hidden: element.hidden }));
  const dialogs = [...document.querySelectorAll("dialog")].map((element) => ({ open: element.open, label: element.getAttribute("aria-label"), bounds: rect(element) }));
  const describedByTargetsExist = controls.every((control) => !control.describedBy || control.describedBy.split(/\s+/).every((id) => document.getElementById(id)));
  const controlsReachable = controls.every((control) => {
    const top = control.bounds.y + window.scrollY;
    const bottom = control.bounds.bottom + window.scrollY;
    return top >= 0 && bottom <= document.documentElement.scrollHeight + 1;
  });
  return {
    viewport: {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      visualWidth: window.visualViewport?.width ?? null,
      visualHeight: window.visualViewport?.height ?? null,
      visualOffsetTop: window.visualViewport?.offsetTop ?? null,
    },
    preferences: {
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      darkColorScheme: matchMedia("(prefers-color-scheme: dark)").matches,
    },
    document: {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    },
    main,
    headings,
    statuses,
    dialogs,
    controls,
    textContainers,
    describedByTargetsExist,
    controlsReachable,
    responsiveGridColumns: columns,
    activeElement: document.activeElement?.dataset?.luastraId ?? document.activeElement?.tagName?.toLowerCase() ?? null,
    diagnostics: globalThis.__luastraDiagnostics?.snapshot?.() ?? null,
  };
})()`);

const focusedControl = options["focus-to"] === undefined
  ? null
  : metrics.controls.find((control) => control.id === options["focus-to"]) ?? null;
const visualTop = metrics.viewport.visualOffsetTop ?? 0;
const visualBottom = visualTop + (metrics.viewport.visualHeight ?? metrics.viewport.innerHeight);

const assertions = {
  previewPass: preview.result === "PASS",
  oneMain: metrics.main.length === 1,
  onePageTitle: metrics.headings.filter((heading) => heading.level === 1).length === 1,
  logicalHeadingOrder: metrics.headings.length > 0 && metrics.headings[0].level === 1 && metrics.headings.every((heading, index, values) => index === 0 || heading.level <= values[index - 1].level + 1),
  noHorizontalOverflow: metrics.document.horizontalOverflow === 0,
  labelledControls: metrics.controls.length > 0 && metrics.controls.every((control) => control.label.length > 0),
  describedByTargetsExist: metrics.describedByTargetsExist,
  minimumTargets: metrics.controls.every((control) => control.bounds.width >= 44 && control.bounds.height >= 44),
  noClippedText: metrics.textContainers.length > 0 && metrics.textContainers.every((element) => !element.clipped),
  controlsReachable: metrics.controlsReachable,
  keyboardHints: metrics.controls.filter((control) => control.tag === "input").every((control) => control.inputMode && control.enterKeyHint && control.autoComplete),
  requestedFocus: options["focus-to"] === undefined || metrics.activeElement === options["focus-to"],
  focusedControlVisible: options["focus-to"] === undefined || (
    focusedControl !== null
    && focusedControl.bounds.y >= visualTop
    && focusedControl.bounds.bottom <= visualBottom
  ),
  expectedColumns: options.expectedColumns === null || metrics.responsiveGridColumns === options.expectedColumns,
  runtimePassWhenAvailable: metrics.diagnostics === null || metrics.diagnostics.result === "PASS",
  noPendingRequestsWhenAvailable: metrics.diagnostics === null || metrics.diagnostics.pendingRequests === 0,
};
const result = Object.values(assertions).every(Boolean) ? "PASS" : "FAIL";
const report = {
  schemaVersion: 1,
  blocker: 10,
  capturedAt: new Date().toISOString(),
  evidenceClass: options["evidence-class"],
  host: options.host,
  orientation: options.orientation,
  requestedFocus: options["focus-to"] ?? null,
  project: preview.project,
  page: { title: page.title, url: page.url },
  assertions,
  metrics,
  result,
  boundary: `CDP measures the real debug WebView DOM and layout. Runtime diagnostics were ${metrics.diagnostics === null ? "not enabled for this packaged URL and are not claimed by this layout record" : "available and checked"}. This does not replace owner-observed assistive-technology announcements or real software-keyboard composition evidence.`,
};
const output = `${JSON.stringify(report, null, 2)}\n`;
if (options.out) await writeFile(resolve(options.out), output);
process.stdout.write(output);
if (result !== "PASS") process.exitCode = 1;
