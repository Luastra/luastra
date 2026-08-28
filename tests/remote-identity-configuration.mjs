import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import { createSupabaseIdentityBoundary, readSupabaseIdentityEnvironment, supabaseIdentityEnvironment } from "../backend/provider-environment.mjs";
import { decodeWire, encodeWire } from "../backend/wire.mjs";
import { buildProject } from "../project/build-project.mjs";
import { loadProject } from "../project/load-project.mjs";
import { runProject } from "../project/run-project.mjs";

const prototype = resolve(import.meta.dirname, "..");
const meditation = resolve(prototype, "examples/meditation");
const encryptionKey = Buffer.alloc(32, 7).toString("base64url");
const validEnvironment = Object.freeze({
  [supabaseIdentityEnvironment.url]: "https://provider.example.test",
  [supabaseIdentityEnvironment.publishableKey]: "sb_publishable_0123456789abcdefghijklmnopqrstuvwxyz",
  [supabaseIdentityEnvironment.sessionEncryptionKey]: encryptionKey,
});
const userId = "8e1e21c0-79e4-4af1-88ca-b5276f0f2df8";
let requestId = 8000;
function jwt(now, seconds) {
  const encoded = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encoded({ alg: "none", typ: "JWT" })}.${encoded({ sub: userId, aud: "authenticated", iss: "https://provider.example.test/auth/v1", exp: Math.floor((now + seconds * 1000) / 1000) })}.signature`;
}
function request(fields) {
  requestId += 1;
  const traceId = `remote-identity-${requestId}`;
  return { version: 1, kind: "rpc.call", requestId, traceId, deadlineMs: 3000, payload: { version: 1, operation: "server.call.v1", input: encodeWire(fields), traceId, deadlineMs: 3000 } };
}
async function files(root) {
  const result = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = resolve(root, entry.name);
    if (entry.isDirectory()) result.push(...await files(path));
    else if (entry.isFile()) result.push(path);
  }
  return result;
}

test("remote identity environment requires three exact backend-only values without disclosing them", () => {
  for (const name of Object.values(supabaseIdentityEnvironment)) {
    const environment = { ...validEnvironment };
    delete environment[name];
    assert.throws(() => readSupabaseIdentityEnvironment(environment), (error) => error.message.includes(name) && !error.message.includes(validEnvironment[name] ?? "never"));
  }
  assert.throws(() => readSupabaseIdentityEnvironment({ ...validEnvironment, [supabaseIdentityEnvironment.sessionEncryptionKey]: Buffer.alloc(31).toString("base64url") }), /SESSION_ENCRYPTION_KEY_B64URL/);
  const admitted = readSupabaseIdentityEnvironment(validEnvironment);
  assert.equal(admitted.url, validEnvironment.LUASTRA_SUPABASE_URL);
  assert.equal(admitted.publishableKey, validEnvironment.LUASTRA_SUPABASE_PUBLISHABLE_KEY);
  assert.equal(admitted.encryptionKey.byteLength, 32);
  admitted.encryptionKey.fill(0);
});

test("remote identity boundary rejects secret keys and unsafe endpoints before persistent state", async (t) => {
  const root = await mkdtemp(resolve(tmpdir(), "luastra-remote-identity-config-"));
  t.after(async () => rm(root, { recursive: true, force: true }));
  assert.throws(() => createSupabaseIdentityBoundary({ projectRoot: root, environment: { ...validEnvironment, LUASTRA_SUPABASE_PUBLISHABLE_KEY: "sb_secret_0123456789abcdefghijklmnopqrstuvwxyz" } }), /publishable key/);
  assert.throws(() => createSupabaseIdentityBoundary({ projectRoot: root, environment: { ...validEnvironment, LUASTRA_SUPABASE_URL: "http://provider.example.test" } }), /HTTPS or loopback HTTP/);
  assert.deepEqual(await readdir(root), [], "invalid environment created provider persistence");
});

test("remote identity boundary persists only managed session state and retains no environment values on disk", async (t) => {
  const root = await mkdtemp(resolve(tmpdir(), "luastra-remote-identity-boundary-"));
  t.after(async () => rm(root, { recursive: true, force: true }));
  const boundary = createSupabaseIdentityBoundary({ projectRoot: root, environment: validEnvironment, fetchImpl: async () => { throw new Error("unexpected provider request"); } });
  boundary.close();
  const dataRoot = resolve(root, ".luastra/data");
  for (const file of await readdir(dataRoot)) {
    const bytes = await readFile(resolve(dataRoot, file));
    for (const value of Object.values(validEnvironment)) assert.equal(bytes.includes(Buffer.from(value)), false, `${file} persisted backend environment material`);
  }
});

test("remote identity managed session path rejects a symlinked parent outside the project", async (t) => {
  const root = await mkdtemp(resolve(tmpdir(), "luastra-remote-identity-containment-"));
  const project = resolve(root, "project");
  const outside = resolve(root, "outside");
  t.after(async () => rm(root, { recursive: true, force: true }));
  await mkdir(project);
  await mkdir(outside);
  await symlink(outside, resolve(project, ".luastra"), "dir");
  assert.throws(() => createSupabaseIdentityBoundary({ projectRoot: project, environment: validEnvironment }), /provider session parent resolves outside the project/);
  assert.deepEqual(await readdir(outside), []);
});

test("manifest can select Supabase without embedding configuration and requires session authentication", async (t) => {
  const root = await mkdtemp(resolve(tmpdir(), "luastra-remote-identity-manifest-"));
  const copied = resolve(root, "meditation");
  t.after(async () => rm(root, { recursive: true, force: true }));
  await cp(meditation, copied, { recursive: true, filter: (source) => !source.split(/[\\/]/).some((part) => part === ".luastra" || part === "dist") });
  const path = resolve(copied, "luastra.json");
  const manifest = JSON.parse(await readFile(path, "utf8"));
  manifest.backend.identity = { provider: "supabase" };
  manifest.backend.authentication = "development";
  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`);
  await assert.rejects(loadProject(path), /supabase identity requires session authentication/);
  manifest.backend.authentication = "session";
  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`);
  const project = await loadProject(path);
  assert.equal(project.backend.identity.provider, "supabase");
  const serialized = JSON.stringify(manifest);
  for (const name of Object.values(supabaseIdentityEnvironment)) assert.equal(serialized.includes(name), false);
  for (const value of Object.values(validEnvironment)) assert.equal(serialized.includes(value), false);
});

test("remote manifest drives opaque HTTP login and logout without provider material in public artifacts", async (t) => {
  const root = await mkdtemp(resolve(tmpdir(), "luastra-remote-identity-run-"));
  const copied = resolve(root, "meditation");
  const output = resolve(root, "web");
  let controller = null;
  t.after(async () => { await controller?.close(); await rm(root, { recursive: true, force: true }); });
  await cp(meditation, copied, { recursive: true, filter: (source) => !source.split(/[\\/]/).some((part) => part === ".luastra" || part === "dist") });
  const path = resolve(copied, "luastra.json");
  const manifest = JSON.parse(await readFile(path, "utf8"));
  manifest.backend.identity = { provider: "supabase" };
  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`);
  const current = 1_800_000_000_000;
  const providerToken = jwt(current, 120);
  const calls = [];
  const providerFetch = async (url, options) => {
    calls.push(`${options.method} ${url.pathname}${url.search}`);
    if (url.searchParams.get("grant_type") === "password") {
      if (JSON.parse(options.body).password === "wrong password") return new Response(JSON.stringify({ message: "private upstream diagnostic" }), { status: 400, headers: { "content-type": "application/json" } });
      return new Response(JSON.stringify({ access_token: providerToken, refresh_token: "remote-refresh-token-00000000", token_type: "bearer", expires_in: 120, user: { id: userId, email: "person@example.test", app_metadata: { roles: ["user"] } } }), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (url.pathname.endsWith("/logout")) return new Response(null, { status: 204 });
    throw new Error("unexpected provider request");
  };
  controller = await runProject({ manifestPath: path, port: 0, watch: false, environment: validEnvironment, providerFetch, now: () => current });
  const invoke = async (fields, token = "") => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(new URL("/__luastra/rpc", controller.url), { method: "POST", headers, body: JSON.stringify(request(fields)) });
    assert.equal(response.status, 200);
    return (await response.json()).response.payload;
  };
  const denied = await invoke({ function: "auth.login.v1", retry: "false", idempotency: "remote-login-denied-0001", "input.email": "person@example.test", "input.password": "wrong password" });
  assert.equal(denied.error.code, "UNAUTHORIZED");
  assert.equal(JSON.stringify(denied).includes("private upstream diagnostic"), false);
  const login = await invoke({ function: "auth.login.v1", retry: "false", idempotency: "remote-login-0001", "input.email": "person@example.test", "input.password": "correct horse battery staple" });
  assert.equal(login.success, true);
  const result = decodeWire(login.data.payload);
  const opaque = result["result.token"];
  assert.match(opaque, /^[A-Za-z0-9_-]{32,256}$/);
  assert.notEqual(opaque, providerToken);
  assert.equal(result["result.userName"], "person@example.test");
  await controller.close();
  controller = await runProject({ manifestPath: path, port: 0, watch: false, environment: validEnvironment, providerFetch, now: () => current });
  const restored = decodeWire((await invoke({ function: "auth.session.v1", retry: "false" }, opaque)).data.payload);
  assert.equal(restored["result.userName"], "person@example.test");
  const logout = await invoke({ function: "auth.logout.v1", retry: "false", idempotency: "remote-logout-0001" }, opaque);
  assert.equal(decodeWire(logout.data.payload)["result.revoked"], "true");
  const stale = await invoke({ function: "auth.session.v1", retry: "false" }, opaque);
  assert.equal(stale.error.code, "UNAUTHORIZED");
  assert.deepEqual(calls, ["POST /auth/v1/token?grant_type=password", "POST /auth/v1/token?grant_type=password", "POST /auth/v1/logout?scope=local"]);

  await buildProject({ manifestPath: path, outputDirectory: output, target: "web" });
  for (const file of await files(output)) {
    const bytes = await readFile(file);
    assert.equal(bytes.includes(Buffer.from(providerToken)), false, `${file} contains provider JWT`);
    for (const value of Object.values(validEnvironment)) assert.equal(bytes.includes(Buffer.from(value)), false, `${file} contains provider environment material`);
  }
});
