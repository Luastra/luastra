import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import { createContentGrantStore } from "../backend/content.mjs";
import { createContentUploadStore } from "../backend/uploads.mjs";
import { createSupabaseStorageProvider } from "../backend/providers/supabase-http.mjs";
import { decodeWire, encodeWire } from "../backend/wire.mjs";
import { loadBackendContract } from "../backend/contract.mjs";
import { writeGeneratedClient } from "../backend/generate-client.mjs";
import { inspectRasterImage } from "../platform/content/image-admission.mjs";
import { createContentCapabilities } from "../platform/host/content-capabilities.mjs";
import { decodeMediaWire, encodeMediaWire } from "../platform/media/media-wire.mjs";
import { validateCapabilityRequest } from "../platform/protocol/generated/protocol.mjs";
import { runProject } from "../project/run-project.mjs";

const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
const metadata = Object.freeze({ mediaType: "image/png", bytes: png.byteLength, width: 1, height: 1 });
let nextRequestId = 100;
function request(kind, operation, fields) {
  nextRequestId += 1;
  const traceId = `content-upload-${nextRequestId}`;
  const value = { version: 1, kind, requestId: nextRequestId, traceId, deadlineMs: 30_000, payload: { version: 1, operation, input: encodeMediaWire(fields), traceId, deadlineMs: 30_000 } };
  assert.equal(validateCapabilityRequest(value), true);
  return value;
}
function tokens() {
  let index = 0;
  return () => `opaque_token_${String(++index).padStart(40, "0")}`;
}

test("raster admission derives PNG metadata from bytes and rejects spoofing and polyglot tails", () => {
  assert.deepEqual(inspectRasterImage(png, { declaredMediaType: "image/png" }), { ...metadata, orientation: "normal" });
  assert.throws(() => inspectRasterImage(png, { declaredMediaType: "image/jpeg" }), /MIME type/);
  assert.throws(() => inspectRasterImage(Buffer.concat([png, Buffer.from("<script>")]), { declaredMediaType: "image/png" }), /trailing/);
  assert.throws(() => inspectRasterImage(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>")), /not an admitted/);
});

test("web content capabilities select opaque previews, upload outside RPC, report progress, cancel, and release", async () => {
  const blob = new Blob([png], { type: "image/png" });
  const created = [];
  const revoked = [];
  const progress = [];
  const uploadCalls = [];
  let pendingResolve;
  const xhr = { aborted: false, abort() { this.aborted = true; pendingResolve?.reject(Object.assign(new Error("cancelled"), { cancelled: true })); } };
  const capabilities = createContentCapabilities({
    selectImage: async () => blob,
    decodeImage: async () => ({ width: 1, height: 1 }),
    createObjectUrl: () => { const value = `blob:https://app.test/${created.length + 1}`; created.push(value); return value; },
    revokeObjectUrl: (value) => revoked.push(value),
    randomToken: tokens(),
    authorizationToken: () => "session-secret",
    uploadFile(options) {
      uploadCalls.push(options);
      options.onProgress(options.requestId, png.byteLength, png.byteLength);
      if (uploadCalls.length === 1) return Promise.resolve(encodeMediaWire({ bytes: String(png.byteLength), status: "uploaded" }));
      const transport = new Promise((resolvePromise, reject) => { pendingResolve = { resolve: resolvePromise, reject }; });
      return Object.assign(transport, { xhr });
    },
  });
  capabilities.subscribe((value) => progress.push(decodeMediaWire(value)));
  const picked = await capabilities.handle(request("content.pick", "image", { maximumBytes: "1024", maximumHeight: "32", maximumWidth: "32", source: "files" }));
  assert.equal(picked.response.status, "ok");
  const selected = decodeMediaWire(picked.response.payload);
  assert.equal(selected.status, "selected");
  assert.match(selected.handle, /^preview:[A-Za-z0-9_-]{32,256}$/);
  assert.equal(selected.handle.includes("session-secret"), false);
  const preview = capabilities.resolvePreview(selected.handle);
  assert.equal(preview.url, "blob:https://app.test/1");
  preview.release();
  assert.deepEqual(revoked, ["blob:https://app.test/1"]);
  const intent = `upload:${"u".repeat(43)}`;
  const uploaded = await capabilities.handle(request("content.upload", "start", { intent, selection: selected.handle }));
  assert.equal(decodeMediaWire(uploaded.response.payload).status, "uploaded");
  assert.equal(uploadCalls[0].endpoint, `/__luastra/upload/${"u".repeat(43)}`);
  assert.equal(uploadCalls[0].authorizationToken(), "session-secret");
  assert.equal(uploadCalls[0].deadlineMs, 30_000);
  assert.deepEqual({ ...progress.at(-1) }, { loaded: String(png.byteLength), requestId: String(uploaded.response.requestId), total: String(png.byteLength) });

  const secondRequest = request("content.upload", "start", { intent, selection: selected.handle });
  const pending = capabilities.handle(secondRequest);
  while (capabilities.activeUploads === 0) await Promise.resolve();
  const cancelled = await capabilities.handle(request("content.upload", "cancel", { requestId: String(secondRequest.requestId) }));
  assert.equal(decodeMediaWire(cancelled.response.payload).status, "cancelled");
  assert.equal((await pending).response.payload.code, "CANCELLED");
  assert.equal(xhr.aborted, true);
  const released = await capabilities.handle(request("content.pick", "release", { handle: selected.handle }));
  assert.equal(decodeMediaWire(released.response.payload).status, "released");
  assert.equal(capabilities.selectionCount, 0);
  capabilities.dispose();
});

test("cancelled web selection is distinct from failure", async () => {
  const capabilities = createContentCapabilities({ selectImage: async () => null, randomToken: tokens() });
  const result = await capabilities.handle(request("content.pick", "image", { maximumBytes: "1024", maximumHeight: "32", maximumWidth: "32", source: "files" }));
  assert.deepEqual({ ...decodeMediaWire(result.response.payload) }, { status: "cancelled" });
});

test("local upload intents bind principal and purpose through commit, display, delete, and cleanup", async (t) => {
  const root = await mkdtemp(resolve(tmpdir(), "luastra-content-upload-"));
  t.after(async () => rm(root, { recursive: true, force: true }));
  let current = 2_000_000_000_000;
  const content = createContentGrantStore({ items: [], now: () => current, randomToken: tokens() });
  const uploads = createContentUploadStore({
    declarations: [{ id: "profile-image", provider: "local", mediaTypes: ["image/png", "image/jpeg"], maximumBytes: 1024, maximumWidth: 32, maximumHeight: 32, maximumPixels: 1024, intentTtlMs: 60_000 }],
    localRoot: root, content, now: () => current, randomToken: tokens(),
  });
  const alice = { id: "alice" };
  const bob = { id: "bob" };
  const created = await uploads.createIntent("profile-image", metadata, { principal: alice });
  assert.match(created.handle, /^upload:[A-Za-z0-9_-]{32,256}$/);
  await assert.rejects(uploads.receive(created.handle.slice(7), { principal: bob, mediaType: "image/png", contentLength: png.byteLength, body: (async function* () { yield png; })() }), /unavailable/);
  assert.equal((await uploads.receive(created.handle.slice(7), { principal: alice, mediaType: "image/png", contentLength: png.byteLength, body: (async function* () { yield png.subarray(0, 20); yield png.subarray(20); })() })).status, "uploaded");
  const committed = await uploads.commit(created.handle, { principal: alice });
  assert.match(committed.objectId, /^[A-Za-z0-9_-]{32,256}$/);
  assert.match(committed.source, /^content:[A-Za-z0-9_-]{32,256}$/);
  const delivered = content.resolve(committed.source.slice(8));
  assert.deepEqual(await readFile(delivered.path), png);
  await assert.rejects(uploads.commit(created.handle, { principal: alice }), /unavailable/);
  const reopened = await uploads.openUploaded("profile-image", committed.objectId, metadata, { principal: alice });
  assert.match(reopened.source, /^content:/);
  assert.equal(await uploads.deleteUploaded("profile-image", committed.objectId, metadata, { principal: bob }), false);
  assert.equal(await uploads.deleteUploaded("profile-image", committed.objectId, metadata, { principal: alice }), true);
  assert.equal(await uploads.deleteUploaded("profile-image", committed.objectId, metadata, { principal: alice }), false);

  await uploads.createIntent("profile-image", metadata, { principal: alice, ttlMs: 1000 });
  current += 1001;
  await uploads.cleanup();
  assert.equal(uploads.pendingIntents, 0);

  const collision = await uploads.createIntent("profile-image", metadata, { principal: alice });
  await uploads.receive(collision.handle.slice(7), { principal: alice, mediaType: "image/png", contentLength: png.byteLength, body: (async function* () { yield png; })() });
  const objectId = `opaque_token_${String(6).padStart(40, "0")}`;
  const finalPath = resolve(root, "profile-image", createHash("sha256").update(alice.id).digest("hex"), `${objectId}.png`);
  const existing = Buffer.from("existing object");
  await writeFile(finalPath, existing);
  await assert.rejects(uploads.commit(collision.handle, { principal: alice }), /EEXIST/);
  assert.deepEqual(await readFile(finalPath), existing);
  await uploads.dispose();
});

test("Supabase upload authorization and object paths remain inside the backend adapter", async () => {
  const accessToken = "header.payload.signature";
  const path = `profile/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/${"o".repeat(43)}.png`;
  const calls = [];
  const provider = createSupabaseStorageProvider({
    url: "https://provider.example.test",
    publishableKey: "sb_publishable_0123456789abcdefghijklmnopqrstuvwxyz",
    uploads: [{ id: "profile-image", bucket: "private-media", prefix: "profile" }],
    async fetchImpl(urlValue, options = {}) {
      const url = new URL(urlValue);
      calls.push({ url, options });
      assert.equal(options.headers.Authorization, `Bearer ${accessToken}`);
      if (options.method === "POST" && url.pathname === `/storage/v1/object/upload/sign/private-media/${path}`) {
        return new Response(JSON.stringify({ url: `/object/upload/sign/private-media/${path}?token=provider-upload-secret` }), { status: 200, headers: { "content-type": "application/json" } });
      }
      if (options.method === "PUT" && url.pathname === `/storage/v1/object/upload/sign/private-media/${path}`) {
        assert.equal(url.searchParams.get("token"), "provider-upload-secret");
        const chunks = [];
        for await (const chunk of options.body) chunks.push(Buffer.from(chunk));
        assert.deepEqual(Buffer.concat(chunks), png);
        return new Response("", { status: 200 });
      }
      if (options.method === "POST" && url.pathname === `/storage/v1/object/sign/private-media/${path}`) {
        return new Response(JSON.stringify({ signedURL: `/object/sign/private-media/${path}?token=provider-read-secret` }), { status: 200, headers: { "content-type": "application/json" } });
      }
      if (options.method === "GET" && url.pathname === `/storage/v1/object/sign/private-media/${path}`) return new Response(png, { status: 200, headers: { "content-type": "image/png" } });
      if (options.method === "DELETE" && url.pathname === `/storage/v1/object/private-media/${path}`) return new Response(null, { status: 204 });
      throw new Error(`unexpected provider request: ${options.method} ${url.href}`);
    },
  });
  const object = { uploadId: "profile-image", bucket: "private-media", path };
  await assert.rejects(provider.uploadObject({ ...object, path: `other/${path}` }, accessToken, { mediaType: "image/png", body: (async function* () { yield png; })() }), /outside its upload declaration/);
  await provider.uploadObject(object, accessToken, { mediaType: "image/png", body: (async function* () { yield png; })() });
  const read = await provider.readObject(object, accessToken, { maximumBytes: 1024 });
  assert.deepEqual(read.bytes, png);
  assert.equal(read.mediaType, "image/png");
  assert.equal(await provider.deleteObject(object, accessToken), true);
  assert.equal(calls.some(({ url }) => url.href.includes("provider-upload-secret")), true);
  assert.equal(JSON.stringify(calls.map(({ options }) => options)).includes("provider-upload-secret"), false);
});

test("runner completes create-intent, streamed upload, commit, display, and delete end to end", async (t) => {
  const temporary = await mkdtemp(resolve(tmpdir(), "luastra-upload-runner-"));
  const project = resolve(temporary, "project");
  let controller = null;
  t.after(async () => { await controller?.close(); await rm(temporary, { recursive: true, force: true }); });
  await cp(resolve(import.meta.dirname, "../examples/meditation"), project, { recursive: true, filter: (source) => !source.split(/[\\/]/).some((part) => part === ".luastra" || part === "dist") });
  const manifestPath = resolve(project, "luastra.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.backend.authentication = "development";
  manifest.backend.uploads = [{ id: "profile-image", provider: "local", mediaTypes: ["image/png", "image/jpeg"], maximumBytes: 1024, maximumWidth: 32, maximumHeight: 32 }];
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const declarationPath = resolve(project, manifest.backend.declaration);
  const declaration = JSON.parse(await readFile(declarationPath, "utf8"));
  Object.assign(declaration.functions, {
    "content.upload.create.v1": { clientName: "createUpload", authorization: "user", mutation: true, idempotency: "required", input: { purpose: "string", mediaType: "string", bytes: "number", width: "number", height: "number" }, result: { handle: "string", expiresAt: "number" } },
    "content.upload.commit.v1": { clientName: "commitUpload", authorization: "user", mutation: true, idempotency: "required", input: { handle: "string" }, result: { objectId: "string", source: "string", mediaType: "string", bytes: "number", width: "number", height: "number", orientation: "string" } },
    "content.upload.delete.v1": { clientName: "deleteUpload", authorization: "user", mutation: true, idempotency: "required", input: { purpose: "string", objectId: "string", mediaType: "string", bytes: "number", width: "number", height: "number" }, result: { deleted: "boolean" } },
  });
  await writeFile(declarationPath, `${JSON.stringify(declaration, null, 2)}\n`);
  const originalHandler = await readFile(resolve(project, manifest.backend.handler), "utf8");
  await writeFile(resolve(project, "backend/base-handlers.mjs"), originalHandler);
  await writeFile(resolve(project, manifest.backend.handler), `
import { createHandlers as createBaseHandlers } from "./base-handlers.mjs";
export function createHandlers(dependencies) {
  return Object.freeze({
    ...createBaseHandlers(dependencies),
    async "content.upload.create.v1"(input, context) {
      return context.content.createUploadIntent(input.purpose, { mediaType: input.mediaType, bytes: input.bytes, width: input.width, height: input.height });
    },
    async "content.upload.commit.v1"(input, context) { return context.content.commitUpload(input.handle); },
    async "content.upload.delete.v1"(input, context) {
      return { deleted: await context.content.deleteUploaded(input.purpose, input.objectId, { mediaType: input.mediaType, bytes: input.bytes, width: input.width, height: input.height }) };
    },
  });
}
`);
  const contract = await loadBackendContract(manifest.backend.declaration, project);
  await writeGeneratedClient(contract, resolve(project, manifest.backend.generatedClient));
  controller = await runProject({ manifestPath, port: 0, watch: false });
  let rpcId = 20_000;
  const rpc = async (operation, input, idempotency) => {
    rpcId += 1;
    const traceId = `upload-e2e-${rpcId}`;
    const fields = { function: operation, retry: "false", idempotency, ...Object.fromEntries(Object.entries(input).map(([name, value]) => [`input.${name}`, String(value)])) };
    const capability = { version: 1, kind: "rpc.call", requestId: rpcId, traceId, deadlineMs: 3000, payload: { version: 1, operation: "server.call.v1", input: encodeWire(fields), traceId, deadlineMs: 3000 } };
    const response = await fetch(new URL("/__luastra/rpc", controller.url), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(capability) });
    const handled = await response.json();
    assert.equal(handled.response.payload.success, true, JSON.stringify(handled.response.payload));
    return decodeWire(handled.response.payload.data.payload);
  };
  const created = await rpc("content.upload.create.v1", { purpose: "profile-image", ...metadata }, "create-upload-e2e");
  assert.match(created["result.handle"], /^upload:/);
  const uploadResponse = await fetch(new URL(`/__luastra/upload/${created["result.handle"].slice(7)}`, controller.url), { method: "PUT", headers: { "content-type": "image/png", "content-length": String(png.byteLength) }, body: png });
  assert.equal(uploadResponse.status, 200);
  assert.equal(decodeMediaWire(await uploadResponse.text()).status, "uploaded");
  const committed = await rpc("content.upload.commit.v1", { handle: created["result.handle"] }, "commit-upload-e2e");
  const contentResponse = await fetch(new URL(`/__luastra/content/${committed["result.source"].slice(8)}`, controller.url));
  assert.equal(contentResponse.status, 200);
  assert.deepEqual(Buffer.from(await contentResponse.arrayBuffer()), png);
  const deleted = await rpc("content.upload.delete.v1", {
    purpose: "profile-image", objectId: committed["result.objectId"], mediaType: committed["result.mediaType"],
    bytes: committed["result.bytes"], width: committed["result.width"], height: committed["result.height"],
  }, "delete-upload-e2e");
  assert.equal(deleted["result.deleted"], "true");
  assert.equal((await fetch(new URL(`/__luastra/content/${committed["result.source"].slice(8)}`, controller.url))).status, 404);
});
