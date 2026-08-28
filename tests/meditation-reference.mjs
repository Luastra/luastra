import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

import { contentGrantLimits, createContentGrantStore } from "../backend/content.mjs";
import { createMemoryDatabase, createSqliteDatabase } from "../backend/database.mjs";
import { createLocalPasswordIdentity, localIdentityPolicy } from "../backend/identity.mjs";
import { createLocalIdentityService } from "../backend/local-identity-service.mjs";
import { createBackendRuntime, handleServerCapability } from "../backend/runtime.mjs";
import { createSessionStore } from "../backend/session.mjs";
import { decodeWire, encodeWire } from "../backend/wire.mjs";
import { buildProject } from "../project/build-project.mjs";
import { loadProject } from "../project/load-project.mjs";
import { runProject } from "../project/run-project.mjs";

const manifestPath = resolve(import.meta.dirname, "../examples/meditation/luastra.json");
let requestId = 1000;

function request(fields) {
  requestId += 1;
  const traceId = `meditation-trace-${requestId}`;
  return { version: 1, kind: "rpc.call", requestId, traceId, deadlineMs: 3000, payload: { version: 1, operation: "server.call.v1", input: encodeWire(fields), traceId, deadlineMs: 3000 } };
}
async function call(runtime, fields, principal = null) {
  const handled = await handleServerCapability(request(fields), { runtime, principal });
  return handled.response.payload;
}

async function fixture() {
  const project = await loadProject(manifestPath);
  const database = createMemoryDatabase();
  const sessions = createSessionStore();
  const content = createContentGrantStore({ items: project.backend.content });
  const identity = createLocalPasswordIdentity({ database });
  const implementation = await import(`${pathToFileURL(project.backend.handlerPath).href}?test=${Date.now()}-${Math.random()}`);
  const handlers = implementation.createHandlers({ database, identity });
  const identityService = createLocalIdentityService({ identity, sessions });
  return { project, database, sessions, content, identity, runtime: createBackendRuntime({ contract: project.backend.declaration.value, handlers, database, sessions, content, identity: identityService }) };
}

test("local password identity canonicalizes users and verifies scrypt hashes without storing plaintext", () => {
  const database = createMemoryDatabase();
  const identity = createLocalPasswordIdentity({ database });
  assert.equal(identity.seedPasswordUser({
    id: "member-1",
    email: " Member@Example.test ",
    name: "Member",
    roles: ["user"],
    salt: "4b6d1f3abbe6d411cd771467b5aa43a7",
    passwordHash: "7e6a85adc0fb69733c06554499249d9aca4e9f81bd66c91c5e9518daa9c2adb95d928ba9d4dc22dd1e5a8230d1973b51e3391788b096d4e25b6ac559611cbfdd",
  }), true);
  assert.equal(identity.seedPasswordUser({ id: "member-2", email: "member@example.test", name: "Duplicate", roles: ["user"], salt: "4b6d1f3abbe6d411cd771467b5aa43a7", passwordHash: "7e6a85adc0fb69733c06554499249d9aca4e9f81bd66c91c5e9518daa9c2adb95d928ba9d4dc22dd1e5a8230d1973b51e3391788b096d4e25b6ac559611cbfdd" }), false);
  assert.deepEqual(identity.verifyPassword("MEMBER@example.test", "breathe"), { id: "member-1", email: "member@example.test", name: "Member", roles: ["user"] });
  assert.equal(identity.verifyPassword("member@example.test", "wrong"), null);
  assert.equal(identity.verifyPassword("unknown@example.test", "breathe"), null);
  const stored = database.get("identity_users", "member-1");
  assert.equal(stored.email, "member@example.test");
  assert.equal(Object.values(stored).includes("breathe"), false);
  assert.deepEqual(localIdentityPolicy, { algorithm: "scrypt", N: 16384, r: 8, p: 1, passwordMaximumBytes: 1024 });
});

test("SQLite provider preserves bounded records across adapter restart", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "luastra-sqlite-provider-"));
  const path = resolve(root, "backend.sqlite");
  try {
    const first = createSqliteDatabase({ path });
    assert.equal(first.insert("records", { id: "record-1", ownerId: "user-1", value: "persisted" }), true);
    first.close();
    const second = createSqliteDatabase({ path });
    assert.deepEqual(second.get("records", "record-1"), { id: "record-1", ownerId: "user-1", value: "persisted" });
    assert.equal(second.update("records", "record-1", { id: "record-1", ownerId: "user-1", value: "updated" }), true);
    second.close();
    const third = createSqliteDatabase({ path });
    assert.equal(third.get("records", "record-1").value, "updated");
    third.close();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("protected content grants are opaque, bounded and expire closed", async () => {
  const project = await loadProject(manifestPath);
  let current = 1000;
  const grants = createContentGrantStore({ items: project.backend.content, now: () => current, randomToken: () => "content_token_000000000000000000000000000000000001" });
  const issued = grants.issue("audio/rest", { ttlMs: 1000 });
  assert.match(issued.source, /^content:[A-Za-z0-9_-]{32,256}$/);
  assert.equal(issued.source.includes("rest"), false);
  assert.equal(grants.resolve(issued.source.slice(8)).id, "audio/rest");
  current = 2000;
  assert.equal(grants.resolve(issued.source.slice(8)), null);
  assert.equal(grants.size, 0);
  assert.equal(contentGrantLimits.defaultTtlMs, 60_000);
  assert.equal(contentGrantLimits.maximumTtlMs, 60_000);
  assert.throws(() => grants.issue("audio/rest", { ttlMs: 60_001 }), /invalid content grant TTL/);
  current = 3000;
  const disposable = grants.issue("audio/rest");
  grants.dispose();
  assert.equal(grants.resolve(disposable.source.slice(8)), null);
});

test("protected content mutation invalidates existing and future grants", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "luastra-content-integrity-"));
  const path = resolve(root, "sample.bin");
  const original = Buffer.from("admitted-content");
  try {
    await writeFile(path, original);
    const grants = createContentGrantStore({ items: [{ id: "audio/sample", path, mediaType: "audio/wav", bytes: original.byteLength, sha256: createHash("sha256").update(original).digest("hex") }], randomToken: () => "content_token_000000000000000000000000000000000002" });
    const issued = grants.issue("audio/sample");
    await writeFile(path, Buffer.from("mutated-content-is-longer"));
    assert.equal(grants.resolve(issued.source.slice(8)), null);
    assert.throws(() => grants.issue("audio/sample"), /integrity mismatch/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("SQLite manifest path rejects a symlinked parent outside the project", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "luastra-sqlite-containment-"));
  const copied = resolve(root, "meditation");
  const outside = resolve(root, "outside");
  try {
    await cp(resolve(manifestPath, ".."), copied, { recursive: true, filter: (source) => !source.split(/[\\/]/).some((part) => part === ".luastra" || part === "dist") });
    await mkdir(outside);
    await symlink(outside, resolve(copied, ".luastra"), "dir");
    await assert.rejects(loadProject(resolve(copied, "luastra.json")), /backend database parent resolves outside the project/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("local password identity manifest requires SQLite and rejects unknown providers", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "luastra-identity-manifest-"));
  const copied = resolve(root, "meditation");
  try {
    await cp(resolve(manifestPath, ".."), copied, { recursive: true, filter: (source) => !source.split(/[\\/]/).some((part) => part === ".luastra" || part === "dist") });
    const path = resolve(copied, "luastra.json");
    const manifest = JSON.parse(await readFile(path, "utf8"));
    delete manifest.backend.database;
    await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`);
    await assert.rejects(loadProject(path), /local-password identity requires a persistent sqlite database/);
    manifest.backend.database = { provider: "sqlite", path: ".luastra/data/backend.sqlite" };
    manifest.backend.identity = { provider: "unknown" };
    await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`);
    await assert.rejects(loadProject(path), /backend.identity.provider must be local-password or supabase/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("meditation reference proves guest catalogue, entitlement denial, session restoration, library and resume", async () => {
  const { runtime, sessions } = await fixture();
  const guestCatalogue = await call(runtime, { function: "catalog.list.v1", retry: "false" });
  assert.equal(guestCatalogue.success, true);
  const guestFields = decodeWire(guestCatalogue.data.payload);
  assert.equal(guestFields["result.meditations.length"], "2");
  assert.equal(guestFields["result.meditations.1.accessible"], "true");
  assert.equal(guestFields["result.meditations.2.accessible"], "false");

  const freeAccess = await call(runtime, { function: "content.access.v1", retry: "false", "input.meditationId": "breathing-space" });
  assert.equal(freeAccess.success, true);
  const deniedGuest = await call(runtime, { function: "content.access.v1", retry: "false", "input.meditationId": "evening-rest" });
  assert.equal(deniedGuest.error.code, "FORBIDDEN");

  const rejectedLogin = await call(runtime, { function: "auth.login.v1", retry: "false", idempotency: "meditation-login-bad", "input.email": "demo@luastra.dev", "input.password": "wrong" });
  assert.equal(rejectedLogin.error.code, "UNAUTHORIZED");
  const login = await call(runtime, { function: "auth.login.v1", retry: "false", idempotency: "meditation-login-good", "input.email": "demo@luastra.dev", "input.password": "breathe" });
  assert.equal(login.success, true);
  const loginFields = decodeWire(login.data.payload);
  const principal = sessions.resolve(loginFields["result.token"]);
  assert.equal(principal.id, "demo-user");
  assert.equal((await call(runtime, { function: "auth.session.v1", retry: "false" }, principal)).success, true);

  const memberCatalogue = decodeWire((await call(runtime, { function: "catalog.list.v1", retry: "false" }, principal)).data.payload);
  assert.equal(memberCatalogue["result.meditations.2.accessible"], "true");
  const favourite = await call(runtime, { function: "library.favorite.v1", retry: "false", idempotency: "meditation-favourite-1", "input.meditationId": "evening-rest", "input.favorite": "true" }, principal);
  assert.equal(favourite.success, true);
  const updatedCatalogue = decodeWire((await call(runtime, { function: "catalog.list.v1", retry: "false" }, principal)).data.payload);
  assert.equal(updatedCatalogue["result.meditations.2.favorite"], "true");

  const progress = await call(runtime, { function: "progress.save.v1", retry: "false", idempotency: "meditation-progress-1", "input.meditationId": "evening-rest", "input.positionMs": "2500" }, principal);
  assert.equal(progress.success, true);
  const resumed = decodeWire((await call(runtime, { function: "content.access.v1", retry: "false", "input.meditationId": "evening-rest" }, principal)).data.payload);
  assert.equal(resumed["result.resumePositionMs"], "2500");
  assert.equal(resumed["result.downloadAllowed"], "false");

  const outsider = sessions.issue({ id: "other-user", roles: ["user"] });
  const deniedOutsider = await call(runtime, { function: "content.access.v1", retry: "false", "input.meditationId": "evening-rest" }, sessions.resolve(outsider.token));
  assert.equal(deniedOutsider.error.code, "FORBIDDEN");
  const logout = await call(runtime, { function: "auth.logout.v1", retry: "false", idempotency: "meditation-logout-1" }, principal);
  assert.equal(decodeWire(logout.data.payload)["result.revoked"], "true");
  assert.equal(sessions.resolve(loginFields["result.token"]), null);
});

test("meditation web output excludes backend credentials and implementations", async () => {
  const output = await mkdtemp(resolve(tmpdir(), "luastra-meditation-web-"));
  try {
    await buildProject({ manifestPath, outputDirectory: output, target: "web" });
    const manifest = JSON.parse(await readFile(resolve(output, "asset-manifest.json"), "utf8"));
    assert.equal(manifest.assets.some((asset) => asset.path.includes("backend/")), false);
    assert.equal(manifest.assets.some((asset) => /\.(?:wav|mp3|m4a|ogg)$/.test(asset.path)), false, "protected audio leaked into the public web package");
    for (const asset of manifest.assets) {
      const source = await readFile(resolve(output, asset.path));
      assert.equal(source.includes(Buffer.from("breathe")), false, `server-only demo password leaked through ${asset.path}`);
      assert.equal(source.includes(Buffer.from("demo@luastra.dev")), false, `server-only demo identity leaked through ${asset.path}`);
    }
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

test("meditation local server resolves and revokes bearer sessions at the HTTP boundary", async () => {
  const events = [];
  const controller = await runProject({ manifestPath, port: 0, watch: false, onEvent: (event) => events.push(event) });
  const overHttp = async (fields, token = "") => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(new URL("/__luastra/rpc", controller.url), { method: "POST", headers, body: JSON.stringify(request(fields)) });
    assert.equal(response.status, 200);
    return (await response.json()).response.payload;
  };
  try {
    assert.equal(events[0].backend, "local-session");
    const denied = await overHttp({ function: "content.access.v1", retry: "false", "input.meditationId": "evening-rest" });
    assert.equal(denied.error.code, "FORBIDDEN");
    const login = await overHttp({ function: "auth.login.v1", retry: "false", idempotency: "http-session-login-1", "input.email": "demo@luastra.dev", "input.password": "breathe" });
    const token = decodeWire(login.data.payload)["result.token"];
    const admitted = await overHttp({ function: "content.access.v1", retry: "false", "input.meditationId": "evening-rest" }, token);
    assert.equal(admitted.success, true);
    const source = decodeWire(admitted.data.payload)["result.source"];
    assert.match(source, /^content:[A-Za-z0-9_-]{32,256}$/);
    const contentUrl = new URL(`/__luastra/content/${source.slice(8)}`, controller.url);
    const ranged = await fetch(contentUrl, { headers: { Range: "bytes=0-43" } });
    assert.equal(ranged.status, 206);
    assert.equal(ranged.headers.get("content-type"), "audio/wav");
    assert.equal(ranged.headers.get("cache-control"), "private, no-store");
    assert.equal((await ranged.arrayBuffer()).byteLength, 44);
    assert.equal((await fetch(new URL("/__luastra/content/not-a-valid-token", controller.url))).status, 404);
    const logout = await overHttp({ function: "auth.logout.v1", retry: "false", idempotency: "http-session-logout-1" }, token);
    assert.equal(decodeWire(logout.data.payload)["result.revoked"], "true");
    const expired = await overHttp({ function: "auth.session.v1", retry: "false" }, token);
    assert.equal(expired.error.code, "UNAUTHORIZED");
  } finally {
    await controller.close();
  }
});

test("meditation SQLite data survives local server restart while sessions fail closed", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "luastra-meditation-restart-"));
  const copied = resolve(root, "meditation");
  await cp(resolve(manifestPath, ".."), copied, { recursive: true, filter: (source) => !source.split(/[\\/]/).some((part) => part === ".luastra" || part === "dist") });
  const copiedManifest = resolve(copied, "luastra.json");
  const invoke = async (base, fields, token = "") => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(new URL("/__luastra/rpc", base), { method: "POST", headers, body: JSON.stringify(request(fields)) });
    return (await response.json()).response.payload;
  };
  let first = null;
  let second = null;
  try {
    first = await runProject({ manifestPath: copiedManifest, port: 0, watch: false });
    const login = await invoke(first.url, { function: "auth.login.v1", retry: "false", idempotency: "restart-login-first", "input.email": "demo@luastra.dev", "input.password": "breathe" });
    const firstToken = decodeWire(login.data.payload)["result.token"];
    await invoke(first.url, { function: "library.favorite.v1", retry: "false", idempotency: "restart-favorite-save", "input.meditationId": "evening-rest", "input.favorite": "true" }, firstToken);
    await invoke(first.url, { function: "progress.save.v1", retry: "false", idempotency: "restart-progress-save", "input.meditationId": "evening-rest", "input.positionMs": "2345" }, firstToken);
    await first.close();
    first = null;

    second = await runProject({ manifestPath: copiedManifest, port: 0, watch: false });
    const stale = await invoke(second.url, { function: "auth.session.v1", retry: "false" }, firstToken);
    assert.equal(stale.error.code, "UNAUTHORIZED");
    const relogin = await invoke(second.url, { function: "auth.login.v1", retry: "false", idempotency: "restart-login-second", "input.email": "demo@luastra.dev", "input.password": "breathe" });
    const secondToken = decodeWire(relogin.data.payload)["result.token"];
    const catalogue = decodeWire((await invoke(second.url, { function: "catalog.list.v1", retry: "false" }, secondToken)).data.payload);
    assert.equal(catalogue["result.meditations.2.favorite"], "true");
    const access = decodeWire((await invoke(second.url, { function: "content.access.v1", retry: "false", "input.meditationId": "evening-rest" }, secondToken)).data.payload);
    assert.equal(access["result.resumePositionMs"], "2345");
  } finally {
    await first?.close();
    await second?.close();
    await rm(root, { recursive: true, force: true });
  }
});
