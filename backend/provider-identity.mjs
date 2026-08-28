const publicCodes = new Set(["CANCELLED", "CONFIGURATION", "INVALID_CREDENTIALS", "RATE_LIMITED", "REFRESH_BUSY", "UNAUTHORIZED", "UNAVAILABLE", "VALIDATION"]);

function fail(code, message) { throw new ProviderIdentityError(code, message); }
function method(value, name) { if (typeof value?.[name] !== "function") fail("CONFIGURATION", `Provider identity requires ${name}`); }
function providerMaterial(value) {
  if (!value || typeof value !== "object" || typeof value.provider !== "string" || typeof value.providerUserId !== "string" || !Array.isArray(value.roles) || typeof value.accessToken !== "string" || typeof value.refreshToken !== "string" || !Number.isSafeInteger(value.expiresAt)) fail("UNAVAILABLE", "Identity provider returned an invalid session");
  return { provider: value.provider, providerUserId: value.providerUserId, accessToken: value.accessToken, refreshToken: value.refreshToken, expiresAt: value.expiresAt };
}
function mapped(error) {
  const code = error?.code;
  if (code === "INVALID_CREDENTIALS") return new ProviderIdentityError("INVALID_CREDENTIALS", "Invalid credentials");
  if (code === "RATE_LIMITED") return new ProviderIdentityError("RATE_LIMITED", "Authentication is temporarily rate limited");
  if (code === "CANCELLED") return new ProviderIdentityError("CANCELLED", "Authentication was cancelled");
  if (code === "VALIDATION") return new ProviderIdentityError("VALIDATION", "Authentication input was rejected");
  if (["UNAUTHORIZED", "FORBIDDEN"].includes(code)) return new ProviderIdentityError("UNAUTHORIZED", "Provider session is no longer authorized");
  return new ProviderIdentityError("UNAVAILABLE", "Identity provider is unavailable");
}

export class ProviderIdentityError extends Error {
  constructor(code, message) {
    super(message);
    if (!publicCodes.has(code)) throw new Error("invalid provider identity error");
    this.name = "ProviderIdentityError";
    this.code = code;
  }
}

export function createProviderIdentityService({ authProvider, sessions, sessionTtlMs = 30 * 24 * 60 * 60 * 1000, refreshWithinMs = 60_000, refreshLeaseMs = 15_000 } = {}) {
  for (const name of ["signInWithPassword", "refreshSession", "requestPasswordRecovery", "updatePassword", "signOut"]) method(authProvider, name);
  for (const name of ["issue", "resolve", "resolveAuthorization", "readProvider", "readProviderSession", "beginRefresh", "completeRefresh", "abortRefresh", "revoke"]) method(sessions, name);
  if (!Number.isSafeInteger(sessionTtlMs) || sessionTtlMs < 1000 || sessionTtlMs > 90 * 24 * 60 * 60 * 1000 || !Number.isSafeInteger(refreshWithinMs) || refreshWithinMs < 0 || refreshWithinMs > 60 * 60 * 1000 || !Number.isSafeInteger(refreshLeaseMs) || refreshLeaseMs < 1000 || refreshLeaseMs > 60_000) fail("CONFIGURATION", "Provider identity timing is invalid");
  return Object.freeze({
    async requestPasswordRecovery(email, { redirectTo = null, signal = null } = {}) {
      try { await authProvider.requestPasswordRecovery(email, { redirectTo, signal }); return Object.freeze({ accepted: true }); }
      catch (error) { throw mapped(error); }
    },
    async completePasswordRecovery(recoveryAccessToken, password, { signal = null } = {}) {
      try { await authProvider.updatePassword(recoveryAccessToken, password, { signal }); return Object.freeze({ updated: true }); }
      catch (error) { throw mapped(error); }
    },
    async signInWithPassword(email, password, { signal = null } = {}) {
      let identity;
      try { identity = await authProvider.signInWithPassword(email, password, { signal }); }
      catch (error) { throw mapped(error); }
      const material = providerMaterial(identity);
      try {
        const issued = sessions.issue({ id: identity.providerUserId, name: identity.name ?? identity.email, roles: identity.roles }, material, { ttlMs: sessionTtlMs });
        return Object.freeze({ ...issued, userName: identity.name ?? identity.email });
      } catch { fail("UNAVAILABLE", "Provider session could not be persisted"); }
    },
    resolve(token) { return sessions.resolve(token); },
    resolveAuthorization(header) { return sessions.resolveAuthorization(header); },
    async useProviderSession(token, operation, { signal = null } = {}) {
      if (typeof operation !== "function") fail("VALIDATION", "Provider session operation is required");
      let refresh;
      try { refresh = sessions.beginRefresh(token, { refreshWithinMs, leaseMs: refreshLeaseMs }); }
      catch {
        const owner = sessions.resolve(token);
        if (owner) sessions.revoke(owner.session);
        fail("UNAVAILABLE", "Provider session could not be read");
      }
      if (refresh.state === "invalid") fail("UNAUTHORIZED", "Luastra session is invalid or expired");
      if (refresh.state === "busy") fail("REFRESH_BUSY", "Provider session refresh is already in progress");
      let material = refresh.provider;
      if (refresh.state === "acquired") {
        let identity;
        try { identity = await authProvider.refreshSession(material.refreshToken, { signal }); }
        catch (error) {
          sessions.abortRefresh(material.sessionId, refresh.lease);
          const exposed = mapped(error);
          if (exposed.code === "UNAUTHORIZED") sessions.revoke(material.sessionId);
          throw exposed;
        }
        let committed;
        try {
          const next = providerMaterial(identity);
          committed = sessions.completeRefresh(material.sessionId, refresh.lease, next, { principal: { id: identity.providerUserId, name: identity.name ?? identity.email, roles: identity.roles } });
        }
        catch { sessions.abortRefresh(material.sessionId, refresh.lease); fail("UNAVAILABLE", "Provider session rotation was rejected"); }
        if (!committed) fail("REFRESH_BUSY", "Provider session rotation lost its lease");
        material = sessions.readProvider(token);
        if (!material) fail("UNAUTHORIZED", "Luastra session was revoked during refresh");
      }
      return operation(Object.freeze({ provider: material.provider, providerUserId: material.providerUserId, accessToken: material.accessToken, expiresAt: material.expiresAt }), { signal });
    },
    async signOut(token, { signal = null } = {}) {
      const owner = sessions.resolve(token);
      if (!owner) return Object.freeze({ revoked: false, providerRevoked: false });
      let material;
      try { material = sessions.readProvider(token); }
      catch { return Object.freeze({ revoked: sessions.revoke(owner.session), providerRevoked: false }); }
      if (!material) return Object.freeze({ revoked: sessions.revoke(owner.session), providerRevoked: false });
      let providerRevoked = false;
      try { providerRevoked = await authProvider.signOut(material.accessToken, { signal }) === true; }
      catch { providerRevoked = false; }
      const revoked = sessions.revoke(owner.session);
      return Object.freeze({ revoked, providerRevoked });
    },
    async signOutCurrent(sessionId, { signal = null } = {}) {
      let material;
      try { material = sessions.readProviderSession(sessionId); }
      catch { return Object.freeze({ revoked: sessions.revoke(sessionId), providerRevoked: false }); }
      if (!material) return Object.freeze({ revoked: false, providerRevoked: false });
      let providerRevoked = false;
      try { providerRevoked = await authProvider.signOut(material.accessToken, { signal }) === true; }
      catch { providerRevoked = false; }
      return Object.freeze({ revoked: sessions.revoke(sessionId), providerRevoked });
    },
  });
}
