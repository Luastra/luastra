import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import { createProviderIdentityService, ProviderIdentityError } from "../backend/provider-identity.mjs";
import { createProviderSessionStore } from "../backend/provider-session.mjs";
import { createSupabaseAuthProvider } from "../backend/providers/supabase-http.mjs";

const userId = "8e1e21c0-79e4-4af1-88ca-b5276f0f2df8";
const supabaseUrl = "https://provider.example.test";
function jwt(expiresAt, suffix) {
  const encoded = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encoded({ alg: "none", typ: "JWT" })}.${encoded({ sub: userId, aud: "authenticated", iss: `${supabaseUrl}/auth/v1`, exp: Math.floor(expiresAt / 1000), suffix })}.signature`;
}
function supabaseSession(now, seconds, suffix, roles = ["user"]) {
  return { access_token: jwt(now + seconds * 1000, suffix), refresh_token: `refresh-token-${suffix}-00000000`, token_type: "bearer", expires_in: seconds, user: { id: userId, email: "person@example.test", app_metadata: { roles } } };
}
function identity(expiresAt, suffix = "one", roles = ["user"]) {
  return { provider: "supabase", providerUserId: userId, email: "person@example.test", roles, accessToken: `access.jwt.${suffix}`, refreshToken: `refresh-token-${suffix}-00000000`, expiresAt };
}
async function fixture(t, authProvider) {
  const root = await mkdtemp(resolve(tmpdir(), "luastra-provider-identity-"));
  let current = 1_000_000;
  let tokenSequence = 0;
  let nonceSequence = 0;
  const sessions = createProviderSessionStore({
    path: resolve(root, "sessions.sqlite"),
    encryptionKey: Buffer.from("0123456789abcdef0123456789abcdef"),
    now: () => current,
    randomToken: () => `opaque_${String(++tokenSequence).padStart(40, "0")}`,
    randomBytesImpl: (length) => Buffer.alloc(length, ++nonceSequence),
    randomId: () => "12345678-1234-4234-9234-123456789abc",
  });
  t.after(async () => { sessions.close(); await rm(root, { recursive: true, force: true }); });
  const completeAuthProvider = {
    async requestPasswordRecovery() { return true; },
    async updatePassword() { return true; },
    ...authProvider,
  };
  const service = createProviderIdentityService({ authProvider: completeAuthProvider, sessions, sessionTtlMs: 300_000, refreshWithinMs: 60_000, refreshLeaseMs: 10_000 });
  return { service, sessions, now: () => current, advance: (milliseconds) => { current += milliseconds; } };
}
async function code(promise, expected) {
  await assert.rejects(promise, (error) => error instanceof ProviderIdentityError && error.code === expected);
}

test("provider identity login returns only an opaque Luastra bearer and persists provider material behind the broker", async (t) => {
  const calls = [];
  const fx = await fixture(t, {
    async signInWithPassword(email, password) { calls.push({ email, password }); return identity(fx.now() + 120_000); },
    async refreshSession() { throw new Error("unexpected refresh"); },
    async signOut() { return true; },
  });
  const issued = await fx.service.signInWithPassword("person@example.test", "correct horse battery staple");
  assert.deepEqual(calls, [{ email: "person@example.test", password: "correct horse battery staple" }]);
  assert.equal(JSON.stringify(issued).includes("access.jwt"), false);
  assert.equal(JSON.stringify(issued).includes("refresh-token"), false);
  assert.equal(fx.service.resolve(issued.token).id, userId);
  assert.deepEqual(fx.service.resolveAuthorization(`Bearer ${issued.token}`).roles, ["user"]);
  const used = await fx.service.useProviderSession(issued.token, ({ accessToken, providerUserId }) => ({ accessToken, providerUserId }));
  assert.deepEqual(used, { accessToken: "access.jwt.one", providerUserId: userId });
});

test("provider identity exposes bounded recovery results without returning provider material", async (t) => {
  const observed = [];
  const fx = await fixture(t, {
    async requestPasswordRecovery(email, options) { observed.push({ operation: "request", email, redirectTo: options.redirectTo }); return true; },
    async updatePassword(token, password) { observed.push({ operation: "complete", token, password }); return true; },
    async signInWithPassword() { throw new Error("unexpected login"); },
    async refreshSession() { throw new Error("unexpected refresh"); },
    async signOut() { return true; },
  });
  assert.deepEqual(await fx.service.requestPasswordRecovery("person@example.test", { redirectTo: "https://luastra.dev/auth/recovery" }), { accepted: true });
  assert.deepEqual(await fx.service.completePasswordRecovery("provider-recovery-token", "new secure password"), { updated: true });
  assert.deepEqual(observed, [
    { operation: "request", email: "person@example.test", redirectTo: "https://luastra.dev/auth/recovery" },
    { operation: "complete", token: "provider-recovery-token", password: "new secure password" },
  ]);
});

test("provider identity refresh rotates material and authoritative app roles before the protected operation", async (t) => {
  let refreshToken;
  const fx = await fixture(t, {
    async signInWithPassword() { return identity(fx.now() + 20_000); },
    async refreshSession(value) { refreshToken = value; return identity(fx.now() + 180_000, "two", ["admin"]); },
    async signOut() { return true; },
  });
  const issued = await fx.service.signInWithPassword("person@example.test", "password");
  const access = await fx.service.useProviderSession(issued.token, ({ accessToken }) => accessToken);
  assert.equal(refreshToken, "refresh-token-one-00000000");
  assert.equal(access, "access.jwt.two");
  assert.deepEqual(fx.service.resolve(issued.token).roles, ["admin"]);
});

test("provider identity exposes a bounded retry state while another connection owns refresh", async (t) => {
  let release;
  let refreshStarted;
  const started = new Promise((resolveStarted) => { refreshStarted = resolveStarted; });
  const fx = await fixture(t, {
    async signInWithPassword() { return identity(fx.now() + 20_000); },
    async refreshSession() { refreshStarted(); return new Promise((resolveRefresh) => { release = resolveRefresh; }); },
    async signOut() { return true; },
  });
  const issued = await fx.service.signInWithPassword("person@example.test", "password");
  const winner = fx.service.useProviderSession(issued.token, ({ accessToken }) => accessToken);
  await started;
  await code(fx.service.useProviderSession(issued.token, () => true), "REFRESH_BUSY");
  release(identity(fx.now() + 180_000, "two"));
  assert.equal(await winner, "access.jwt.two");
});

test("provider identity revokes local state even when remote logout fails", async (t) => {
  const fx = await fixture(t, {
    async signInWithPassword() { return identity(fx.now() + 120_000); },
    async refreshSession() { throw new Error("unexpected refresh"); },
    async signOut() { throw new Error("upstream diagnostics must not escape"); },
  });
  const issued = await fx.service.signInWithPassword("person@example.test", "password");
  assert.deepEqual(await fx.service.signOut(issued.token), { revoked: true, providerRevoked: false });
  assert.equal(fx.service.resolve(issued.token), null);
  assert.deepEqual(await fx.service.signOut(issued.token), { revoked: false, providerRevoked: false });
});

test("provider identity maps login errors and revokes a refresh token rejected by the provider", async (t) => {
  let mode = "login";
  const fx = await fixture(t, {
    async signInWithPassword() {
      if (mode === "login") throw Object.assign(new Error("provider detail"), { code: "INVALID_CREDENTIALS" });
      return identity(fx.now() + 20_000);
    },
    async refreshSession() { throw Object.assign(new Error("provider detail"), { code: "UNAUTHORIZED" }); },
    async signOut() { return true; },
  });
  await code(fx.service.signInWithPassword("person@example.test", "wrong"), "INVALID_CREDENTIALS");
  mode = "issue";
  const issued = await fx.service.signInWithPassword("person@example.test", "right");
  await code(fx.service.useProviderSession(issued.token, () => true), "UNAUTHORIZED");
  assert.equal(fx.service.resolve(issued.token), null);
});

test("provider identity releases the lease after a malformed refresh response", async (t) => {
  let malformed = true;
  const fx = await fixture(t, {
    async signInWithPassword() { return identity(fx.now() + 20_000); },
    async refreshSession() { return malformed ? { ...identity(fx.now() + 180_000, "bad"), roles: ["INVALID ROLE"] } : identity(fx.now() + 180_000, "good"); },
    async signOut() { return true; },
  });
  const issued = await fx.service.signInWithPassword("person@example.test", "password");
  await code(fx.service.useProviderSession(issued.token, () => true), "UNAVAILABLE");
  malformed = false;
  assert.equal(await fx.service.useProviderSession(issued.token, ({ accessToken }) => accessToken), "access.jwt.good");
});

test("Supabase HTTP Auth, encrypted broker and provider identity service form one opaque vertical", async (t) => {
  const root = await mkdtemp(resolve(tmpdir(), "luastra-supabase-vertical-"));
  let current = 1_800_000_000_000;
  let tokenSequence = 0;
  let nonceSequence = 0;
  const calls = [];
  const authProvider = createSupabaseAuthProvider({
    url: supabaseUrl,
    publishableKey: "sb_publishable_0123456789abcdefghijklmnopqrstuvwxyz",
    now: () => current,
    async fetchImpl(url, options) {
      calls.push({ url: url.href, options });
      if (url.searchParams.get("grant_type") === "password") return new Response(JSON.stringify(supabaseSession(current, 120, "one")), { status: 200, headers: { "content-type": "application/json" } });
      if (url.searchParams.get("grant_type") === "refresh_token") return new Response(JSON.stringify(supabaseSession(current, 180, "two", ["admin"])), { status: 200, headers: { "content-type": "application/json" } });
      if (url.pathname.endsWith("/logout")) return new Response(null, { status: 204 });
      throw new Error("unexpected provider request");
    },
  });
  const sessions = createProviderSessionStore({
    path: resolve(root, "sessions.sqlite"),
    encryptionKey: Buffer.from("0123456789abcdef0123456789abcdef"),
    now: () => current,
    randomToken: () => `opaque_${String(++tokenSequence).padStart(40, "0")}`,
    randomBytesImpl: (length) => Buffer.alloc(length, ++nonceSequence),
    randomId: () => "12345678-1234-4234-9234-123456789abc",
  });
  t.after(async () => { sessions.close(); await rm(root, { recursive: true, force: true }); });
  const service = createProviderIdentityService({ authProvider, sessions, sessionTtlMs: 300_000, refreshWithinMs: 60_000 });
  const issued = await service.signInWithPassword("person@example.test", "correct horse battery staple");
  assert.equal(JSON.stringify(issued).includes("eyJ"), false, "provider JWT escaped through login result");
  current += 70_000;
  const used = await service.useProviderSession(issued.token, ({ accessToken }) => accessToken);
  assert.equal(used, jwt(current + 180_000, "two"));
  assert.deepEqual(service.resolve(issued.token).roles, ["admin"]);
  assert.deepEqual(await service.signOut(issued.token), { revoked: true, providerRevoked: true });
  assert.deepEqual(calls.map((call) => `${call.options.method} ${new URL(call.url).pathname}${new URL(call.url).search}`), [
    "POST /auth/v1/token?grant_type=password",
    "POST /auth/v1/token?grant_type=refresh_token",
    "POST /auth/v1/logout?scope=local",
  ]);
});
