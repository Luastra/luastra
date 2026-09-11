import assert from "node:assert/strict";
import test from "node:test";

import { createMemoryDatabase } from "../backend/database.mjs";
import { createDeclaredRecordCollections, createRecordCollection, createLocalRecordProvider, createSupabaseRecordCollectionProvider, normalizeRecordDeclarations, RecordProviderError, recordProviderLimits } from "../backend/records.mjs";
import { createBackendRuntime } from "../backend/runtime.mjs";
import { createSupabaseRecordProvider } from "../backend/providers/supabase-http.mjs";
import { encodeWire } from "../backend/wire.mjs";

const sort = Object.freeze([
  Object.freeze({ field: "created_at", direction: "desc" }),
  Object.freeze({ field: "id", direction: "desc" }),
]);
const configuration = Object.freeze({
  collection: "records",
  equalityFields: ["status"],
  mutableFields: ["title", "status"],
  insertFields: ["id", "owner_id", "created_at", "title", "status"],
  sorts: { newest: sort },
  defaultSort: "newest",
  maximumLimit: 2,
});
const user = Object.freeze({ id: "person@example.test", roles: Object.freeze(["user"]) });
const other = Object.freeze({ id: "other@example.test", roles: Object.freeze(["user"]) });

function localFixture() {
  const database = createMemoryDatabase();
  database.seed("records", [
    { id: "record-a", owner_id: user.id, created_at: 10, title: "A", status: "open" },
    { id: "record-b", owner_id: user.id, created_at: 20, title: "B", status: "open" },
    { id: "record-c", owner_id: user.id, created_at: 20, title: "C", status: "open" },
    { id: "record-d", owner_id: user.id, created_at: 30, title: "D", status: "closed" },
    { id: "record-other", owner_id: other.id, created_at: 40, title: "Other", status: "open" },
  ]);
  const provider = createLocalRecordProvider({ database, collection: "records", authorize: (_action, principal, record) => record.owner_id === principal.id });
  return { database, records: createRecordCollection({ provider, ...configuration }) };
}

test("record declarations normalize minimal local configuration into bounded immutable defaults", () => {
  const declarations = normalizeRecordDeclarations({
    notes: {
      provider: "local",
      authorization: { mode: "owner", field: "ownerId" },
      insertFields: ["id", "ownerId"],
    },
  });
  assert.deepEqual(declarations.notes.sorts, { byId: [{ field: "id", direction: "asc" }] });
  assert.equal(declarations.notes.defaultSort, "byId");
  assert.equal(declarations.notes.maximumLimit, 50);
  assert.deepEqual(declarations.notes.equalityFields, []);
  assert.deepEqual(declarations.notes.mutableFields, []);
  assert.equal(Object.isFrozen(declarations), true);
  assert.equal(Object.isFrozen(declarations.notes.sorts.byId), true);
});

test("record declarations reject ambiguous authorization and provider configuration", () => {
  const invalid = [
    [{ notes: { provider: "local" } }, { identityProvider: "none" }],
    [{ notes: { provider: "local", authorization: { mode: "owner", field: "ownerId" } } }, { identityProvider: "none" }],
    [{ notes: { provider: "local", authorization: { mode: "owner", field: "ownerId" }, insertFields: ["id", "ownerId"], mutableFields: ["ownerId"] } }, { identityProvider: "none" }],
    [{ notes: { provider: "local", table: "app_notes", authorization: { mode: "public" } } }, { identityProvider: "none" }],
    [{ notes: { provider: "supabase", table: "app_notes" } }, { identityProvider: "none" }],
    [{ notes: { provider: "supabase", table: "app_notes", authorization: { mode: "public" } } }, { identityProvider: "supabase" }],
    [{ notes: { provider: "local", authorization: { mode: "public" }, unexpected: true } }, { identityProvider: "none" }],
    [null, { identityProvider: "none" }],
    [{}, { identityProvider: "none" }],
  ];
  for (const [value, options] of invalid) assert.throws(() => normalizeRecordDeclarations(value, options));
});

test("declared local owner collections enforce ownership without handler-side provider construction", async () => {
  const database = createMemoryDatabase();
  database.seed("notes", [
    { id: "own", ownerId: user.id, title: "Own" },
    { id: "other", ownerId: other.id, title: "Other" },
  ]);
  const collections = createDeclaredRecordCollections({
    database,
    declarations: {
      notes: {
        provider: "local",
        authorization: { mode: "owner", field: "ownerId" },
        mutableFields: ["title"],
        insertFields: ["id", "ownerId", "title"],
      },
    },
  });
  assert.deepEqual((await collections.notes.list({}, user)).items.map((record) => record.id), ["own"]);
  assert.equal(await collections.notes.get("other", user), null);
  await assert.rejects(() => collections.notes.insert({ id: "forged", ownerId: other.id, title: "Forged" }, user), (error) => error instanceof RecordProviderError && error.code === "FORBIDDEN");
  assert.equal((await collections.notes.update("own", { title: "Updated" }, user)).title, "Updated");
});

test("declared Supabase collections pass only admitted collection configuration to the managed constructor", () => {
  const calls = [];
  const collection = Object.freeze({ kind: "managed-supabase-collection" });
  const collections = createDeclaredRecordCollections({
    database: createMemoryDatabase(),
    identityProvider: "supabase",
    declarations: {
      catalogue: {
        provider: "supabase",
        table: "app_catalogue",
        insertFields: ["id", "title"],
        maximumLimit: 10,
      },
    },
    createSupabaseRecordCollection(options) { calls.push(options); return collection; },
  });
  assert.equal(collections.catalogue, collection);
  assert.deepEqual(calls, [{
    collection: "catalogue",
    table: "app_catalogue",
    equalityFields: [],
    mutableFields: [],
    insertFields: ["id", "title"],
    sorts: { byId: [{ field: "id", direction: "asc" }] },
    defaultSort: "byId",
    maximumLimit: 10,
  }]);
  assert.equal(JSON.stringify(calls).includes("token"), false);
  assert.equal(JSON.stringify(calls).includes("publishableKey"), false);
});

test("provider-neutral local records page in stable order and traverse both directions", async () => {
  const { records } = localFixture();
  const first = await records.list({ limit: 2, sort: "newest" }, user);
  assert.deepEqual(first.items.map((record) => record.id), ["record-d", "record-c"]);
  assert.equal(first.previousCursor, null);
  assert.equal(typeof first.nextCursor, "string");

  const second = await records.list({ cursor: first.nextCursor, limit: 2, sort: "newest" }, user);
  assert.deepEqual(second.items.map((record) => record.id), ["record-b", "record-a"]);
  assert.equal(typeof second.previousCursor, "string");
  assert.equal(second.nextCursor, null);

  const previous = await records.list({ cursor: second.previousCursor, direction: "backward", limit: 2, sort: "newest" }, user);
  assert.deepEqual(previous.items.map((record) => record.id), ["record-d", "record-c"]);
  assert.equal(previous.previousCursor, null);
  assert.equal(typeof previous.nextCursor, "string");

  const filtered = await records.list({ equal: { status: "open" }, limit: 2 }, user);
  assert.deepEqual(filtered.items.map((record) => record.id), ["record-c", "record-b"]);
});

test("provider-neutral records enforce query, cursor, field and authorization boundaries", async () => {
  const { records } = localFixture();
  await assert.rejects(() => records.list({ equal: { owner_id: other.id } }, user), (error) => error instanceof RecordProviderError && error.code === "VALIDATION");
  await assert.rejects(() => records.list({ sort: "raw_sql" }, user), (error) => error instanceof RecordProviderError && error.code === "VALIDATION");
  await assert.rejects(() => records.list({ cursor: "not_a_cursor" }, user), (error) => error instanceof RecordProviderError && error.code === "VALIDATION");
  await assert.rejects(() => records.update("record-a", { owner_id: other.id }, user), (error) => error instanceof RecordProviderError && error.code === "VALIDATION");
  await assert.rejects(() => records.get("record-a", { id: "not valid", roles: ["user"] }), (error) => error instanceof RecordProviderError && error.code === "UNAUTHORIZED");
  assert.equal(await records.get("record-a", other), null);
  await assert.rejects(() => records.delete("record-a", other), (error) => error instanceof RecordProviderError && error.code === "FORBIDDEN");
  assert.equal(recordProviderLimits.absoluteMaximumLimit, 128);
});

test("provider-neutral records expose patch CRUD without replacing immutable fields", async () => {
  const { records } = localFixture();
  const inserted = await records.insert({ id: "record-new", owner_id: user.id, created_at: 50, title: "New", status: "open" }, user);
  assert.equal(inserted.title, "New");
  const updated = await records.update("record-new", { title: "Updated" }, user);
  assert.equal(updated.title, "Updated");
  assert.equal(updated.owner_id, user.id);
  assert.equal(updated.created_at, 50);
  assert.equal(await records.delete("record-new", user), true);
  assert.equal(await records.get("record-new", user), null);
});

test("Supabase adapter receives the same admitted keyset query without provider syntax in handler input", async () => {
  const calls = [];
  const responses = [
    [
      { id: "record-d", owner_id: user.id, created_at: 30, title: "D", status: "open" },
      { id: "record-c", owner_id: user.id, created_at: 20, title: "C", status: "open" },
      { id: "record-b", owner_id: user.id, created_at: 20, title: "B", status: "open" },
    ],
    [
      { id: "record-b", owner_id: user.id, created_at: 20, title: "B", status: "open" },
      { id: "record-a", owner_id: user.id, created_at: 10, title: "A", status: "open" },
    ],
    [
      { id: "record-c", owner_id: user.id, created_at: 20, title: "C", status: "open" },
      { id: "record-d", owner_id: user.id, created_at: 30, title: "D", status: "open" },
    ],
  ];
  const provider = createSupabaseRecordProvider({
    url: "https://project.supabase.co",
    publishableKey: "sb_publishable_0123456789abcdefghijklmnopqrstuvwxyz",
    tables: { records: { table: "app_records", updateFields: ["title", "status"], query: { equalityFields: ["status"], sorts: { newest: sort } } } },
    async fetchImpl(url, options) { calls.push({ url, options }); return new Response(JSON.stringify(responses.shift()), { status: 200, headers: { "content-type": "application/json" } }); },
  });
  const adapter = createSupabaseRecordCollectionProvider({ provider, collection: "records", accessTokenForPrincipal: () => "header.payload.signature" });
  const records = createRecordCollection({ provider: adapter, ...configuration });
  const first = await records.list({ equal: { status: "open" }, limit: 2 }, user);
  assert.deepEqual(first.items.map((record) => record.id), ["record-d", "record-c"]);
  const firstUrl = calls[0].url;
  assert.equal(firstUrl.pathname, "/rest/v1/app_records");
  assert.equal(firstUrl.searchParams.get("select"), "*");
  assert.equal(firstUrl.searchParams.get("status"), 'eq."open"');
  assert.equal(firstUrl.searchParams.get("order"), "created_at.desc,id.desc");
  assert.equal(firstUrl.searchParams.get("limit"), "3");
  assert.equal(firstUrl.searchParams.has("or"), false);

  const second = await records.list({ cursor: first.nextCursor, equal: { status: "open" }, limit: 2 }, user);
  assert.deepEqual(second.items.map((record) => record.id), ["record-b", "record-a"]);
  assert.match(calls[1].url.searchParams.get("or"), /created_at\.lt\.20/);
  assert.match(calls[1].url.searchParams.get("or"), /and\(created_at\.eq\.20,id\.lt\."record-c"\)/);
  const previous = await records.list({ cursor: second.previousCursor, direction: "backward", equal: { status: "open" }, limit: 2 }, user);
  assert.deepEqual(previous.items.map((record) => record.id), ["record-d", "record-c"]);
  assert.equal(calls[2].url.searchParams.get("order"), "created_at.asc,id.asc");
  assert.match(calls[2].url.searchParams.get("or"), /created_at\.gt\.20/);
  assert.match(calls[2].url.searchParams.get("or"), /and\(created_at\.eq\.20,id\.gt\."record-b"\)/);
  assert.equal(calls.every((call) => call.options.headers.Authorization === "Bearer header.payload.signature"), true);
});

test("backend runtime exposes named record collections and maps provider failures to bounded public errors", async () => {
  const denied = createRecordCollection({
    provider: {
      async list() { return { items: [], hasMore: false }; },
      async get() { throw new RecordProviderError("FORBIDDEN", "Record is not available"); },
      async insert(value) { return value; },
      async update(id, patch) { return { id, ...patch }; },
      async delete() { return true; },
    },
    ...configuration,
  });
  const contract = {
    types: {},
    functions: {
      "records.read.v1": { clientName: "read", authorization: "user", mutation: false, idempotency: "none", input: { id: "string" }, result: { found: "boolean" } },
    },
  };
  const runtime = createBackendRuntime({
    contract,
    records: { records: denied },
    handlers: { async "records.read.v1"(input, context) { return { found: await context.records.records.get(input.id, context.principal) !== null }; } },
  });
  const response = await runtime.call({ payload: encodeWire({ function: "records.read.v1", retry: "false", "input.id": "record-a" }), principal: user, traceId: "record-provider-runtime" });
  assert.equal(response.success, false);
  assert.deepEqual(response.error, { code: "FORBIDDEN", message: "Record is not available" });
});
