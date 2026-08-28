import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import test from "node:test";

import { createRpcCapabilities } from "../platform/host/rpc-capabilities.mjs";
import { buildProject } from "../project/build-project.mjs";
import { loadProject } from "../project/load-project.mjs";
import { runProject } from "../project/run-project.mjs";
import { createMemoryDatabase } from "../backend/database.mjs";
import { createBackendRuntime, handleServerCapability } from "../backend/runtime.mjs";
import { createSessionStore } from "../backend/session.mjs";
import { decodeWire, encodeWire } from "../backend/wire.mjs";

const prototype = resolve(import.meta.dirname, "..");
const projectRoot = resolve(prototype, "examples/forms-crud");
const manifestPath = resolve(projectRoot, "luastra.json");
let nextRequestId = 0;

function request(fields, deadlineMs = 1000) {
  const requestId = ++nextRequestId;
  const traceId = `backend-trace-${requestId}`;
  return {
    version: 1,
    kind: "rpc.call",
    requestId,
    traceId,
    deadlineMs,
    payload: { version: 1, operation: "server.call.v1", input: encodeWire(fields), traceId, deadlineMs },
  };
}
function rpc(handled) { return handled.response.payload; }

test("session store issues opaque bounded credentials, restores principals and revokes or expires sessions", () => {
  let current = 1000;
  let sequence = 0;
  const sessions = createSessionStore({ now: () => current, randomToken: () => `token_${String(++sequence).padStart(40, "0")}` });
  const issued = sessions.issue({ id: "person@example.test", roles: ["user", "user"] }, { ttlMs: 2000 });
  assert.equal(issued.token.includes("person"), false, "opaque token disclosed principal data");
  assert.equal(sessions.resolve(issued.token).id, "person@example.test");
  assert.deepEqual(sessions.resolveAuthorization(`Bearer ${issued.token}`).roles, ["user"]);
  assert.equal(sessions.resolveAuthorization(`bearer ${issued.token}`), null);
  assert.equal(sessions.size, 1);
  const sessionId = sessions.resolve(issued.token).session;
  assert.equal(sessions.revoke(sessionId), true);
  assert.equal(sessions.resolve(issued.token), null);
  const expiring = sessions.issue({ id: "person@example.test", roles: ["user"] }, { ttlMs: 1000 });
  current = 2000;
  assert.equal(sessions.resolve(expiring.token), null);
  assert.equal(sessions.size, 0);
});

test("backend handlers can issue and revoke the current generic session without receiving the token", async () => {
  const sessions = createSessionStore({ randomToken: () => "token_0000000000000000000000000000000000000001" });
  const contract = {
    types: {},
    functions: {
      "session.login.v1": { clientName: "login", authorization: "public", mutation: true, idempotency: "required", input: { email: "string" }, result: { token: "string", expiresAt: "number" } },
      "session.logout.v1": { clientName: "logout", authorization: "user", mutation: true, idempotency: "required", input: {}, result: { revoked: "boolean" } },
    },
  };
  const runtime = createBackendRuntime({ contract, sessions, handlers: {
    async "session.login.v1"(input, context) { return context.sessions.issue({ id: input.email, roles: ["user"] }); },
    async "session.logout.v1"(_input, context) { return { revoked: context.sessions.revokeCurrent() }; },
  } });
  const login = rpc(await handleServerCapability(request({ function: "session.login.v1", retry: "false", idempotency: "session-login-0001", "input.email": "person@example.test" }), { runtime }));
  assert.equal(login.success, true);
  const loginFields = decodeWire(login.data.payload);
  const principal = sessions.resolve(loginFields["result.token"]);
  assert.equal(principal.id, "person@example.test");
  const logout = rpc(await handleServerCapability(request({ function: "session.logout.v1", retry: "false", idempotency: "session-logout-0001" }), { runtime, principal }));
  assert.equal(logout.success, true);
  assert.equal(decodeWire(logout.data.payload)["result.revoked"], "true");
  assert.equal(sessions.resolve(loginFields["result.token"]), null);
});

async function fixtureRuntime() {
  const project = await loadProject(manifestPath);
  const database = createMemoryDatabase();
  const implementation = await import(`${pathToFileURL(project.backend.handlerPath).href}?test=${Date.now()}-${Math.random()}`);
  const handlers = implementation.createHandlers({ database });
  return { project, database, handlers, runtime: createBackendRuntime({ contract: project.backend.declaration.value, handlers, database }) };
}

test("backend runtime enforces auth, authorization, typed results and idempotent mutations", async () => {
  const { runtime, database } = await fixtureRuntime();
  const user = { id: "local-user", roles: ["user"] };
  const listRequest = request({ function: "records.list.v1", retry: "true" });
  const listed = rpc(await handleServerCapability(listRequest, { runtime, principal: user }));
  assert.equal(listed.success, true);
  assert.equal(decodeWire(listed.data.payload)["result.records.length"], "2");

  const unauthenticated = rpc(await handleServerCapability(request({ function: "records.list.v1", retry: "false" }), { runtime }));
  assert.equal(unauthenticated.error.code, "UNAUTHORIZED");
  const forbidden = rpc(await handleServerCapability(request({ function: "records.admin.v1", retry: "false" }), { runtime, principal: user }));
  assert.equal(forbidden.error.code, "FORBIDDEN");

  const mutationFields = { function: "records.create.v1", retry: "true", idempotency: "create-key-0001", "input.title": "Server record", "input.details": "Created once" };
  const first = rpc(await handleServerCapability(request(mutationFields), { runtime, principal: user }));
  const replay = rpc(await handleServerCapability(request(mutationFields), { runtime, principal: user }));
  assert.equal(first.success, true);
  assert.equal(replay.success, true);
  assert.equal(decodeWire(first.data.payload)["result.record.id"], decodeWire(replay.data.payload)["result.record.id"]);
  assert.equal(database.list("records").length, 3, "idempotent replay executed the mutation twice");
  assert.equal(runtime.idempotencyEntries, 1);

  const conflicting = rpc(await handleServerCapability(request({ ...mutationFields, "input.title": "Different" }), { runtime, principal: user }));
  assert.equal(conflicting.error.code, "VALIDATION");
  const missingKey = rpc(await handleServerCapability(request({ function: "records.create.v1", retry: "false", "input.title": "Missing", "input.details": "Key" }), { runtime, principal: user }));
  assert.equal(missingKey.error.code, "VALIDATION");

  const otherUser = { id: "other-user", roles: ["user"] };
  const deniedUpdate = rpc(await handleServerCapability(request({ function: "records.update.v1", retry: "false", idempotency: "update-key-0001", "input.id": "record-1", "input.title": "Attack", "input.details": "Denied" }), { runtime, principal: otherUser }));
  assert.equal(deniedUpdate.error.code, "FORBIDDEN");

  const failed = rpc(await handleServerCapability(request({ function: "records.fail.v1", retry: "false" }), { runtime, principal: user }));
  assert.equal(failed.error.code, "INTERNAL");
  assert.equal(JSON.stringify(failed).includes("database connection"), false, "private server error leaked to the client");
  const unknown = rpc(await handleServerCapability(request({ function: "records.unknown.v1", retry: "false" }), { runtime, principal: user }));
  assert.equal(unknown.error.code, "VALIDATION");

  const aborted = new AbortController();
  aborted.abort();
  const cancelled = rpc(await handleServerCapability(request({ function: "records.list.v1", retry: "false" }), { runtime, principal: user, signal: aborted.signal }));
  assert.equal(cancelled.error.code, "CANCELLED");

  const invalidFixture = await fixtureRuntime();
  const invalidRuntime = createBackendRuntime({
    contract: invalidFixture.project.backend.declaration.value,
    database: invalidFixture.database,
    handlers: { ...invalidFixture.handlers, "records.list.v1": async () => ({ records: [{ id: 7, title: "wrong", details: "shape" }] }) },
  });
  const invalidResult = rpc(await handleServerCapability(request({ function: "records.list.v1", retry: "false" }), { runtime: invalidRuntime, principal: user }));
  assert.equal(invalidResult.error.code, "INTERNAL");
});

test("browser RPC adapter exposes offline, bounded retry, cancellation and deadline outcomes", async () => {
  const { runtime } = await fixtureRuntime();
  const user = { id: "local-user", roles: ["user"] };
  let calls = 0;
  const transport = createRpcCapabilities({
    async fetchImpl(_url, options) {
      calls += 1;
      if (calls === 1) throw new Error("transient network loss");
      const handled = await handleServerCapability(JSON.parse(options.body), { runtime, principal: user, signal: options.signal });
      return { ok: true, status: 200, async json() { return handled; } };
    },
    online: () => true,
  });
  const retried = await transport.handle(request({ function: "records.list.v1", retry: "true" }));
  assert.equal(retried.response.payload.success, true);
  assert.equal(calls, 2, "retry policy did not perform exactly one bounded retry");
  assert.equal(transport.activeRequests, 0);

  let offlineFetches = 0;
  const offline = createRpcCapabilities({ fetchImpl: async () => { offlineFetches += 1; }, online: () => false });
  const offlineResult = await offline.handle(request({ function: "records.list.v1", retry: "true" }));
  assert.equal(offlineResult.response.payload.error.code, "NETWORK");
  assert.equal(offlineFetches, 0);

  const waiting = createRpcCapabilities({
    fetchImpl: async (_url, { signal }) => new Promise((_accept, reject) => signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true })),
    online: () => true,
  });
  const cancelRequest = request({ function: "records.list.v1", retry: "false" }, 500);
  const cancelPromise = waiting.handle(cancelRequest);
  await new Promise((accept) => setTimeout(accept, 0));
  assert.equal(waiting.cancel(cancelRequest.requestId), true);
  assert.equal((await cancelPromise).response.payload.error.code, "CANCELLED");
  assert.equal(waiting.activeRequests, 0);

  const deadlineTransport = createRpcCapabilities({
    fetchImpl: async (_url, { signal }) => new Promise((_accept, reject) => signal.addEventListener("abort", () => reject(new Error("deadline")), { once: true })),
    online: () => true,
  });
  const deadlineResult = await deadlineTransport.handle(request({ function: "records.list.v1", retry: "false" }, 5));
  assert.equal(deadlineResult.response.payload.error.code, "DEADLINE");
  transport.dispose();
  offline.dispose();
  waiting.dispose();
  deadlineTransport.dispose();
});

test("browser RPC adapter reads the current session token for each request", async () => {
  let token = "first-session-token-with-at-least-32-characters";
  const observed = [];
  const validResponse = (source) => ({ accepted: true, response: { version: 1, requestId: source.requestId, traceId: source.traceId, status: "ok", payload: { version: 1, success: false, data: null, error: { code: "UNAUTHORIZED", message: "Authentication required" }, traceId: source.traceId } } });
  const direct = createRpcCapabilities({
    authorizationToken: () => token,
    async fetchImpl(_url, options) {
      observed.push(options.headers.Authorization);
      const source = JSON.parse(options.body);
      return { ok: true, status: 200, async json() { return validResponse(source); } };
    },
  });
  await direct.handle(request({ function: "records.list.v1", retry: "false" }));
  token = "second-session-token-with-at-least-32-characters";
  await direct.handle(request({ function: "records.list.v1", retry: "false" }));
  assert.deepEqual(observed, ["Bearer first-session-token-with-at-least-32-characters", "Bearer second-session-token-with-at-least-32-characters"]);
  direct.dispose();
});

test("build rejects a stale generated server client", async () => {
  const workspace = await mkdtemp(resolve(tmpdir(), "luastra-stale-backend-client-"));
  try {
    const copied = resolve(workspace, "forms-crud");
    await cp(projectRoot, copied, { recursive: true });
    const declarationPath = resolve(copied, "backend/functions.json");
    const declaration = JSON.parse(await readFile(declarationPath, "utf8"));
    declaration.functions["records.list.v1"].clientName = "listAllRecords";
    await writeFile(declarationPath, `${JSON.stringify(declaration, null, 2)}\n`);
    await assert.rejects(buildProject({ manifestPath: resolve(copied, "luastra.json"), outputDirectory: resolve(workspace, "out"), target: "bundle" }), /generated backend client is missing or stale/);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("web bundle contains the generated client contract but no trusted backend implementation", async () => {
  const workspace = await mkdtemp(resolve(tmpdir(), "luastra-backend-web-boundary-"));
  try {
    const built = await buildProject({ manifestPath, outputDirectory: workspace, target: "web" });
    assert.match(built.backendContractSha256, /^[0-9a-f]{64}$/);
    assert.match(built.generatedBackendClientSha256, /^[0-9a-f]{64}$/);
    const ledger = JSON.parse(await readFile(resolve(workspace, "asset-manifest.json"), "utf8"));
    assert.equal(ledger.assets.some((asset) => /backend\/handlers|backend\/functions/.test(asset.path)), false);
    const clientFiles = ledger.assets.filter((asset) => asset.path.endsWith(".luauc"));
    assert.ok(clientFiles.length > 0, "generated Luau client bytecode is missing");
    const main = await readFile(resolve(workspace, "main.js"), "utf8");
    assert.equal(main.includes("private database connection"), false);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("local development server executes an authenticated project backend over HTTP", async () => {
  const events = [];
  const controller = await runProject({ manifestPath, port: 0, watch: false, onEvent: (event) => events.push(event) });
  try {
    assert.equal(events[0].backend, "local-authenticated");
    const capability = request({ function: "records.list.v1", retry: "true" });
    const result = await fetch(new URL("/__luastra/rpc", controller.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(capability),
    });
    assert.equal(result.status, 200);
    const handled = await result.json();
    assert.equal(handled.response.payload.success, true);
    assert.equal(decodeWire(handled.response.payload.data.payload)["result.records.length"], "2");
  } finally {
    await controller.close();
  }
});
