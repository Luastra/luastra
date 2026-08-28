const maximumTtlMs = 30 * 24 * 60 * 60 * 1000;

export class LocalIdentityServiceError extends Error {
  constructor(code, message) {
    super(message);
    if (code !== "INVALID_CREDENTIALS") throw new Error("invalid local identity service error");
    this.name = "LocalIdentityServiceError";
    this.code = code;
  }
}

export function createLocalIdentityService({ identity, sessions, sessionTtlMs = 24 * 60 * 60 * 1000 } = {}) {
  if (typeof identity?.verifyPassword !== "function" || typeof sessions?.issue !== "function" || typeof sessions?.revoke !== "function" || !Number.isSafeInteger(sessionTtlMs) || sessionTtlMs < 1000 || sessionTtlMs > maximumTtlMs) throw new Error("invalid local identity service configuration");
  return Object.freeze({
    async signInWithPassword(email, password) {
      const user = identity.verifyPassword(email, password);
      if (!user) throw new LocalIdentityServiceError("INVALID_CREDENTIALS", "Invalid credentials");
      const issued = sessions.issue({ id: user.id, name: user.name, roles: user.roles }, { ttlMs: sessionTtlMs });
      return Object.freeze({ ...issued, userName: user.name });
    },
    async signOutCurrent(sessionId) { return Object.freeze({ revoked: sessions.revoke(sessionId), providerRevoked: true }); },
  });
}
