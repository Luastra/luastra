import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { runProject } from "../project/run-project.mjs";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const debuggerPort = 9241;
const goodToken = "preview:abcdefghijklmnopqrstuvwxyz_01234";
const brokenToken = "preview:bcdefghijklmnopqrstuvwxyz_012345";

function fail(message) { throw new Error(message); }
function delay(milliseconds) { return new Promise((accept) => setTimeout(accept, milliseconds)); }

class CdpClient {
  #id = 0;
  #listeners = new Map();
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
      if (!message.id) {
        for (const listener of this.#listeners.get(message.method) ?? []) listener(message.params);
        return;
      }
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

async function waitForPage(port, browser) {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (browser.exitCode !== null) fail(`Chromium exited before readiness (${browser.exitCode})`);
    const pages = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.ok ? response.json() : null).catch(() => null);
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
  for (let attempt = 0; attempt < 320; attempt += 1) {
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

async function status(client) {
  return evaluate(client, `document.querySelector('[data-luastra-id="dynamic-image/status"]')?.textContent ?? ""`);
}

async function main() {
  const repository = resolve(import.meta.dirname, "..");
  const goodPng = (await readFile(resolve(repository, "examples/live-visuals/assets/luastra-mark.png"))).toString("base64");
  const profile = await mkdtemp(resolve(tmpdir(), "luastra-dynamic-image-chromium-"));
  const application = await runProject({
    manifestPath: resolve(repository, "test-fixtures/dynamic-image-browser/luastra.json"),
    port: 0,
    watch: false,
  });
  const browser = spawn(chromePath, [
    "--headless=new",
    `--remote-debugging-port=${debuggerPort}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "about:blank",
  ], { stdio: "ignore" });
  let client = null;
  try {
    const page = await waitForPage(debuggerPort, browser);
    client = new CdpClient(page.webSocketDebuggerUrl);
    await client.ready;
    await client.send("Runtime.enable");
    await client.send("Page.enable");
    await client.send("Network.enable");
    await client.send("Page.addScriptToEvaluateOnNewDocument", { source: `(() => {
      const goodToken = ${JSON.stringify(goodToken)};
      const brokenToken = ${JSON.stringify(brokenToken)};
      const goodBytes = Uint8Array.from(atob(${JSON.stringify(goodPng)}), (character) => character.charCodeAt(0));
      window.__luastraPreviewAudit = { resolved: [], released: [] };
      globalThis.__luastraResolvePreviewContent = (reference) => {
        if (reference !== goodToken && reference !== brokenToken) throw new Error("unknown preview token");
        const bytes = reference === goodToken ? goodBytes : new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
        const url = URL.createObjectURL(new Blob([bytes], { type: "image/png" }));
        window.__luastraPreviewAudit.resolved.push(reference);
        return { url, release() { window.__luastraPreviewAudit.released.push(reference); URL.revokeObjectURL(url); } };
      };
    })();` });
    await client.send("Page.navigate", { url: `${application.url}?luastraDiagnostics=1` });
    await waitFor(client, "window.__luastraPreview?.result === 'PASS'", "Luastra preview PASS");
    try {
      await waitFor(client, `(document.querySelector('[data-luastra-id="dynamic-image/status"]')?.textContent ?? '').includes('loaded 1')`, "initial preview decode");
    } catch (error) {
      const debug = await evaluate(client, `(() => {
        const image = document.querySelector('[data-luastra-id="dynamic-image/image"]');
        return { preview: window.__luastraPreview, error: document.querySelector('#error')?.textContent, status: document.querySelector('[data-luastra-id="dynamic-image/status"]')?.textContent, source: image?.src, complete: image?.complete, naturalWidth: image?.naturalWidth, naturalHeight: image?.naturalHeight, audit: window.__luastraPreviewAudit };
      })()`);
      throw new Error(`${error.message}: ${JSON.stringify(debug)}`);
    }

    const initial = await evaluate(client, `(() => {
      const image = document.querySelector('[data-luastra-id="dynamic-image/image"]');
      return {
        status: document.querySelector('[data-luastra-id="dynamic-image/status"]')?.textContent,
        source: image?.src,
        complete: image?.complete,
        naturalWidth: image?.naturalWidth,
        naturalHeight: image?.naturalHeight,
        mediaType: image?.dataset?.luastraImageMediaType,
        bytes: image?.dataset?.luastraImageContentBytes,
        width: image?.dataset?.luastraImagePixelWidth,
        height: image?.dataset?.luastraImagePixelHeight,
        placeholderColor: image?.dataset?.luastraImagePlaceholderColor,
        audit: window.__luastraPreviewAudit,
      };
    })()`);

    await click(client, "dynamic-image/broken");
    await waitFor(client, `(document.querySelector('[data-luastra-id="dynamic-image/status"]')?.textContent ?? '').includes('failed 1')`, "broken preview error");
    const broken = { status: await status(client), audit: await evaluate(client, "window.__luastraPreviewAudit") };

    await click(client, "dynamic-image/content-handle");
    await waitFor(client, `(document.querySelector('[data-luastra-id="dynamic-image/status"]')?.textContent ?? '').includes('failed 2')`, "missing content error");
    const content = await evaluate(client, `(() => ({
      status: document.querySelector('[data-luastra-id="dynamic-image/status"]')?.textContent,
      source: document.querySelector('[data-luastra-id="dynamic-image/image"]')?.src,
      audit: window.__luastraPreviewAudit,
    }))()`);

    await click(client, "dynamic-image/good");
    await waitFor(client, `(document.querySelector('[data-luastra-id="dynamic-image/status"]')?.textContent ?? '').includes('loaded 2')`, "replacement preview decode");
    await client.send("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
    await click(client, "dynamic-image/content-handle");
    await waitFor(client, `(document.querySelector('[data-luastra-id="dynamic-image/status"]')?.textContent ?? '').includes('failed 3')`, "offline content error");
    const offline = { status: await status(client), audit: await evaluate(client, "window.__luastraPreviewAudit") };
    await client.send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });

    const assertions = {
      realVmAndRenderer: initial.status.includes("loaded 1") && initial.complete === true,
      decodedDimensions: initial.naturalWidth === 512 && initial.naturalHeight === 512,
      opaquePreviewUrl: initial.source.startsWith("blob:") && !initial.source.includes(goodToken),
      metadataAndPlaceholder: initial.mediaType === "image/png" && initial.bytes === "5785" && initial.width === "512" && initial.height === "512" && initial.placeholderColor === "#DDE5E2",
      decodeErrorAction: broken.status.includes("failed 1"),
      expiredOrMissingHandleAction: content.status.includes("failed 2") && new URL(content.source).pathname === "/__luastra/content/cdefghijklmnopqrstuvwxyz_0123456",
      offlineHandleAction: offline.status.includes("failed 3"),
      previewReleasedOnReplacement: offline.audit.released.filter((reference) => reference === goodToken).length === 2 && offline.audit.released.includes(brokenToken),
      previewResolvedOnDemand: offline.audit.resolved.filter((reference) => reference === goodToken).length === 2 && offline.audit.resolved.filter((reference) => reference === brokenToken).length === 1,
    };
    const report = {
      schemaVersion: 1,
      evidenceClass: "REAL_CHROMIUM_DYNAMIC_IMAGES",
      browser: "Google Chrome headless via CDP",
      project: "dev.luastra.dynamic-image-browser",
      assertions,
      sample: { initial, broken, content, offline },
      result: Object.values(assertions).every(Boolean) ? "PASS" : "FAIL",
      boundary: "This gate covers the actual Luau/Wasm, web renderer, and Chromium image pipeline for host-local preview decode, corrupt-image failure, unavailable and offline same-origin content handles, bounded metadata, placeholder color, and last-owner preview release. It does not certify VoiceOver, NVDA, native-shell memory behavior, remote provider availability, camera, picker, upload, or video.",
    };
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (report.result !== "PASS") process.exitCode = 1;
  } finally {
    client?.close();
    browser.kill("SIGTERM");
    await application.close();
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

main().catch((error) => {
  process.stderr.write(`${String(error?.stack ?? error)}\n`);
  process.exitCode = 1;
});
