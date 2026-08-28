const catalogue = Object.freeze([
  Object.freeze({ id: "breathing-space", title: "Breathing space", description: "A short, open breathing practice.", durationMs: 8000, locked: false, contentId: "audio/focus" }),
  Object.freeze({ id: "evening-rest", title: "Evening rest", description: "A gentle members-only wind-down.", durationMs: 6000, locked: true, contentId: "audio/rest" }),
]);
const entitlements = new Map([["demo-user", new Set(["evening-rest"])]]);

function item(id, context) {
  const found = catalogue.find((candidate) => candidate.id === id);
  if (!found) context.reject("VALIDATION", "Unknown meditation");
  return found;
}
function allowed(meditation, principalId) {
  return !meditation.locked || (typeof principalId === "string" && entitlements.get(principalId)?.has(meditation.id) === true);
}
function preferenceId(principalId, meditationId) { return `${principalId}_${meditationId}`; }

export function createHandlers({ database, identity }) {
  if (!database) throw new Error("meditation backend requires a database adapter");
  identity?.seedPasswordUser?.({
    id: "demo-user",
    email: "demo@luastra.dev",
    name: "Demo member",
    roles: ["user"],
    salt: "4b6d1f3abbe6d411cd771467b5aa43a7",
    passwordHash: "7e6a85adc0fb69733c06554499249d9aca4e9f81bd66c91c5e9518daa9c2adb95d928ba9d4dc22dd1e5a8230d1973b51e3391788b096d4e25b6ac559611cbfdd",
  });
  return Object.freeze({
    async "auth.login.v1"(input, context) {
      if (!context.identity) throw new Error("identity service is unavailable");
      return context.identity.signInWithPassword(input.email, input.password);
    },
    async "auth.logout.v1"(_input, context) {
      if (!context.identity) throw new Error("identity service is unavailable");
      const result = await context.identity.signOutCurrent();
      return { revoked: result.revoked === true };
    },
    async "auth.session.v1"(_input, context) {
      if (!context.principal) context.reject("UNAUTHORIZED", "Session is not available");
      return { userName: context.principal.name ?? context.principal.id, expiresAt: context.principal.expiresAt };
    },
    async "catalog.list.v1"(_input, context) {
      const principalId = context.principal?.id;
      return { meditations: catalogue.map((meditation) => {
        const preference = principalId ? database.get("preferences", preferenceId(principalId, meditation.id)) : null;
        return { id: meditation.id, title: meditation.title, description: meditation.description, durationMs: meditation.durationMs, locked: meditation.locked, accessible: allowed(meditation, principalId), favorite: preference?.favorite === true };
      }) };
    },
    async "content.access.v1"(input, context) {
      const meditation = item(input.meditationId, context);
      if (!allowed(meditation, context.principal?.id)) context.reject("FORBIDDEN", "This meditation requires an entitlement");
      if (!context.content) throw new Error("protected content service is unavailable");
      const progress = context.principal?.id ? database.get("progress", preferenceId(context.principal.id, meditation.id)) : null;
      const grant = context.content.issue(meditation.contentId, { ttlMs: 60 * 1000 });
      return { itemId: meditation.id, source: grant.source, title: meditation.title, artist: "Luastra reference", resumePositionMs: progress?.positionMs ?? 0, downloadAllowed: false };
    },
    async "library.favorite.v1"(input, context) {
      item(input.meditationId, context);
      const id = preferenceId(context.principal.id, input.meditationId);
      const record = { id, ownerId: context.principal.id, meditationId: input.meditationId, favorite: input.favorite };
      if (database.get("preferences", id)) database.update("preferences", id, record);
      else if (!database.insert("preferences", record)) throw new Error("preference insert failed");
      return { meditationId: input.meditationId, favorite: input.favorite };
    },
    async "progress.save.v1"(input, context) {
      const meditation = item(input.meditationId, context);
      if (!allowed(meditation, context.principal.id)) context.reject("FORBIDDEN", "This meditation requires an entitlement");
      if (!Number.isSafeInteger(input.positionMs) || input.positionMs < 0 || input.positionMs > meditation.durationMs) context.reject("VALIDATION", "Invalid playback position");
      const id = preferenceId(context.principal.id, meditation.id);
      const record = { id, ownerId: context.principal.id, meditationId: meditation.id, positionMs: input.positionMs };
      if (database.get("progress", id)) database.update("progress", id, record);
      else if (!database.insert("progress", record)) throw new Error("progress insert failed");
      return { meditationId: meditation.id, positionMs: input.positionMs };
    }
  });
}
