import { createReadStream, watch as watchFiles } from "node:fs";
import { mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, isAbsolute, normalize, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { buildProject } from "./build-project.mjs";
import { loadProject } from "./load-project.mjs";
import { createMemoryDatabase, createSqliteDatabase } from "../backend/database.mjs";
import { createBackendRuntime, handleServerCapability } from "../backend/runtime.mjs";
import { createContentGrantStore } from "../backend/content.mjs";
import { createLocalPasswordIdentity } from "../backend/identity.mjs";
import { createLocalIdentityService } from "../backend/local-identity-service.mjs";
import { createSupabaseIdentityBoundary } from "../backend/provider-environment.mjs";
import { createSessionStore } from "../backend/session.mjs";

const projectModuleRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const platformRoot = resolve(projectModuleRoot, "../platform");
const phase5Host = resolve(projectModuleRoot, "../host");
const brandAssets = resolve(platformRoot, "brand");
const runMarker = ".luastra-generated-run";
const staticFiles = new Map([
  ["/", resolve(phase5Host, "index.html")],
  ["/index.html", resolve(phase5Host, "index.html")],
  ["/bootstrap-errors.js", resolve(platformRoot, "host/bootstrap-errors.js")],
  ["/main.js", resolve(platformRoot, "host/main.js")],
  ["/brand/favicon.svg", resolve(brandAssets, "favicon.svg")],
  ["/brand/luastra-mark.svg", resolve(brandAssets, "mark.svg")],
  ["/platform/artifacts/vm-wasm/luastra-vm.js", resolve(platformRoot, "artifacts/vm-wasm/luastra-vm.js")],
  ["/platform/artifacts/vm-wasm/luastra-vm.wasm", resolve(platformRoot, "artifacts/vm-wasm/luastra-vm.wasm")],
  ["/platform/protocol/generated/protocol.mjs", resolve(platformRoot, "protocol/generated/protocol.mjs")],
  ["/platform/protocol/request-ledger.mjs", resolve(platformRoot, "protocol/request-ledger.mjs")],
  ["/platform/renderer/from-protocol-tree.mjs", resolve(platformRoot, "renderer/from-protocol-tree.mjs")],
  ["/platform/renderer/reconciler.mjs", resolve(platformRoot, "renderer/reconciler.mjs")],
  ["/platform/renderer/dom-adapter.mjs", resolve(platformRoot, "renderer/dom-adapter.mjs")],
  ["/platform/renderer/dom-motion-adapter.mjs", resolve(platformRoot, "renderer/dom-motion-adapter.mjs")],
  ["/platform/renderer/motion-renderer-session.mjs", resolve(platformRoot, "renderer/motion-renderer-session.mjs")],
  ["/platform/motion/descriptor.mjs", resolve(platformRoot, "motion/descriptor.mjs")],
  ["/platform/motion/tween-engine.mjs", resolve(platformRoot, "motion/tween-engine.mjs")],
  ["/platform/motion/motion-runtime.mjs", resolve(platformRoot, "motion/motion-runtime.mjs")],
  ["/platform/scheduler/event-frame-scheduler.mjs", resolve(platformRoot, "scheduler/event-frame-scheduler.mjs")],
  ["/platform/host/platform-capabilities.mjs", resolve(platformRoot, "host/platform-capabilities.mjs")],
  ["/platform/host/rpc-capabilities.mjs", resolve(platformRoot, "host/rpc-capabilities.mjs")],
  ["/platform/host/media-capabilities.mjs", resolve(platformRoot, "host/media-capabilities.mjs")],
  ["/platform/host/timer-capabilities.mjs", resolve(platformRoot, "host/timer-capabilities.mjs")],
  ["/platform/host/asset-registry.mjs", resolve(platformRoot, "host/asset-registry.mjs")],
  ["/platform/media/media-wire.mjs", resolve(platformRoot, "media/media-wire.mjs")],
  ["/platform/media/media-state-machine.mjs", resolve(platformRoot, "media/media-state-machine.mjs")],
  ["/platform/host/lifecycle-bridge.mjs", resolve(platformRoot, "host/lifecycle-bridge.mjs")],
  ["/platform/host/keyboard-viewport-manager.mjs", resolve(platformRoot, "host/keyboard-viewport-manager.mjs")],
  ["/platform/host/first-paint-gate.mjs", resolve(platformRoot, "host/first-paint-gate.mjs")],
  ["/platform/phase5-ui.css", resolve(phase5Host, "phase5-ui.css")],
]);
const mime = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".webp", "image/webp"],
  [".avif", "image/avif"],
  [".mp3", "audio/mpeg"],
  [".m4a", "audio/mp4"],
  [".wav", "audio/wav"],
  [".ogg", "audio/ogg"],
  [".woff2", "font/woff2"],
  [".wasm", "application/wasm"],
  [".luauc", "application/octet-stream"],
]);

function fail(message) { throw new Error(message); }

function sessionBoundary(project, { environment, providerFetch, now }) {
  if (project.backend?.identity.provider === "supabase") return createSupabaseIdentityBoundary({ projectRoot: project.projectRoot, environment, fetchImpl: providerFetch, now });
  const sessions = createSessionStore({ now });
  return Object.freeze({ sessions, identity: null, close() {} });
}

async function projectBackend(project, boundary) {
  if (!project.backend) return null;
  const implementation = await import(`${pathToFileURL(project.backend.handlerPath).href}?sha=${project.backend.handlerSha256}`);
  if (typeof implementation.createHandlers !== "function") fail("backend handler must export createHandlers");
  const database = project.backend.database.provider === "sqlite" ? createSqliteDatabase({ path: project.backend.database.path }) : createMemoryDatabase();
  const content = createContentGrantStore({ items: project.backend.content });
  const localIdentity = project.backend.identity.provider === "local-password" ? createLocalPasswordIdentity({ database }) : null;
  const identity = localIdentity ? createLocalIdentityService({ identity: localIdentity, sessions: boundary.sessions }) : boundary.identity;
  try {
    const handlers = await implementation.createHandlers({ database, identity: localIdentity });
    const runtime = createBackendRuntime({ contract: project.backend.declaration.value, handlers, database, sessions: boundary.sessions, content, identity });
    return Object.freeze({ runtime, content, dispose() { content.dispose(); database.close(); } });
  } catch (error) {
    content.dispose();
    database.close();
    throw error;
  }
}

async function readJsonBody(request, maximumBytes = 65536) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of request) {
    bytes += chunk.byteLength;
    if (bytes > maximumBytes) fail("backend request exceeds 65536 bytes");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function prepareRunRoot(root) {
  const info = await stat(root).catch(() => null);
  if (info) {
    if (!info.isDirectory()) fail(`run output is not a directory: ${root}`);
    const entries = await readdir(root);
    if (entries.length > 0 && !entries.includes(runMarker)) fail(`refusing non-Luastra run output: ${root}`);
    if (entries.includes(runMarker)) await rm(root, { recursive: true, force: true });
  }
  await mkdir(root, { recursive: true });
  await writeFile(resolve(root, runMarker), "Luastra generated run workspace v1\n");
}

function safeMountedFile(urlPath, bundleRoot) {
  if (urlPath.startsWith("/assets/")) {
    const local = decodeURIComponent(urlPath.slice(1));
    const file = resolve(bundleRoot, normalize(local));
    const fromRoot = relative(bundleRoot, file);
    return fromRoot === ".." || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot) ? null : file;
  }
  if (!urlPath.startsWith("/bundle/")) return staticFiles.get(urlPath) ?? null;
  const local = decodeURIComponent(urlPath.slice("/bundle/".length));
  const file = resolve(bundleRoot, normalize(local));
  const fromRoot = relative(bundleRoot, file);
  if (fromRoot === ".." || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) return null;
  return file;
}

function byteRange(value, size) {
  if (value === undefined) return null;
  if (!Number.isSafeInteger(size) || size <= 0) return false;
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || (match[1] === "" && match[2] === "")) return false;
  let start;
  let end;
  if (match[1] === "") {
    const suffix = Number(match[2]);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) return false;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] === "" ? size - 1 : Number(match[2]);
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) return false;
    end = Math.min(end, size - 1);
  }
  return { start, end };
}

export async function runProject({ manifestPath, port = 4175, watch = true, onEvent = () => {}, environment = process.env, providerFetch = globalThis.fetch, now = () => Date.now() }) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) fail(`invalid run port: ${port}`);
  if (typeof watch !== "boolean" || typeof onEvent !== "function" || !environment || typeof environment !== "object" || typeof providerFetch !== "function" || typeof now !== "function") fail("invalid run options");
  let project = await loadProject(manifestPath);
  const initialIdentityProvider = project.backend?.identity.provider ?? "none";
  const boundary = sessionBoundary(project, { environment, providerFetch, now });
  let activeBackend = null;
  const runRoot = resolve(project.projectRoot, ".luastra/run");
  await prepareRunRoot(runRoot);
  let generation = 0;
  let activeBundle = null;
  const buildNext = async () => {
    generation += 1;
    const candidate = resolve(runRoot, `bundle-${generation}`);
    let nextBackend = null;
    try {
      const built = await buildProject({ manifestPath: project.manifestPath, outputDirectory: candidate, target: "bundle" });
      const nextProject = await loadProject(project.manifestPath);
      if ((nextProject.backend?.identity.provider ?? "none") !== initialIdentityProvider) fail("backend.identity.provider change requires restarting Luastra run");
      nextBackend = await projectBackend(nextProject, boundary);
      const previous = activeBundle;
      const previousBackend = activeBackend;
      activeBundle = candidate;
      project = nextProject;
      activeBackend = nextBackend;
      nextBackend = null;
      if (previous) await rm(previous, { recursive: true, force: true });
      previousBackend?.dispose();
      return built;
    } catch (error) {
      nextBackend?.dispose();
      await rm(candidate, { recursive: true, force: true });
      throw error;
    }
  };
  let initial;
  try { initial = await buildNext(); }
  catch (error) { boundary.close(); throw error; }
  const eventClients = new Set();
  const server = createServer(async (request, response) => {
    try {
      if (!request.url) { response.writeHead(400).end(); return; }
      const pathname = new URL(request.url, "http://127.0.0.1").pathname;
      if (pathname === "/__luastra/logs") {
        if (request.method !== "POST") { response.writeHead(405).end(); return; }
        if (!String(request.headers["content-type"] ?? "").startsWith("application/json")) { response.writeHead(415).end(); return; }
        const body = await readJsonBody(request, 16384);
        const records = body && typeof body === "object" && !Array.isArray(body) && Object.keys(body).length === 1 ? body.records : null;
        if (!Array.isArray(records) || records.length < 1 || records.length > 128) { response.writeHead(400).end("Invalid log records"); return; }
        for (const record of records) {
          if (!record || typeof record !== "object" || Array.isArray(record) || Object.keys(record).sort().join("\n") !== "level\nmessage" ||
              !new Set(["log", "warn", "error"]).has(record.level) || typeof record.message !== "string" || Buffer.byteLength(record.message) > 4096) {
            response.writeHead(400).end("Invalid log record"); return;
          }
        }
        for (const record of records) onEvent({ command: "run", result: "LOG", project: project.id, level: record.level, message: record.message });
        response.writeHead(204, { "Cache-Control": "no-store" }).end();
        return;
      }
      if (pathname === "/__luastra/rpc") {
        if (request.method !== "POST") { response.writeHead(405).end(); return; }
        if (!activeBackend) { response.writeHead(404).end("Backend not configured"); return; }
        if (!String(request.headers["content-type"] ?? "").startsWith("application/json")) { response.writeHead(415).end(); return; }
        const controller = new AbortController();
        request.once("aborted", () => controller.abort());
        const capability = await readJsonBody(request);
        const principal = project.backend.authentication === "session"
          ? boundary.sessions.resolveAuthorization(request.headers.authorization)
          : { id: "local-user", roles: ["user"], session: "local-development" };
        const handled = await handleServerCapability(capability, {
          runtime: activeBackend.runtime,
          principal,
          signal: controller.signal,
        });
        response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }).end(JSON.stringify(handled));
        return;
      }
      const contentMatch = /^\/__luastra\/content\/([A-Za-z0-9_-]{32,256})$/.exec(pathname);
      if (contentMatch) {
        if (!new Set(["GET", "HEAD"]).has(request.method ?? "")) { response.writeHead(405).end(); return; }
        const item = activeBackend?.content.resolve(contentMatch[1]);
        const fileInfo = item ? await stat(item.path).catch(() => null) : null;
        if (!item || !fileInfo?.isFile() || fileInfo.size !== item.bytes) { response.writeHead(404).end("Not found"); return; }
        response.setHeader("Content-Type", item.mediaType);
        response.setHeader("Cache-Control", "private, no-store");
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("Accept-Ranges", "bytes");
        const range = byteRange(request.headers.range, fileInfo.size);
        if (range === false) { response.writeHead(416, { "Content-Range": `bytes */${fileInfo.size}` }).end(); return; }
        if (range) {
          response.writeHead(206, { "Content-Range": `bytes ${range.start}-${range.end}/${fileInfo.size}`, "Content-Length": range.end - range.start + 1 });
          if (request.method === "HEAD") { response.end(); return; }
          createReadStream(item.path, range).pipe(response);
          return;
        }
        response.setHeader("Content-Length", fileInfo.size);
        if (request.method === "HEAD") { response.writeHead(200).end(); return; }
        createReadStream(item.path).pipe(response);
        return;
      }
      if (!new Set(["GET", "HEAD"]).has(request.method ?? "")) { response.writeHead(405).end(); return; }
      if (pathname === "/__luastra/events") {
        response.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-store", Connection: "keep-alive" });
        response.write(": connected\n\n");
        eventClients.add(response);
        request.once("close", () => eventClients.delete(response));
        return;
      }
      const file = safeMountedFile(pathname, activeBundle);
      const fileInfo = file ? await stat(file).catch(() => null) : null;
      if (!file || !fileInfo?.isFile()) { response.writeHead(404).end("Not found"); return; }
      response.setHeader("Content-Type", mime.get(extname(file)) ?? "application/octet-stream");
      response.setHeader("Cache-Control", "no-store");
      response.setHeader("Accept-Ranges", "bytes");
      const range = byteRange(request.headers.range, fileInfo.size);
      if (range === false) { response.writeHead(416, { "Content-Range": `bytes */${fileInfo.size}` }).end(); return; }
      if (range) {
        response.writeHead(206, { "Content-Range": `bytes ${range.start}-${range.end}/${fileInfo.size}`, "Content-Length": range.end - range.start + 1 });
        if (request.method === "HEAD") { response.end(); return; }
        createReadStream(file, range).pipe(response);
        return;
      }
      response.setHeader("Content-Length", fileInfo.size);
      if (request.method === "HEAD") { response.writeHead(200).end(); return; }
      createReadStream(file).pipe(response);
    } catch (error) {
      response.writeHead(500).end(String(error?.message ?? error));
    }
  });
  await new Promise((accept, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", accept);
  });
  const address = server.address();
  const actualPort = typeof address === "object" && address ? address.port : port;
  const url = `http://127.0.0.1:${actualPort}/`;
  onEvent({
    command: "run",
    result: "READY",
    project: project.id,
    url,
    contentSha256: initial.projectContentSha256,
    bundleContentSha256: initial.bundleContentSha256,
    watch,
    backend: project.backend ? (project.backend.authentication === "session" ? "local-session" : "local-authenticated") : "none",
    identityProvider: project.backend?.identity.provider ?? "none",
  });

  const watchers = [];
  let rebuildTimer = null;
  let rebuilding = false;
  let queued = false;
  const notify = (event, value) => {
    for (const client of eventClients) client.write(`event: ${event}\ndata: ${String(value).replaceAll("\n", " ")}\n\n`);
  };
  const rebuild = async () => {
    if (rebuilding) { queued = true; return; }
    rebuilding = true;
    try {
      const built = await buildNext();
      onEvent({ command: "run", result: "REBUILT", project: built.project, contentSha256: built.projectContentSha256, bundleContentSha256: built.bundleContentSha256 });
      notify("reload", built.projectContentSha256);
    } catch (error) {
      const message = String(error?.message ?? error);
      onEvent({ command: "run", result: "BUILD_ERROR", project: project.id, error: message });
      notify("build-error", message);
    } finally {
      rebuilding = false;
      if (queued) { queued = false; await rebuild(); }
    }
  };
  const schedule = () => {
    if (rebuildTimer) clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(rebuild, 120);
  };
  if (watch) {
    const shouldRebuild = (_event, filename) => {
      if (!filename) return;
      const local = String(filename).split("\\").join("/");
      if (local === ".luastra" || local.startsWith(".luastra/") || local === ".git" || local.startsWith(".git/") || local === "dist" || local.startsWith("dist/")) return;
      schedule();
    };
    try {
      watchers.push(watchFiles(project.projectRoot, { recursive: true }, shouldRebuild));
    } catch {
      for (const source of new Set([project.manifestPath, ...[...project.modules.values()].map((module) => module.sourcePath)])) watchers.push(watchFiles(source, schedule));
    }
  }

  let closeResolve;
  const closed = new Promise((accept) => { closeResolve = accept; });
  let closing = false;
  const close = async () => {
    if (closing) return closed;
    closing = true;
    if (rebuildTimer) clearTimeout(rebuildTimer);
    for (const watcher of watchers) watcher.close();
    for (const client of eventClients) client.end();
    const serverClosed = new Promise((accept) => server.close(accept));
    server.closeIdleConnections?.();
    server.closeAllConnections?.();
    await serverClosed;
    activeBackend?.dispose();
    activeBackend = null;
    boundary.close();
    closeResolve();
    return closed;
  };
  return Object.freeze({ url, closed, close });
}
