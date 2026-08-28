import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { createProviderSessionStore } from "../backend/provider-session.mjs";

const key = Buffer.from("0123456789abcdef0123456789abcdef", "utf8");
const principal = { id: "person@example.test", roles: ["user", "user"] };
const provider = (expiresAt, suffix = "one") => ({
  provider: "supabase",
  providerUserId: "8e1e21c0-79e4-4af1-88ca-b5276f0f2df8",
  accessToken: `access.jwt.${suffix}`,
  refreshToken: `refresh-token-${suffix}-00000000`,
  expiresAt,
});

async function fixture(t) {
  const root = await mkdtemp(resolve(tmpdir(), "luastra-provider-session-"));
  const path = resolve(root, "sessions.sqlite");
  const stores = [];
  t.after(async () => {
    for (const store of stores.reverse()) {
      try { store.close(); } catch {}
    }
    await rm(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
  });
  let tokenSequence = 0;
  let nonceSequence = 0;
  let current = 1_000_000;
  const options = {
    path,
    encryptionKey: key,
    now: () => current,
    randomToken: () => `opaque_${String(++tokenSequence).padStart(40, "0")}`,
    randomBytesImpl: (length) => Buffer.alloc(length, ++nonceSequence),
    randomId: () => "12345678-1234-4234-9234-123456789abc",
  };
  const createStore = (overrides = {}) => {
    const store = createProviderSessionStore({ ...options, ...overrides });
    stores.push(store);
    return store;
  };
  return { root, path, options, createStore, now: () => current, advance: (milliseconds) => { current += milliseconds; } };
}

test("provider session broker validates key material and persists only opaque digests plus encrypted provider tokens", async (t) => {
  const fx = await fixture(t);
  assert.throws(() => createProviderSessionStore({ ...fx.options, encryptionKey: Buffer.alloc(31) }), /exactly 32 bytes/);
  const store = fx.createStore();
  const issued = store.issue(principal, provider(fx.now() + 120_000), { ttlMs: 300_000 });
  assert.equal(issued.token.includes("person"), false);
  assert.deepEqual(store.resolve(issued.token).roles, ["user"]);
  assert.equal(store.resolveAuthorization(`Bearer ${issued.token}`).id, principal.id);
  assert.equal(store.resolveAuthorization(`bearer ${issued.token}`), null);

  const sqlite = new DatabaseSync(fx.path, { readOnly: true });
  const row = sqlite.prepare("SELECT token_hash, encrypted_material, provider, provider_user_id FROM luastra_provider_sessions").get();
  sqlite.close();
  assert.match(row.token_hash, /^[a-f0-9]{64}$/);
  assert.equal(row.token_hash.includes(issued.token), false);
  assert.equal(row.encrypted_material.includes("access.jwt.one"), false);
  assert.equal(row.encrypted_material.includes("refresh-token-one"), false);
  assert.equal(row.provider, "supabase");
  assert.equal(row.provider_user_id, provider(1).providerUserId);
  for (const file of await readdir(fx.root)) {
    const databaseBytes = await readFile(resolve(fx.root, file));
    assert.equal(databaseBytes.includes(Buffer.from(issued.token)), false, `${file} persisted the opaque bearer token`);
    assert.equal(databaseBytes.includes(Buffer.from("access.jwt.one")), false, `${file} persisted a provider access token`);
    assert.equal(databaseBytes.includes(Buffer.from("refresh-token-one")), false, `${file} persisted a provider refresh token`);
  }
});

test("provider session survives restart, authenticates ciphertext and expires or revokes closed", async (t) => {
  const fx = await fixture(t);
  const first = fx.createStore();
  const issued = first.issue(principal, provider(fx.now() + 120_000), { ttlMs: 300_000 });
  const sessionId = first.resolve(issued.token).session;
  first.close();

  const restarted = fx.createStore({ randomId: () => "22345678-1234-4234-9234-123456789abc" });
  assert.equal(restarted.readProvider(issued.token).accessToken, "access.jwt.one");
  restarted.close();

  const wrongKey = fx.createStore({ encryptionKey: Buffer.alloc(32, 9) });
  assert.throws(() => wrongKey.readProvider(issued.token), /could not be authenticated/);
  wrongKey.close();

  const revoking = fx.createStore();
  assert.equal(revoking.revoke(sessionId), true);
  assert.equal(revoking.resolve(issued.token), null);
  const expiring = revoking.issue(principal, provider(fx.now() + 120_000), { ttlMs: 1_000 });
  fx.advance(1_000);
  assert.equal(revoking.resolve(expiring.token), null);
  assert.equal(revoking.prune(), 0, "expired row was already removed during resolution");
});

test("refresh lease is a transactional single winner across two store instances", async (t) => {
  const fx = await fixture(t);
  const first = fx.createStore();
  const second = fx.createStore({ randomToken: () => "second_0000000000000000000000000000000000000000" });
  const issued = first.issue(principal, provider(fx.now() + 20_000), { ttlMs: 300_000 });

  const winner = first.beginRefresh(issued.token, { refreshWithinMs: 60_000, leaseMs: 10_000 });
  assert.equal(winner.state, "acquired");
  assert.equal(second.beginRefresh(issued.token, { refreshWithinMs: 60_000, leaseMs: 10_000 }).state, "busy");
  assert.equal(first.completeRefresh(winner.provider.sessionId, "wrong_0000000000000000000000000000000000000000", provider(fx.now() + 120_000, "two")), false);
  assert.equal(first.completeRefresh(winner.provider.sessionId, winner.lease, provider(fx.now() + 120_000, "two"), { principal: { id: principal.id, roles: ["admin"] } }), true);
  assert.equal(second.completeRefresh(winner.provider.sessionId, winner.lease, provider(fx.now() + 180_000, "three")), false);
  const rotated = second.readProvider(issued.token);
  assert.equal(rotated.accessToken, "access.jwt.two");
  assert.equal(rotated.refreshToken, "refresh-token-two-00000000");
  assert.equal(rotated.revision, 2);
  assert.deepEqual(second.resolve(issued.token).roles, ["admin"]);
  assert.equal(second.beginRefresh(issued.token, { refreshWithinMs: 60_000 }).state, "fresh");
});

test("expired refresh leases cannot commit and identity changes fail closed", async (t) => {
  const fx = await fixture(t);
  const store = fx.createStore();
  const issued = store.issue(principal, provider(fx.now() + 10_000), { ttlMs: 300_000 });
  const stale = store.beginRefresh(issued.token, { refreshWithinMs: 60_000, leaseMs: 1_000 });
  fx.advance(1_000);
  assert.equal(store.completeRefresh(stale.provider.sessionId, stale.lease, provider(fx.now() + 120_000, "stale")), false);
  const current = store.beginRefresh(issued.token, { refreshWithinMs: 60_000, leaseMs: 10_000 });
  assert.equal(current.state, "acquired");
  assert.throws(() => store.completeRefresh(current.provider.sessionId, current.lease, { ...provider(fx.now() + 120_000, "attack"), providerUserId: "other-user" }), /identity changed/);
  assert.equal(store.abortRefresh(current.provider.sessionId, current.lease), true);
  assert.equal(store.beginRefresh(issued.token, { refreshWithinMs: 60_000, leaseMs: 10_000 }).state, "acquired");
});
