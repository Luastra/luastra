import { existsSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

import { createProviderIdentityService } from "./provider-identity.mjs";
import { createProviderSessionStore } from "./provider-session.mjs";
import { createSupabaseAuthProvider } from "./providers/supabase-http.mjs";

const keyPattern = /^[A-Za-z0-9_-]{43}$/;
const environmentNames = Object.freeze({
  url: "LUASTRA_SUPABASE_URL",
  publishableKey: "LUASTRA_SUPABASE_PUBLISHABLE_KEY",
  sessionEncryptionKey: "LUASTRA_SESSION_ENCRYPTION_KEY_B64URL",
});

function required(environment, name) {
  const value = environment?.[name];
  if (typeof value !== "string" || value.length === 0 || value !== value.trim()) throw new Error(`required backend environment variable is missing or invalid: ${name}`);
  return value;
}
function encryptionKey(value) {
  if (!keyPattern.test(value)) throw new Error(`required backend environment variable is invalid: ${environmentNames.sessionEncryptionKey}`);
  const decoded = Buffer.from(value, "base64url");
  if (decoded.byteLength !== 32 || decoded.toString("base64url") !== value) throw new Error(`required backend environment variable is invalid: ${environmentNames.sessionEncryptionKey}`);
  return decoded;
}
function managedSessionPath(projectRoot) {
  const root = realpathSync(projectRoot);
  const target = resolve(root, ".luastra/data/provider-sessions.sqlite");
  let existing = dirname(target);
  while (!existsSync(existing)) {
    const parent = dirname(existing);
    if (parent === existing) throw new Error("provider session parent is unavailable");
    existing = parent;
  }
  const fromRoot = relative(root, realpathSync(existing));
  if (fromRoot === ".." || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) throw new Error("provider session parent resolves outside the project");
  return target;
}

export function readSupabaseIdentityEnvironment(environment = process.env) {
  const url = required(environment, environmentNames.url);
  const publishableKey = required(environment, environmentNames.publishableKey);
  const key = encryptionKey(required(environment, environmentNames.sessionEncryptionKey));
  return { url, publishableKey, encryptionKey: key };
}

export function createSupabaseIdentityBoundary({ projectRoot, environment = process.env, fetchImpl = globalThis.fetch, now = () => Date.now() } = {}) {
  if (typeof projectRoot !== "string" || projectRoot.length === 0) throw new Error("Supabase identity requires a project root");
  const configuration = readSupabaseIdentityEnvironment(environment);
  let sessions;
  try {
    const authProvider = createSupabaseAuthProvider({ url: configuration.url, publishableKey: configuration.publishableKey, fetchImpl, now });
    sessions = createProviderSessionStore({ path: managedSessionPath(projectRoot), encryptionKey: configuration.encryptionKey, now });
    const identity = createProviderIdentityService({ authProvider, sessions });
    return Object.freeze({ sessions, identity, close() { sessions.close(); } });
  } catch (error) {
    sessions?.close();
    throw error;
  } finally {
    configuration.encryptionKey.fill(0);
  }
}

export const supabaseIdentityEnvironment = environmentNames;
