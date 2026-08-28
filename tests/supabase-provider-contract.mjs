import assert from "node:assert/strict";
import test from "node:test";

import {
  SupabaseProviderError,
  createSupabaseAuthProvider,
  createSupabaseRecordProvider,
  createSupabaseStorageProvider,
  supabaseProviderLimits,
} from "../backend/providers/supabase-http.mjs";

const baseUrl = "https://project.supabase.co";
const publishableKey = "sb_publishable_0123456789abcdefghijklmnopqrstuvwxyz";
const userId = "11111111-1111-4111-8111-111111111111";
const nowMs = 1_800_000_000_000;
const issuer = `${baseUrl}/auth/v1`;

function jwt(overrides = {}) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "ES256", typ: "JWT" })}.${encode({ sub: userId, aud: "authenticated", iss: issuer, exp: Math.floor(nowMs / 1000) + 3600, ...overrides })}.signature`;
}
function session(overrides = {}) {
  return {
    access_token: jwt(),
    refresh_token: "refresh_0123456789abcdefghijklmnopqrstuvwxyz",
    token_type: "bearer",
    expires_in: 3600,
    user: {
      id: userId,
      email: "member@example.test",
      app_metadata: { roles: ["user", "subscriber"] },
      user_metadata: { roles: ["admin"], name: "Untrusted display metadata" },
    },
    ...overrides,
  };
}
function json(value, status = 200, headers = {}) {
  return new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json", ...headers } });
}
async function providerError(promise, code) {
  await assert.rejects(promise, (error) => error instanceof SupabaseProviderError && error.code === code);
}

test("Supabase providers reject secret keys, remote cleartext and endpoint path injection", () => {
  assert.throws(() => createSupabaseAuthProvider({ url: baseUrl, publishableKey: "sb_secret_0123456789abcdefghijklmnopqrstuvwxyz" }), /publishable key/);
  assert.throws(() => createSupabaseAuthProvider({ url: "http://example.com", publishableKey }), /HTTPS or loopback/);
  assert.throws(() => createSupabaseAuthProvider({ url: `${baseUrl}/attacker`, publishableKey }), /without credentials, path/);
  assert.doesNotThrow(() => createSupabaseAuthProvider({ url: "http://127.0.0.1:54321", publishableKey }));
});

test("Supabase Auth password flow uses only apikey and admits provider-controlled app roles", async () => {
  const observed = [];
  const auth = createSupabaseAuthProvider({
    url: baseUrl,
    publishableKey,
    now: () => nowMs,
    async fetchImpl(url, options) {
      observed.push({ url: url.href, options });
      return json(session());
    },
  });
  const result = await auth.signInWithPassword(" Member@Example.test ", "correct horse battery staple");
  assert.equal(result.providerUserId, userId);
  assert.equal(result.email, "member@example.test");
  assert.equal(result.name, "member@example.test", "untrusted user metadata became an identity display value");
  assert.deepEqual(result.roles, ["user", "subscriber"]);
  assert.equal(result.expiresAt, nowMs + 3_600_000);
  assert.equal(observed.length, 1);
  assert.equal(observed[0].url, `${baseUrl}/auth/v1/token?grant_type=password`);
  assert.equal(observed[0].options.method, "POST");
  assert.equal(observed[0].options.headers.apikey, publishableKey);
  assert.equal(observed[0].options.headers.Authorization, undefined, "publishable key was incorrectly sent as a bearer token");
  assert.deepEqual(JSON.parse(observed[0].options.body), { email: "member@example.test", password: "correct horse battery staple" });
  assert.equal(observed[0].options.redirect, "error");
});

test("Supabase Auth admits the current compact opaque refresh-token format", async () => {
  const auth = createSupabaseAuthProvider({
    url: baseUrl,
    publishableKey,
    now: () => nowMs,
    fetchImpl: async () => json(session({ refresh_token: "A1b2C3d4E5f6" })),
  });
  assert.equal((await auth.signInWithPassword("member@example.test", "password")).refreshToken, "A1b2C3d4E5f6");
});

test("Supabase Auth recovery stays server-brokered, validates redirects and updates passwords", async () => {
  const calls = [];
  const auth = createSupabaseAuthProvider({
    url: baseUrl,
    publishableKey,
    async fetchImpl(url, options) {
      calls.push({ url: url.href, options });
      if (url.pathname.endsWith("/recover")) return json({});
      if (url.pathname.endsWith("/user")) return json({ id: userId, email: "member@example.test" });
      return new Response(null, { status: 204 });
    },
  });
  assert.equal(await auth.requestPasswordRecovery(" Member@Example.test ", { redirectTo: "https://luastra.dev/auth/recovery" }), true);
  assert.equal(calls[0].url, `${baseUrl}/auth/v1/recover?redirect_to=https%3A%2F%2Fluastra.dev%2Fauth%2Frecovery`);
  assert.deepEqual(JSON.parse(calls[0].options.body), { email: "member@example.test" });
  assert.equal(calls[0].options.headers.Authorization, undefined);
  assert.equal(await auth.updatePassword(jwt(), "new secure password"), true);
  assert.equal(calls[1].url, `${baseUrl}/auth/v1/user`);
  assert.equal(calls[1].options.method, "PUT");
  assert.deepEqual(JSON.parse(calls[1].options.body), { password: "new secure password" });
  assert.equal(calls[1].options.headers.Authorization, `Bearer ${jwt()}`);
  assert.equal(await auth.signOut(jwt(), { scope: "global" }), true);
  assert.equal(calls[2].url, `${baseUrl}/auth/v1/logout?scope=global`);
  await providerError(auth.requestPasswordRecovery("member@example.test", { redirectTo: "http://attacker.example/recovery" }), "VALIDATION");
  await providerError(auth.updatePassword(jwt(), "short"), "VALIDATION");
  await providerError(auth.signOut(jwt(), { scope: "invalid" }), "VALIDATION");
});

test("Supabase Auth maps invalid credentials, rate limits and outages without leaking provider messages", async () => {
  for (const [status, code] of [[400, "INVALID_CREDENTIALS"], [401, "INVALID_CREDENTIALS"], [429, "RATE_LIMITED"], [503, "UNAVAILABLE"]]) {
    const auth = createSupabaseAuthProvider({ url: baseUrl, publishableKey, fetchImpl: async () => json({ message: "private provider diagnostic" }, status) });
    await assert.rejects(auth.signInWithPassword("member@example.test", "wrong-password"), (error) => {
      assert.equal(error.code, code);
      assert.equal(error.message.includes("private provider diagnostic"), false);
      return true;
    });
  }
  const recoveryLimited = createSupabaseAuthProvider({ url: baseUrl, publishableKey, fetchImpl: async () => json({ message: "private provider diagnostic" }, 429) });
  await providerError(recoveryLimited.requestPasswordRecovery("member@example.test"), "RATE_LIMITED");
});

test("Supabase Auth rejects mismatched subject, audience, issuer, expiry and requested email", async () => {
  const invalidSessions = [
    session({ access_token: jwt({ sub: "22222222-2222-4222-8222-222222222222" }) }),
    session({ access_token: jwt({ aud: "anon" }) }),
    session({ access_token: jwt({ iss: "https://attacker.example/auth/v1" }) }),
    session({ access_token: jwt({ exp: Math.floor(nowMs / 1000) - 1 }) }),
    session({ user: { ...session().user, email: "other@example.test" } }),
  ];
  for (const value of invalidSessions) {
    const auth = createSupabaseAuthProvider({ url: baseUrl, publishableKey, now: () => nowMs, fetchImpl: async () => json(value) });
    await providerError(auth.signInWithPassword("member@example.test", "password"), "MALFORMED_RESPONSE");
  }
});

test("Supabase Auth refresh rotates credentials and local logout uses the user bearer token", async () => {
  const calls = [];
  const rotated = session({ refresh_token: "refresh_rotated_0123456789abcdefghijklmnop" });
  const auth = createSupabaseAuthProvider({
    url: baseUrl,
    publishableKey,
    now: () => nowMs,
    async fetchImpl(url, options) {
      calls.push({ url: url.href, options });
      return calls.length === 1 ? json(rotated) : new Response(null, { status: 204 });
    },
  });
  const refreshed = await auth.refreshSession("refresh_original_0123456789abcdefghijklmnop");
  assert.equal(refreshed.refreshToken, rotated.refresh_token);
  assert.deepEqual(JSON.parse(calls[0].options.body), { refresh_token: "refresh_original_0123456789abcdefghijklmnop" });
  assert.equal(calls[0].url, `${baseUrl}/auth/v1/token?grant_type=refresh_token`);
  assert.equal(await auth.signOut(refreshed.accessToken), true);
  assert.equal(calls[1].url, `${baseUrl}/auth/v1/logout?scope=local`);
  assert.equal(calls[1].options.headers.Authorization, `Bearer ${refreshed.accessToken}`);
});

test("Supabase Auth treats a provider-rejected refresh token as unauthorized", async () => {
  const auth = createSupabaseAuthProvider({ url: baseUrl, publishableKey, fetchImpl: async () => json({ message: "refresh token not found" }, 400) });
  await providerError(auth.refreshSession("A1b2C3d4E5f6"), "UNAUTHORIZED");
});

test("Supabase transport distinguishes cancellation, timeout, network and malformed response boundaries", async () => {
  const waitingFetch = async (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true }));
  const timed = createSupabaseAuthProvider({ url: baseUrl, publishableKey, timeoutMs: 5, fetchImpl: waitingFetch });
  await providerError(timed.signInWithPassword("member@example.test", "password"), "TIMEOUT");

  const controller = new AbortController();
  const cancelled = createSupabaseAuthProvider({ url: baseUrl, publishableKey, timeoutMs: 1000, fetchImpl: waitingFetch });
  const pending = cancelled.signInWithPassword("member@example.test", "password", { signal: controller.signal });
  controller.abort();
  await providerError(pending, "CANCELLED");

  const network = createSupabaseAuthProvider({ url: baseUrl, publishableKey, fetchImpl: async () => { throw new Error("private socket detail"); } });
  await providerError(network.signInWithPassword("member@example.test", "password"), "NETWORK");

  const text = createSupabaseAuthProvider({ url: baseUrl, publishableKey, fetchImpl: async () => new Response("not json", { status: 200, headers: { "Content-Type": "text/plain" } }) });
  await providerError(text.signInWithPassword("member@example.test", "password"), "MALFORMED_RESPONSE");

  const oversized = createSupabaseAuthProvider({ url: baseUrl, publishableKey, fetchImpl: async () => json({ padding: "x".repeat(supabaseProviderLimits.maximumResponseBytes) }) });
  await providerError(oversized.signInWithPassword("member@example.test", "password"), "MALFORMED_RESPONSE");
});

test("Supabase record provider emits bounded RLS-authenticated REST operations", async () => {
  const calls = [];
  const responses = [
    [{ id: "record-1", ownerId: userId, value: "one" }],
    [{ id: "record-1", ownerId: userId, value: "one" }],
    [{ id: "record-2", ownerId: userId, value: "two" }],
    [{ id: "record-2", ownerId: userId, value: "updated" }],
    [{ id: "record-2" }],
  ];
  const records = createSupabaseRecordProvider({
    url: baseUrl,
    publishableKey,
    tables: { preferences: "app_preferences" },
    async fetchImpl(url, options) { calls.push({ url: url.href, options }); return json(responses.shift()); },
  });
  const accessToken = jwt();
  assert.equal((await records.list("preferences", accessToken)).length, 1);
  assert.equal((await records.get("preferences", "record-1", accessToken)).id, "record-1");
  assert.equal((await records.insert("preferences", { id: "record-2", ownerId: userId, value: "two" }, accessToken)).value, "two");
  assert.equal((await records.update("preferences", "record-2", { id: "record-2", ownerId: userId, value: "updated" }, accessToken)).value, "updated");
  assert.equal(await records.delete("preferences", "record-2", accessToken), true);
  assert.deepEqual(calls.map((call) => call.options.method), ["GET", "GET", "POST", "PATCH", "DELETE"]);
  assert.equal(calls.every((call) => call.options.headers.apikey === publishableKey && call.options.headers.Authorization === `Bearer ${accessToken}`), true);
  assert.equal(calls[0].url, `${baseUrl}/rest/v1/app_preferences?select=*`);
  assert.equal(calls[1].url, `${baseUrl}/rest/v1/app_preferences?id=eq.record-1&select=*&limit=1`);
  assert.equal(calls[2].options.headers.Prefer, "return=representation");
  assert.equal(calls[4].url, `${baseUrl}/rest/v1/app_preferences?id=eq.record-2&select=id`);
});

test("Supabase record provider sends only explicitly admitted mutable fields", async () => {
  const calls = [];
  const records = createSupabaseRecordProvider({
    url: baseUrl,
    publishableKey,
    tables: { progress: { table: "luastra_progress", updateFields: ["position_seconds", "duration_seconds", "completed"] } },
    async fetchImpl(url, options) {
      calls.push({ url: url.href, body: JSON.parse(options.body) });
      return json([{ id: "record-1", user_id: userId, resource_key: "audio/one", position_seconds: 42, duration_seconds: 60, completed: false }]);
    },
  });
  await records.update("progress", "record-1", { id: "record-1", user_id: userId, resource_key: "audio/one", position_seconds: 42, duration_seconds: 60, completed: false }, jwt());
  assert.deepEqual(calls[0].body, { position_seconds: 42, duration_seconds: 60, completed: false });
  await providerError(records.update("progress", "record-1", { id: "record-1", user_id: userId, resource_key: "audio/one" }, jwt()), "VALIDATION");
  assert.throws(() => createSupabaseRecordProvider({ url: baseUrl, publishableKey, tables: { progress: { table: "luastra_progress", updateFields: ["id"] } } }), /table mapping/i);
});

test("Supabase record provider fails closed on RLS denial, missing exposure and unsafe records", async () => {
  const denied = createSupabaseRecordProvider({ url: baseUrl, publishableKey, tables: { preferences: "app_preferences" }, fetchImpl: async () => json({ message: "denied" }, 403) });
  await providerError(denied.list("preferences", jwt()), "FORBIDDEN");
  const missing = createSupabaseRecordProvider({ url: baseUrl, publishableKey, tables: { preferences: "app_preferences" }, fetchImpl: async () => json({ message: "not exposed" }, 404) });
  await providerError(missing.list("preferences", jwt()), "PROVIDER_SCHEMA");
  const unsafeRecord = JSON.parse('[{"id":"record-1","__proto__":{"polluted":true}}]');
  const malformed = createSupabaseRecordProvider({ url: baseUrl, publishableKey, tables: { preferences: "app_preferences" }, fetchImpl: async () => json(unsafeRecord) });
  await providerError(malformed.list("preferences", jwt()), "MALFORMED_RESPONSE");
  const zeroUpdate = createSupabaseRecordProvider({ url: baseUrl, publishableKey, tables: { preferences: "app_preferences" }, fetchImpl: async () => json([]) });
  await providerError(zeroUpdate.update("preferences", "record-1", { id: "record-1", value: "x" }, jwt()), "FORBIDDEN");
  assert.equal({}.polluted, undefined);
});

test("Supabase Storage signs only admitted private objects and keeps delivery same-origin", async () => {
  const calls = [];
  const storage = createSupabaseStorageProvider({
    url: baseUrl,
    publishableKey,
    now: () => nowMs,
    items: [{ id: "audio/evening", bucket: "private-media", path: "meditations/Evening Rest.wav" }],
    async fetchImpl(url, options) {
      calls.push({ url: url.href, options });
      return json({ signedURL: "/object/sign/private-media/meditations/Evening%20Rest.wav?token=opaque" });
    },
  });
  const delivery = await storage.createSignedDelivery("audio/evening", jwt(), { ttlSeconds: 45 });
  assert.equal(delivery.deliveryUrl, `${baseUrl}/storage/v1/object/sign/private-media/meditations/Evening%20Rest.wav?token=opaque`);
  assert.equal(delivery.expiresAt, nowMs + 45_000);
  assert.equal(calls[0].url, `${baseUrl}/storage/v1/object/sign/private-media/meditations/Evening%20Rest.wav`);
  assert.equal(calls[0].options.headers.Authorization, `Bearer ${jwt()}`);
  assert.deepEqual(JSON.parse(calls[0].options.body), { expiresIn: 45 });
});

test("Supabase Storage rejects cross-origin delivery, unknown content and invalid TTL", async () => {
  const storage = createSupabaseStorageProvider({
    url: baseUrl,
    publishableKey,
    items: [{ id: "audio/evening", bucket: "private-media", path: "meditations/evening.wav" }],
    fetchImpl: async () => json({ signedURL: "https://attacker.example/storage/v1/object/sign/private-media/evening.wav?token=stolen" }),
  });
  await providerError(storage.createSignedDelivery("audio/evening", jwt()), "MALFORMED_RESPONSE");
  await providerError(storage.createSignedDelivery("audio/unknown", jwt()), "VALIDATION");
  await providerError(storage.createSignedDelivery("audio/evening", jwt(), { ttlSeconds: 61 }), "VALIDATION");
});

test("Supabase Storage maps hidden RLS not-found responses to a bounded denial", async () => {
  const storage = createSupabaseStorageProvider({
    url: baseUrl,
    publishableKey,
    items: [{ id: "audio/evening", bucket: "private-media", path: "meditations/evening.wav" }],
    fetchImpl: async () => json({ statusCode: "404", error: "not_found", code: "NoSuchKey", message: "Object not found" }, 400),
  });
  await providerError(storage.createSignedDelivery("audio/evening", jwt()), "FORBIDDEN");
});
