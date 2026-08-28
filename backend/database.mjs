import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const collectionPattern = /^[a-z][a-z0-9_-]{0,63}$/;
const idPattern = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const maximumRecordsPerCollection = 1000;

function clone(value) { return structuredClone(value); }
function validRecord(value) { return value && typeof value === "object" && !Array.isArray(value) && idPattern.test(value.id ?? ""); }
function collection(value) {
  if (!collectionPattern.test(value)) throw new Error("invalid database collection");
  return value;
}
function record(value) {
  if (!validRecord(value)) throw new Error("invalid database record");
  return clone(value);
}

export function createMemoryDatabase() {
  const collections = new Map();
  const access = (name) => {
    if (!collectionPattern.test(name)) throw new Error("invalid database collection");
    if (!collections.has(name)) collections.set(name, new Map());
    return collections.get(name);
  };
  return Object.freeze({
    seed(name, records) {
      const collection = access(name);
      if (collection.size !== 0) return false;
      if (!Array.isArray(records) || records.length > maximumRecordsPerCollection || !records.every(validRecord)) throw new Error("invalid database seed");
      for (const record of records) {
        if (collection.has(record.id)) throw new Error("duplicate database seed ID");
        collection.set(record.id, clone(record));
      }
      return true;
    },
    list(name) { return [...access(name).values()].map(clone); },
    get(name, id) { const value = access(name).get(id); return value === undefined ? null : clone(value); },
    insert(name, record) {
      const collection = access(name);
      if (!validRecord(record) || collection.has(record.id) || collection.size >= maximumRecordsPerCollection) return false;
      collection.set(record.id, clone(record));
      return true;
    },
    update(name, id, next) {
      const collection = access(name);
      if (!collection.has(id) || !validRecord(next) || next.id !== id) return false;
      collection.set(id, clone(next));
      return true;
    },
    delete(name, id) { return access(name).delete(id); },
    clear() { collections.clear(); },
    close() {},
  });
}

export function createSqliteDatabase({ path }) {
  if (typeof path !== "string" || path.length === 0) throw new Error("SQLite database path is required");
  const databasePath = resolve(path);
  mkdirSync(dirname(databasePath), { recursive: true });
  const sqlite = new DatabaseSync(databasePath);
  sqlite.exec("PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; CREATE TABLE IF NOT EXISTS luastra_records (collection TEXT NOT NULL, id TEXT NOT NULL, value TEXT NOT NULL, PRIMARY KEY (collection, id));");
  const count = sqlite.prepare("SELECT COUNT(*) AS count FROM luastra_records WHERE collection = ?");
  const list = sqlite.prepare("SELECT value FROM luastra_records WHERE collection = ? ORDER BY rowid");
  const get = sqlite.prepare("SELECT value FROM luastra_records WHERE collection = ? AND id = ?");
  const insert = sqlite.prepare("INSERT INTO luastra_records (collection, id, value) VALUES (?, ?, ?)");
  const update = sqlite.prepare("UPDATE luastra_records SET value = ? WHERE collection = ? AND id = ?");
  const remove = sqlite.prepare("DELETE FROM luastra_records WHERE collection = ? AND id = ?");
  const clear = sqlite.prepare("DELETE FROM luastra_records");
  let closed = false;
  const open = () => { if (closed) throw new Error("database adapter is closed"); };
  const encode = (value) => JSON.stringify(record(value));
  const decode = (value) => {
    const parsed = JSON.parse(value);
    if (!validRecord(parsed)) throw new Error("persistent database contains an invalid record");
    return parsed;
  };
  return Object.freeze({
    seed(name, records) {
      open(); collection(name);
      if (!Array.isArray(records) || records.length > maximumRecordsPerCollection || !records.every(validRecord)) throw new Error("invalid database seed");
      if (Number(count.get(name).count) !== 0) return false;
      sqlite.exec("BEGIN IMMEDIATE");
      try {
        for (const value of records) insert.run(name, value.id, encode(value));
        sqlite.exec("COMMIT");
        return true;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
    list(name) { open(); collection(name); return list.all(name).map((row) => clone(decode(row.value))); },
    get(name, id) { open(); collection(name); if (!idPattern.test(id ?? "")) return null; const row = get.get(name, id); return row ? clone(decode(row.value)) : null; },
    insert(name, value) {
      open(); collection(name); const admitted = record(value);
      if (Number(count.get(name).count) >= maximumRecordsPerCollection || get.get(name, admitted.id)) return false;
      insert.run(name, admitted.id, JSON.stringify(admitted));
      return true;
    },
    update(name, id, next) {
      open(); collection(name); const admitted = record(next);
      if (admitted.id !== id || !get.get(name, id)) return false;
      return Number(update.run(JSON.stringify(admitted), name, id).changes) === 1;
    },
    delete(name, id) { open(); collection(name); if (!idPattern.test(id ?? "")) return false; return Number(remove.run(name, id).changes) === 1; },
    clear() { open(); clear.run(); },
    close() { if (!closed) { closed = true; sqlite.close(); } },
  });
}

export const databaseLimits = Object.freeze({ maximumRecordsPerCollection, sqliteJournalMode: "WAL" });
