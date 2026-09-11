import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { loadBackendContract } from "../backend/contract.mjs";
import { generateLuauClient } from "../backend/generate-client.mjs";
import { BackendPublicError, createBackendRuntime, handleServerCapability } from "../backend/runtime.mjs";
import { decodeBackendV2Result, encodeBackendV2Request } from "../backend/wire-v2.mjs";

const prototype = resolve(import.meta.dirname, "..");

function declaration() {
  return {
    schemaVersion: 2,
    limits: { maximumDepth: 8, maximumFields: 128, maximumItems: 16, maximumStringBytes: 1024, maximumPayloadBytes: 4096 },
    enums: { SortDirection: ["ascending", "descending"] },
    types: {
      Author: {
        id: { type: "string", maximumBytes: 64 },
        displayName: { type: "string", maximumBytes: 128 },
        bio: { type: "string", optional: true, nullable: true, maximumBytes: 256 },
      },
      Record: {
        id: { type: "string", maximumBytes: 64 },
        author: { type: "Author" },
        tags: { type: "string", array: true, maximumItems: 4 },
        score: { type: "number", nullable: true },
      },
      CursorPage: {
        items: { type: "Record", array: true, maximumItems: 3 },
        previousCursor: { type: "string", optional: true, nullable: true, maximumBytes: 128 },
        nextCursor: { type: "string", optional: true, nullable: true, maximumBytes: 128 },
        revision: { type: "string", maximumBytes: 64 },
      },
    },
    functions: {
      "records.page.v2": {
        clientName: "pageRecords",
        authorization: "user",
        mutation: false,
        idempotency: "none",
        resultVersion: 1,
        input: {
          cursor: { type: "string", optional: true, nullable: true, maximumBytes: 128 },
          direction: { type: "SortDirection" },
          limit: { type: "number" },
        },
        result: { page: { type: "CursorPage" } },
      },
      "records.rename.v2": {
        clientName: "renameRecord",
        authorization: "user",
        mutation: true,
        idempotency: "required",
        resultVersion: 1,
        input: {
          id: { type: "string", maximumBytes: 64 },
          title: { type: "string", maximumBytes: 256 },
        },
        result: { record: { type: "Record" } },
      },
    },
  };
}

async function loadedContract(value = declaration()) {
  const directory = await mkdtemp(resolve(tmpdir(), "luastra-backend-v2-contract-"));
  const path = resolve(directory, "functions.json");
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
  try { return await loadBackendContract("functions.json", directory); }
  finally { await rm(directory, { recursive: true, force: true }); }
}

function request(payload, requestId = 1, operation = "server.call.v1") {
  const traceId = `backend-v2-trace-${requestId}`;
  return { version: 1, kind: "rpc.call", requestId, traceId, deadlineMs: 1000, payload: { version: 1, operation, input: payload, traceId, deadlineMs: 1000 } };
}

test("backend v2 contract admits bounded nested cursor pages and rejects ambiguous schemas", async () => {
  const contract = await loadedContract();
  assert.equal(contract.value.schemaVersion, 2);
  assert.match(contract.sha256, /^[0-9a-f]{64}$/);

  const cyclic = declaration();
  cyclic.types.Author.parent = { type: "Author", optional: true };
  await assert.rejects(loadedContract(cyclic), /type cycle/);

  const reserved = declaration();
  reserved.types.Record.length = { type: "number" };
  await assert.rejects(loadedContract(reserved), /invalid or reserved field/);

  const unbounded = declaration();
  unbounded.functions["records.page.v2"].input.cursor.maximumBytes = 4097;
  await assert.rejects(loadedContract(unbounded), /maximumBytes/);

  const oversizedPayload = declaration();
  oversizedPayload.limits.maximumPayloadBytes = 4097;
  await assert.rejects(loadedContract(oversizedPayload), /maximumPayloadBytes/);

  const expandedPastBudget = declaration();
  expandedPastBudget.limits.maximumFields = 32;
  await assert.rejects(loadedContract(expandedPastBudget), /encoded field budget/);

  const longPath = declaration();
  longPath.types.LevelOne = { secondSegmentWithEnoughCharactersToExtendTheWirePathPastItsLimit: { type: "LevelTwo" } };
  longPath.types.LevelTwo = { finalSegmentWithEnoughCharactersToExtendTheWirePathPastItsLimit: { type: "string" } };
  longPath.types.Record.firstSegmentWithEnoughCharactersToExtendTheWirePathPastItsLimit = { type: "LevelOne" };
  await assert.rejects(loadedContract(longPath), /encoded path limit/);
});

test("backend v2 wire round-trips optional, null, enum, nested object, and array values canonically", async () => {
  const contract = (await loadedContract()).value;
  const payload = encodeBackendV2Request({ operation: "records.page.v2", retry: false, input: { cursor: null, direction: "ascending", limit: 3 } }, contract);
  assert.match(payload, /^v=2&/);
  assert.match(payload, /input\.cursor\.null=true/);
  assert.equal(payload, encodeBackendV2Request({ operation: "records.page.v2", retry: false, input: { limit: 3, direction: "ascending", cursor: null } }, contract));

  const definition = contract.functions["records.page.v2"];
  const runtime = createBackendRuntime({ contract, handlers: {
    async "records.page.v2"(input) {
      assert.equal(input.cursor, null);
      return { page: { items: [{ id: "record-1", author: { id: "author-1", displayName: "Ada" }, tags: ["alpha", "stable"], score: null }], previousCursor: null, nextCursor: "cursor-2", revision: "revision-1" } };
    },
  } });
  const handled = await handleServerCapability(request(payload), { runtime, principal: { id: "user-1", roles: ["user"] } });
  assert.equal(handled.accepted, true);
  assert.equal(handled.response.payload.success, true);
  assert.deepEqual(decodeBackendV2Result(handled.response.payload.data.payload, definition, contract), {
    page: { items: [{ id: "record-1", author: { id: "author-1", displayName: "Ada" }, tags: ["alpha", "stable"], score: null }], previousCursor: null, nextCursor: "cursor-2", revision: "revision-1" },
  });
  const mismatch = await runtime.call({ payload, principal: { id: "user-1", roles: ["user"] }, traceId: "backend-v2-mismatch", wireVersion: 1 });
  assert.equal(mismatch.error.code, "VALIDATION");
});

test("backend v2 wire rejects unknown fields, invalid enums, limits, and non-canonical encodings", async () => {
  const contract = (await loadedContract()).value;
  assert.throws(() => encodeBackendV2Request({ operation: "records.page.v2", input: { direction: "sideways", limit: 3 } }, contract), /enum/);
  assert.throws(() => encodeBackendV2Request({ operation: "records.page.v2", input: { direction: "ascending", limit: 3, extra: true } }, contract), /unknown field/);
  assert.throws(() => encodeBackendV2Request({ operation: "records.page.v2", input: { direction: "ascending", limit: 3, cursor: "x".repeat(129) } }, contract), /string/);
  assert.throws(() => encodeBackendV2Request({ operation: "records.page.v2", input: { direction: "ascending", limit: 3.5 } }, contract), /number/);
  const valid = encodeBackendV2Request({ operation: "records.page.v2", input: { direction: "ascending", limit: 3 } }, contract);
  const malformed = valid.replace("ascending", "%61scending");
  const runtime = createBackendRuntime({ contract, handlers: { async "records.page.v2"() { throw new Error("must not execute"); } } });
  const handled = await handleServerCapability(request(malformed), { runtime, principal: { id: "user-1", roles: ["user"] } });
  assert.equal(handled.response.payload.error.code, "VALIDATION");
});

test("backend v2 preserves authorization, idempotency, conflict, and cancellation semantics", async () => {
  const contract = (await loadedContract()).value;
  let mutations = 0;
  const runtime = createBackendRuntime({ contract, handlers: {
    async "records.rename.v2"(input) {
      mutations += 1;
      return { record: { id: input.id, author: { id: "author-1", displayName: "Ada" }, tags: [], score: null } };
    },
  } });
  const options = { operation: "records.rename.v2", retry: true, idempotencyKey: "rename-key-0001", input: { id: "record-1", title: "Renamed" } };
  const payload = encodeBackendV2Request(options, contract);
  const principal = { id: "user-1", roles: ["user"] };
  const first = await handleServerCapability(request(payload, 10), { runtime, principal });
  const replay = await handleServerCapability(request(payload, 11), { runtime, principal });
  assert.equal(first.response.payload.success, true);
  assert.equal(replay.response.payload.success, true);
  assert.equal(mutations, 1);

  const conflictPayload = encodeBackendV2Request({ ...options, input: { id: "record-1", title: "Different" } }, contract);
  const conflict = await handleServerCapability(request(conflictPayload, 12), { runtime, principal });
  assert.equal(conflict.response.payload.error.code, "VALIDATION");

  const unauthorized = await handleServerCapability(request(payload, 13), { runtime });
  assert.equal(unauthorized.response.payload.error.code, "UNAUTHORIZED");
  const cancelledSignal = new AbortController();
  cancelledSignal.abort();
  const cancelledPayload = encodeBackendV2Request({ ...options, idempotencyKey: "rename-key-0002" }, contract);
  const cancelled = await handleServerCapability(request(cancelledPayload, 14), { runtime, principal, signal: cancelledSignal.signal });
  assert.equal(cancelled.response.payload.error.code, "CANCELLED");
  assert.equal(mutations, 1);
});

test("backend v2 carries bounded field validation codes without parsing provider messages", async () => {
  const contract = (await loadedContract()).value;
  const runtime = createBackendRuntime({ contract, handlers: {
    async "records.rename.v2"(_input, context) {
      context.reject("VALIDATION", "Invalid record fields", { title: "REQUIRED", "author.bio": "TOO_LONG" });
    },
  } });
  const payload = encodeBackendV2Request({
    operation: "records.rename.v2",
    retry: false,
    idempotencyKey: "rename-key-fields",
    input: { id: "record-1", title: "" },
  }, contract);
  const handled = await handleServerCapability(request(payload), { runtime, principal: { id: "user-1", roles: ["user"] } });
  assert.equal(handled.response.payload.success, false);
  assert.equal(handled.response.payload.error.code, "VALIDATION");
  assert.match(handled.response.payload.error.message, /^v=1&error=fields&/);
  assert.doesNotMatch(handled.response.payload.error.message, /provider|postgres|supabase/i);
  assert.throws(() => new BackendPublicError("NETWORK", "Unavailable", { title: "REQUIRED" }), /require a validation error/);
  assert.throws(() => new BackendPublicError("VALIDATION", "Invalid", { title: "not-stable" }), /invalid public backend error fields/);
});

test("backend v2 generated client is strict Luau and uses the versioned typed path", async () => {
  const contract = (await loadedContract()).value;
  const source = generateLuauClient(contract);
  assert.match(source, /Server\.callV2\("records\.page\.v2"/);
  assert.match(source, /export type Nullable<T> = Server\.Nullable<T>/);
  assert.match(source, /export type CursorPage/);
  const directory = await mkdtemp(resolve(tmpdir(), "luastra-backend-v2-client-"));
  try {
    const generated = resolve(directory, "client.luau");
    await writeFile(generated, source);
    const hostTarget = `${process.platform}-${process.arch}`;
    const extension = process.platform === "win32" ? ".exe" : "";
    const analyzer = resolve(prototype, `platform/artifacts/${hostTarget}/luastra_analyze${extension}`);
    const result = spawnSync(analyzer, ["--entry=app/client", `app/client=${generated}`, `luastra/server=${resolve(prototype, "sdk/luastra/server.luau")}`], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.equal(JSON.parse(result.stdout).success, true);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
