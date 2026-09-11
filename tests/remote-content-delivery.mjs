import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import { supabaseIdentityEnvironment } from "../backend/provider-environment.mjs";
import { decodeWire, encodeWire } from "../backend/wire.mjs";
import { loadProject } from "../project/load-project.mjs";
import { runProject } from "../project/run-project.mjs";

const rootPath = resolve(import.meta.dirname, "..");
const sourceProject = resolve(rootPath, "examples/meditation");
const userId = "8e1e21c0-79e4-4af1-88ca-b5276f0f2df8";
const environment = Object.freeze({
  [supabaseIdentityEnvironment.url]: "https://provider.example.test",
  [supabaseIdentityEnvironment.publishableKey]: "sb_publishable_0123456789abcdefghijklmnopqrstuvwxyz",
  [supabaseIdentityEnvironment.sessionEncryptionKey]: Buffer.alloc(32, 9).toString("base64url"),
});
let requestId = 12_000;

function jwt(now) {
  const encoded = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encoded({ alg: "none", typ: "JWT" })}.${encoded({ sub: userId, aud: "authenticated", iss: "https://provider.example.test/auth/v1", exp: Math.floor(now / 1000) + 3600 })}.signature`;
}
function request(fields) {
  requestId += 1;
  const traceId = `remote-content-${requestId}`;
  return { version: 1, kind: "rpc.call", requestId, traceId, deadlineMs: 3000, payload: { version: 1, operation: "server.call.v1", input: encodeWire(fields), traceId, deadlineMs: 3000 } };
}

test("Supabase object reads stay behind expiring same-origin image handles and fail closed offline", async (t) => {
  const temporary = await mkdtemp(resolve(tmpdir(), "luastra-remote-content-"));
  const copied = resolve(temporary, "project");
  let controller = null;
  t.after(async () => { await controller?.close(); await rm(temporary, { recursive: true, force: true }); });
  await cp(sourceProject, copied, { recursive: true, filter: (source) => !source.split(/[\\/]/).some((part) => part === ".luastra" || part === "dist") });
  const manifestPath = resolve(copied, "luastra.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.backend.identity = { provider: "supabase" };
  manifest.backend.content = [{ id: "image/cover", provider: "supabase", bucket: "private-media", path: "covers/focus.png", mediaType: "image/png", bytes: 8, width: 1, height: 1 }];
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const handlerPath = resolve(copied, manifest.backend.handler);
  const handler = (await readFile(handlerPath, "utf8")).replaceAll("audio/focus", "image/cover").replaceAll("audio/rest", "image/cover");
  await writeFile(handlerPath, handler);

  let current = 1_800_000_000_000;
  let offline = false;
  const providerToken = jwt(current);
  const signedUrl = "https://provider.example.test/storage/v1/object/sign/private-media/covers/focus.png?token=provider-secret";
  const providerFetch = async (urlValue, options = {}) => {
    const url = new URL(urlValue);
    if (offline && options.method === "GET") throw new Error("network unavailable");
    if (url.pathname === "/auth/v1/token") return new Response(JSON.stringify({ access_token: providerToken, refresh_token: "remote-refresh-token-00000000", token_type: "bearer", expires_in: 3600, user: { id: userId, email: "person@example.test", app_metadata: { roles: ["user"] } } }), { status: 200, headers: { "content-type": "application/json" } });
    if (options.method === "POST" && url.pathname === "/storage/v1/object/sign/private-media/covers/focus.png") {
      assert.equal(options.headers.Authorization, `Bearer ${providerToken}`);
      return new Response(JSON.stringify({ signedURL: "/object/sign/private-media/covers/focus.png?token=provider-secret" }), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (options.method === "GET" && url.href === signedUrl) {
      const bytes = Buffer.from("89504e470d0a1a0a", "hex");
      if (options.headers?.Range === "bytes=0-3") return new Response(bytes.subarray(0, 4), { status: 206, headers: { "content-type": "image/png", "content-length": "4", "content-range": "bytes 0-3/8" } });
      return new Response(bytes, { status: 200, headers: { "content-type": "image/png", "content-length": "8" } });
    }
    throw new Error(`unexpected provider request: ${options.method} ${url.href}`);
  };
  controller = await runProject({ manifestPath, port: 0, watch: false, environment, providerFetch, now: () => current });
  const rpc = async (fields, token = "") => {
    const headers = { "content-type": "application/json" };
    if (token) headers.authorization = `Bearer ${token}`;
    const response = await fetch(new URL("/__luastra/rpc", controller.url), { method: "POST", headers, body: JSON.stringify(request(fields)) });
    return (await response.json()).response.payload;
  };
  const login = decodeWire((await rpc({ function: "auth.login.v1", retry: "false", idempotency: "remote-content-login", "input.email": "person@example.test", "input.password": "correct horse battery staple" })).data.payload);
  const access = decodeWire((await rpc({ function: "content.access.v1", retry: "false", "input.meditationId": "breathing-space" }, login["result.token"])).data.payload);
  assert.match(access["result.source"], /^content:[A-Za-z0-9_-]{32,256}$/);
  assert.equal(access["result.source"].includes("provider-secret"), false);
  const localUrl = new URL(`/__luastra/content/${access["result.source"].slice(8)}`, controller.url);
  const delivered = await fetch(localUrl);
  assert.equal(delivered.status, 200);
  assert.equal(delivered.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(Buffer.from(await delivered.arrayBuffer()), Buffer.from("89504e470d0a1a0a", "hex"));
  const ranged = await fetch(localUrl, { headers: { Range: "bytes=0-3" } });
  assert.equal(ranged.status, 206);
  assert.equal(ranged.headers.get("content-range"), "bytes 0-3/8");
  assert.deepEqual(Buffer.from(await ranged.arrayBuffer()), Buffer.from("89504e47", "hex"));
  offline = true;
  assert.equal((await fetch(localUrl)).status, 502);
  offline = false;
  current += 60_000;
  assert.equal((await fetch(localUrl)).status, 404);
});

test("remote object declarations require Supabase identity and bounded image metadata", async (t) => {
  const temporary = await mkdtemp(resolve(tmpdir(), "luastra-remote-content-admission-"));
  const copied = resolve(temporary, "project");
  t.after(async () => rm(temporary, { recursive: true, force: true }));
  await cp(sourceProject, copied, { recursive: true, filter: (source) => !source.split(/[\\/]/).some((part) => part === ".luastra" || part === "dist") });
  const path = resolve(copied, "luastra.json");
  const manifest = JSON.parse(await readFile(path, "utf8"));
  manifest.backend.content = [{ id: "image/cover", provider: "supabase", bucket: "private-media", path: "covers/focus.png", mediaType: "image/png", bytes: 8, width: 1, height: 1 }];
  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`);
  await assert.rejects(loadProject(path), /Supabase content requires Supabase identity/);
  manifest.backend.identity = { provider: "supabase" };
  manifest.backend.content[0].width = 8192;
  manifest.backend.content[0].height = 8192;
  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`);
  await assert.rejects(loadProject(path), /invalid image metadata/);
});
