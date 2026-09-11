import { spawn } from "node:child_process";
import { cp, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { runProject } from "../project/run-project.mjs";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const debuggerPort = 9243;
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");

function fail(message) { throw new Error(message); }
function delay(milliseconds) { return new Promise((accept) => setTimeout(accept, milliseconds)); }
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
    return new Promise((accept, reject) => { this.#pending.set(id, { method, resolve: accept, reject }); this.#socket.send(JSON.stringify({ id, method, params })); });
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
async function waitFor(client, expression, label) {
  for (let attempt = 0; attempt < 400; attempt += 1) {
    if (await evaluate(client, expression)) return;
    await delay(25);
  }
  fail(`timeout waiting for ${label}`);
}
async function click(client, id) {
  const globalObject = await client.send("Runtime.evaluate", { expression: "globalThis" });
  const objectId = globalObject.result?.objectId;
  if (!objectId) fail("browser global object is unavailable");
  try {
    const result = await client.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: "function (controlId) { const node = this.document.getElementById(controlId); if (!node) return false; node.click(); return true; }",
      arguments: [{ value: id }],
      returnByValue: true,
    });
    if (result.exceptionDetails) fail(`browser click failed: ${result.exceptionDetails.exception?.description ?? result.exceptionDetails.text}`);
    if (!result.result?.value) fail(`missing control: ${id}`);
  } finally {
    await client.send("Runtime.releaseObject", { objectId }).catch(() => {});
  }
}

const temporary = await mkdtemp(resolve(tmpdir(), "luastra-content-upload-browser-"));
const browserProfile = resolve(temporary, "chrome-profile");
const project = resolve(temporary, "project");
const selectedFile = resolve(temporary, "selected.png");
let controller = null;
let browser = null;
let client = null;
try {
  await cp(resolve(import.meta.dirname, "../test-fixtures/content-upload-browser"), project, { recursive: true });
  await writeFile(selectedFile, png);
  controller = await runProject({ manifestPath: resolve(project, "luastra.json"), port: 0, watch: false });
  browser = spawn(chromePath, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", `--remote-debugging-port=${debuggerPort}`, `--user-data-dir=${browserProfile}`, controller.url], { stdio: "ignore" });
  const page = await waitForPage(browser);
  client = new CdpClient(page.webSocketDebuggerUrl);
  await client.send("Runtime.enable");
  await client.send("DOM.enable");
  await waitFor(client, `window.__luastraPreview?.result === "PASS" && document.getElementById("upload/select")`, "Luastra upload fixture");
  await click(client, "upload/select");
  await waitFor(client, `document.querySelector('input[type="file"]') !== null`, "private file input");
  const { root } = await client.send("DOM.getDocument", { depth: -1, pierce: true });
  const { nodeId } = await client.send("DOM.querySelector", { nodeId: root.nodeId, selector: 'input[type="file"]' });
  if (!nodeId) fail("file input is not available through CDP");
  await client.send("DOM.setFileInputFiles", { nodeId, files: [selectedFile] });
  await waitFor(client, `document.getElementById("upload/status")?.textContent?.includes("Committed; progress 100")`, "committed upload");
  const committed = await evaluate(client, `(() => { const image = document.getElementById("upload/image"); return { source: image?.src ?? "", inputPresent: document.querySelector('input[type="file"]') !== null, status: document.getElementById("upload/status")?.textContent ?? "" }; })()`);
  if (!committed.source.includes("/__luastra/content/") || committed.source.includes("selected.png") || committed.inputPresent) fail("committed image escaped the opaque content boundary");
  await click(client, "upload/delete");
  await waitFor(client, `document.getElementById("upload/status")?.textContent?.includes("Deleted; progress 0") && !document.getElementById("upload/image")`, "deleted upload");
  const report = {
    result: "PASS",
    checks: {
      realFileInput: true,
      opaquePreviewAndProviderBoundary: true,
      streamedUpload: true,
      serverCommitAndDisplay: true,
      deleteInvalidatesDisplay: true,
    },
    committed,
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} finally {
  client?.close();
  if (browser && browser.exitCode === null) browser.kill("SIGTERM");
  await controller?.close();
  await rm(temporary, { recursive: true, force: true });
}
