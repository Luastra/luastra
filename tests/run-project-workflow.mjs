import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { createInterface } from "node:readline";
import test from "node:test";

const prototype = resolve(import.meta.dirname, "..");
const cli = resolve(prototype, "cli/luastra.mjs");

function create(project) {
  const result = spawnSync(process.execPath, [cli, "create", project], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
}

function start(project) {
  const child = spawn(process.execPath, [cli, "run", `--project=${project}`, "--port=0"], { stdio: ["ignore", "pipe", "pipe"] });
  const events = [];
  const waiters = [];
  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  const lines = createInterface({ input: child.stdout });
  lines.on("line", (line) => {
    let event;
    try { event = JSON.parse(line); } catch { return; }
    events.push(event);
    for (const waiter of [...waiters]) {
      if (!waiter.predicate(event)) continue;
      waiters.splice(waiters.indexOf(waiter), 1);
      clearTimeout(waiter.timer);
      waiter.resolve(event);
    }
  });
  const waitFor = (predicate, timeoutMs = 10_000) => {
    const existing = events.find(predicate);
    if (existing) return Promise.resolve(existing);
    return new Promise((accept, reject) => {
      const waiter = { predicate, resolve: accept, timer: setTimeout(() => {
        waiters.splice(waiters.indexOf(waiter), 1);
        reject(new Error(`run event timeout; stderr: ${stderr}`));
      }, timeoutMs) };
      waiters.push(waiter);
    });
  };
  return { child, waitFor, stderr: () => stderr };
}

async function waitForSse(reader, pattern, timeoutMs = 10_000) {
  const decoder = new TextDecoder();
  let value = "";
  const reading = (async () => {
    while (true) {
      const next = await reader.read();
      if (next.done) throw new Error("SSE stream ended early");
      value += decoder.decode(next.value, { stream: true });
      if (value.includes(pattern)) return value;
    }
  })();
  return new Promise((accept, reject) => {
    const timer = setTimeout(() => reject(new Error(`SSE timeout waiting for ${pattern}`)), timeoutMs);
    reading.then(
      (result) => { clearTimeout(timer); accept(result); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });
}

async function assertBrowserModuleGraph(entryUrl, seen = new Set()) {
  const identity = entryUrl.href;
  if (seen.has(identity)) return;
  seen.add(identity);
  const response = await fetch(entryUrl);
  assert.equal(response.status, 200, `browser module is unavailable: ${identity}`);
  const source = await response.text();
  const specifiers = [...source.matchAll(/(?:from\s+|import\s*)["']([^"']+)["']/g)].map((match) => match[1]);
  for (const specifier of specifiers) {
    if (!(specifier.startsWith("/") || specifier.startsWith("./") || specifier.startsWith("../"))) continue;
    await assertBrowserModuleGraph(new URL(specifier, entryUrl), seen);
  }
}

test("run serves the project, atomically rebuilds, reports errors and emits reload", { timeout: 25_000 }, async () => {
  const workspace = await mkdtemp(resolve(tmpdir(), "luastra-run-control-"));
  const project = resolve(workspace, "run-app");
  let processState = null;
  let sseReader = null;
  try {
    create(project);
    const manifestPath = resolve(project, "luastra.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    const cover = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
    await writeFile(resolve(project, "assets/cover.png"), cover);
    manifest.assets = [{ id: "catalogue/cover", source: "assets/cover.png", mediaType: "image/png" }];
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    processState = start(project);
    const ready = await processState.waitFor((event) => event.result === "READY");
    assert.equal(ready.watch, true);
    const index = await fetch(ready.url);
    assert.equal(index.status, 200);
    assert.match(await index.text(), /Luastra Preview/);
    const main = await fetch(new URL("main.js", ready.url));
    assert.equal(main.status, 200);
    assert.match(await main.text(), /EventSource\("\/__luastra\/events"\)/);
    await assertBrowserModuleGraph(new URL("main.js", ready.url));
    const initialBundleResponse = await fetch(new URL("bundle/luastra.bundle.json", ready.url));
    assert.equal(initialBundleResponse.status, 200);
    const initialBundle = await initialBundleResponse.json();
    assert.equal(initialBundle.contentSha256, ready.bundleContentSha256);
    assert.equal((await fetch(new URL("platform/protocol/generated/protocol.mjs", ready.url))).status, 200);
    const uiCss = await fetch(new URL("platform/phase5-ui.css", ready.url));
    assert.equal(uiCss.status, 200);
    assert.equal((await fetch(new URL("platform/host/first-paint-gate.mjs", ready.url))).status, 200);
    assert.match(uiCss.headers.get("content-type") ?? "", /^text\/css\b/);
    assert.match(await uiCss.text(), /env\(safe-area-inset-top\)/);
    assert.equal((await fetch(new URL("brand/favicon.svg", ready.url))).status, 200);
    const servedAsset = await fetch(new URL("assets/catalogue/cover.png", ready.url));
    assert.equal(servedAsset.headers.get("content-type"), "image/png");
    assert.deepEqual(Buffer.from(await servedAsset.arrayBuffer()), cover);
    const rangedAsset = await fetch(new URL("assets/catalogue/cover.png", ready.url), { headers: { Range: "bytes=0-3" } });
    assert.equal(rangedAsset.status, 206);
    assert.equal(rangedAsset.headers.get("accept-ranges"), "bytes");
    assert.equal(rangedAsset.headers.get("content-range"), `bytes 0-3/${cover.byteLength}`);
    assert.deepEqual(Buffer.from(await rangedAsset.arrayBuffer()), cover.subarray(0, 4));
    const invalidRange = await fetch(new URL("assets/catalogue/cover.png", ready.url), { headers: { Range: `bytes=${cover.byteLength}-` } });
    assert.equal(invalidRange.status, 416);
    assert.equal((await fetch(new URL("platform/runtime/vm_wasm.cpp", ready.url))).status, 404, "dev host exposed a non-admitted platform file");

    const logResponse = await fetch(new URL("__luastra/logs", ready.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records: [
        { level: "log", message: "current page: welcome" },
        { level: "warn", message: "Unicode: こんにちは" },
      ] }),
    });
    assert.equal(logResponse.status, 204);
    assert.equal((await processState.waitFor((event) => event.result === "LOG" && event.message === "current page: welcome")).level, "log");
    assert.equal((await processState.waitFor((event) => event.result === "LOG" && event.message === "Unicode: こんにちは")).level, "warn");

    const changedCover = Buffer.from(cover);
    changedCover[changedCover.length - 1] ^= 1;
    await writeFile(resolve(project, "assets/cover.png"), changedCover);
    const assetRebuilt = await processState.waitFor((event) => event.result === "REBUILT" && event.bundleContentSha256 === ready.bundleContentSha256);
    assert.notEqual(assetRebuilt.contentSha256, ready.contentSha256);
    assert.deepEqual(Buffer.from(await (await fetch(new URL("assets/catalogue/cover.png", ready.url))).arrayBuffer()), changedCover);

    const abort = new AbortController();
    const sse = await fetch(new URL("__luastra/events", ready.url), { signal: abort.signal });
    assert.equal(sse.status, 200);
    sseReader = sse.body.getReader();
    const mainPath = resolve(project, "src/main.luau");
    const valid = await readFile(mainPath, "utf8");
    await writeFile(mainPath, valid.replace("Build apps like games.", "Build every kind of app."));
    const rebuilt = await processState.waitFor((event) => event.result === "REBUILT" && event.bundleContentSha256 !== ready.bundleContentSha256);
    assert.notEqual(rebuilt.contentSha256, ready.contentSha256);
    assert.match(await waitForSse(sseReader, "event: reload"), /event: reload/);
    const rebuiltBundle = await (await fetch(new URL("bundle/luastra.bundle.json", ready.url))).json();
    assert.equal(rebuiltBundle.contentSha256, rebuilt.bundleContentSha256);

    await writeFile(mainPath, valid.replace("return Application", "local broken: string = 42\n\nreturn Application"));
    const failed = await processState.waitFor((event) => event.result === "BUILD_ERROR");
    assert.match(failed.error, /Expected this to be 'string', but got 'number'/);
    const survivingBundle = await (await fetch(new URL("bundle/luastra.bundle.json", ready.url))).json();
    assert.equal(survivingBundle.contentSha256, rebuilt.bundleContentSha256, "failed rebuild replaced the last good bundle");

    abort.abort();
    processState.child.kill("SIGTERM");
    const exit = await new Promise((accept) => processState.child.once("exit", (code, signal) => accept({ code, signal })));
    if (process.platform === "win32") {
      assert.equal(exit.code, null, processState.stderr());
      assert.equal(exit.signal, "SIGTERM", processState.stderr());
    } else {
      assert.equal(exit.code, 0, processState.stderr());
    }
    processState = null;
  } finally {
    if (sseReader) await sseReader.cancel().catch(() => {});
    if (processState?.child.exitCode === null) processState.child.kill("SIGKILL");
    await rm(workspace, { recursive: true, force: true });
  }
});
