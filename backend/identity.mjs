import { scryptSync, timingSafeEqual } from "node:crypto";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const idPattern = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/;
const rolePattern = /^[a-z][a-z0-9_-]{0,31}$/;
const hexPattern = /^[0-9a-f]+$/;
const passwordMaximumBytes = 1024;
const encoder = new TextEncoder();
const scryptOptions = Object.freeze({ N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
const dummySalt = Buffer.from("d9f743f4c32e9243f1fc6f599c939436", "hex");
const dummyHash = scryptSync("luastra-invalid-password", dummySalt, 64, scryptOptions);

function canonicalEmail(value) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && emailPattern.test(email) ? email : null;
}
function publicUser(record) { return Object.freeze({ id: record.id, email: record.email, name: record.name, roles: Object.freeze([...record.roles]) }); }

export function createLocalPasswordIdentity({ database }) {
  if (!database || typeof database.list !== "function" || typeof database.insert !== "function") throw new Error("local identity requires a database adapter");
  const users = () => database.list("identity_users");
  return Object.freeze({
    seedPasswordUser(value) {
      const email = canonicalEmail(value?.email);
      if (!value || !idPattern.test(value.id ?? "") || !email || typeof value.name !== "string" || value.name.length < 1 || value.name.length > 128 || !Array.isArray(value.roles) || value.roles.length < 1 || value.roles.length > 8 || !value.roles.every((role) => rolePattern.test(role)) || typeof value.salt !== "string" || value.salt.length !== 32 || !hexPattern.test(value.salt) || typeof value.passwordHash !== "string" || value.passwordHash.length !== 128 || !hexPattern.test(value.passwordHash)) {
        throw new Error("invalid local identity seed");
      }
      if (users().some((user) => user.id === value.id || user.email === email)) return false;
      return database.insert("identity_users", { id: value.id, email, name: value.name, roles: [...new Set(value.roles)], salt: value.salt, passwordHash: value.passwordHash });
    },
    verifyPassword(emailValue, password) {
      const email = canonicalEmail(emailValue);
      const validPassword = typeof password === "string" && password.length > 0 && encoder.encode(password).byteLength <= passwordMaximumBytes;
      const record = email ? users().find((user) => user.email === email) ?? null : null;
      const salt = record ? Buffer.from(record.salt, "hex") : dummySalt;
      const expected = record ? Buffer.from(record.passwordHash, "hex") : dummyHash;
      const actual = scryptSync(validPassword ? password : "luastra-invalid-password", salt, 64, scryptOptions);
      return validPassword && record && timingSafeEqual(actual, expected) ? publicUser(record) : null;
    },
  });
}

export const localIdentityPolicy = Object.freeze({ algorithm: "scrypt", N: scryptOptions.N, r: scryptOptions.r, p: scryptOptions.p, passwordMaximumBytes });
