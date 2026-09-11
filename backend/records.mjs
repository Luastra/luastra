const encoder = new TextEncoder();
const collectionPattern = /^[a-z][a-z0-9_-]{0,63}$/;
const tablePattern = /^[a-z][a-z0-9_]{0,62}[a-z0-9]$/;
const fieldPattern = /^[a-z][A-Za-z0-9_]{0,63}$/;
const sortPattern = /^[a-z][A-Za-z0-9_-]{0,63}$/;
const idPattern = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const principalPattern = /^[A-Za-z0-9][A-Za-z0-9_.:@-]{0,255}$/;
const dangerousKeys = new Set(["__proto__", "constructor", "prototype"]);
const publicCodes = new Set(["CANCELLED", "FORBIDDEN", "NETWORK", "UNAUTHORIZED", "VALIDATION"]);
const defaultMaximumLimit = 50;
const absoluteMaximumLimit = 128;
const maximumCursorBytes = 2048;

function bytes(value) { return encoder.encode(value).byteLength; }
function object(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function scalar(value) { return typeof value === "string" || typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value)); }
function clone(value) { return structuredClone(value); }
function exact(value, admitted) { return object(value) && Object.keys(value).every((key) => admitted.has(key)); }
function compareName(left, right) { return left < right ? -1 : left > right ? 1 : 0; }
function validField(value) { return typeof value === "string" && fieldPattern.test(value) && !dangerousKeys.has(value); }
function validJson(value, depth = 0) {
  if (depth > 12) return false;
  if (value === null || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") return bytes(value) <= 4096;
  if (Array.isArray(value)) return value.length <= 128 && value.every((item) => validJson(item, depth + 1));
  if (!object(value) || Object.keys(value).length > 64) return false;
  return Object.entries(value).every(([key, item]) => fieldPattern.test(key) && !dangerousKeys.has(key) && validJson(item, depth + 1));
}
function admittedRecord(value, code = "VALIDATION") {
  if (!object(value) || !idPattern.test(value.id ?? "") || !validJson(value)) throw new RecordProviderError(code, code === "VALIDATION" ? "Invalid record" : "Record provider returned an invalid record");
  return Object.freeze(clone(value));
}
function admittedPrincipal(value) {
  if (value === null) return null;
  if (!object(value) || !principalPattern.test(value.id ?? "") || !Array.isArray(value.roles) || value.roles.length > 8 || !value.roles.every((role) => typeof role === "string" && /^[a-z][a-z0-9_-]{0,31}$/.test(role))) throw new RecordProviderError("UNAUTHORIZED", "Authentication required");
  return Object.freeze({ ...value, roles: Object.freeze([...new Set(value.roles)]) });
}
function mapped(error) {
  if (error instanceof RecordProviderError) return error;
  if (error?.code === "CANCELLED") return new RecordProviderError("CANCELLED", "Record operation was cancelled");
  if (error?.code === "UNAUTHORIZED" || error?.code === "INVALID_CREDENTIALS") return new RecordProviderError("UNAUTHORIZED", "Record operation is unauthorized");
  if (error?.code === "FORBIDDEN") return new RecordProviderError("FORBIDDEN", "Record is not available");
  if (error?.code === "VALIDATION") return new RecordProviderError("VALIDATION", "Record operation is invalid");
  return new RecordProviderError("NETWORK", "Record provider is unavailable");
}
function method(value, name) {
  if (typeof value?.[name] !== "function") throw new Error(`record provider requires ${name}`);
}
function compareScalar(left, right) {
  if (typeof left !== typeof right || !scalar(left) || !scalar(right)) throw new RecordProviderError("NETWORK", "Record provider returned invalid sort values");
  if (left === right) return 0;
  return left < right ? -1 : 1;
}
function compareRecord(left, right, order) {
  for (const item of order) {
    const compared = compareScalar(left[item.field], right[item.field]);
    if (compared !== 0) return item.direction === "asc" ? compared : -compared;
  }
  return 0;
}
function compareBoundary(record, boundary, order) {
  for (let index = 0; index < order.length; index += 1) {
    const compared = compareScalar(record[order[index].field], boundary[index]);
    if (compared !== 0) return order[index].direction === "asc" ? compared : -compared;
  }
  return 0;
}
function cursorEnvelope(value) {
  const text = JSON.stringify(value);
  if (bytes(text) > maximumCursorBytes) throw new Error("record cursor exceeds its size limit");
  return Buffer.from(text, "utf8").toString("base64url");
}
function decodeCursor(value) {
  if (typeof value !== "string" || value.length < 1 || value.length > Math.ceil(maximumCursorBytes * 4 / 3) || !/^[A-Za-z0-9_-]+$/.test(value)) throw new RecordProviderError("VALIDATION", "Invalid record cursor");
  try {
    const bytesValue = Buffer.from(value, "base64url");
    if (bytesValue.byteLength < 1 || bytesValue.byteLength > maximumCursorBytes || bytesValue.toString("base64url") !== value) throw new Error("non-canonical cursor");
    const decoded = JSON.parse(bytesValue.toString("utf8"));
    if (!exact(decoded, new Set(["version", "collection", "sort", "equality", "boundary"])) || decoded.version !== 1 || !collectionPattern.test(decoded.collection ?? "") || !sortPattern.test(decoded.sort ?? "") || !object(decoded.equality) || !Array.isArray(decoded.boundary) || !decoded.boundary.every(scalar)) throw new Error("invalid cursor");
    return decoded;
  } catch (error) {
    if (error instanceof RecordProviderError) throw error;
    throw new RecordProviderError("VALIDATION", "Invalid record cursor");
  }
}
function normalizedConfiguration(configuration) {
  if (!object(configuration) || !collectionPattern.test(configuration.collection ?? "")) throw new Error("record collection configuration is invalid");
  const maximumLimit = configuration.maximumLimit ?? defaultMaximumLimit;
  if (!Number.isSafeInteger(maximumLimit) || maximumLimit < 1 || maximumLimit > absoluteMaximumLimit) throw new Error("record collection maximumLimit is invalid");
  const equalityFields = configuration.equalityFields ?? [];
  if (!Array.isArray(equalityFields) || equalityFields.length > 16 || new Set(equalityFields).size !== equalityFields.length || !equalityFields.every(validField)) throw new Error("record equalityFields are invalid");
  const mutableFields = configuration.mutableFields ?? [];
  if (!Array.isArray(mutableFields) || mutableFields.length > 64 || new Set(mutableFields).size !== mutableFields.length || mutableFields.includes("id") || !mutableFields.every(validField)) throw new Error("record mutableFields are invalid");
  const insertFields = configuration.insertFields ?? ["id", ...mutableFields];
  if (!Array.isArray(insertFields) || insertFields.length < 1 || insertFields.length > 64 || !insertFields.includes("id") || new Set(insertFields).size !== insertFields.length || !insertFields.every(validField)) throw new Error("record insertFields are invalid");
  if (!object(configuration.sorts) || Object.keys(configuration.sorts).length < 1 || Object.keys(configuration.sorts).length > 16) throw new Error("record sorts are invalid");
  const sorts = {};
  for (const [name, order] of Object.entries(configuration.sorts).sort(([left], [right]) => compareName(left, right))) {
    if (!sortPattern.test(name) || !Array.isArray(order) || order.length < 1 || order.length > 4 || new Set(order.map((item) => item?.field)).size !== order.length || !order.every((item) => exact(item, new Set(["field", "direction"])) && validField(item.field) && ["asc", "desc"].includes(item.direction))) throw new Error("record sort is invalid");
    if (order.at(-1).field !== "id") throw new Error("record sort must end with the id tie-breaker");
    sorts[name] = Object.freeze(order.map((item) => Object.freeze({ ...item })));
  }
  const defaultSort = configuration.defaultSort ?? Object.keys(sorts)[0];
  if (!Object.hasOwn(sorts, defaultSort)) throw new Error("record defaultSort is invalid");
  return Object.freeze({ collection: configuration.collection, maximumLimit, equalityFields: Object.freeze([...equalityFields]), mutableFields: Object.freeze([...mutableFields]), insertFields: Object.freeze([...insertFields]), sorts: Object.freeze(sorts), defaultSort });
}

function normalizedLocalAuthorization(value, configuration) {
  if (!object(value) || !["public", "authenticated", "owner"].includes(value.mode)) throw new Error("local record authorization is invalid");
  if (value.mode === "owner") {
    if (!exact(value, new Set(["mode", "field"])) || !validField(value.field) || !configuration.insertFields.includes(value.field) || configuration.mutableFields.includes(value.field)) {
      throw new Error("local owner authorization field must be inserted and immutable");
    }
    return Object.freeze({ mode: "owner", field: value.field });
  }
  if (!exact(value, new Set(["mode"]))) throw new Error("local record authorization is invalid");
  return Object.freeze({ mode: value.mode });
}

export function normalizeRecordDeclarations(value, { identityProvider = "none" } = {}) {
  if (value === undefined) return null;
  if (!object(value) || Object.keys(value).length < 1 || Object.keys(value).length > 32) throw new Error("backend.records must contain 1 to 32 collections");
  if (!new Set(["none", "local-password", "supabase"]).has(identityProvider)) throw new Error("record identity provider is invalid");
  const declarations = {};
  const allowed = new Set(["provider", "table", "authorization", "equalityFields", "mutableFields", "insertFields", "sorts", "defaultSort", "maximumLimit"]);
  for (const [name, definition] of Object.entries(value).sort(([left], [right]) => compareName(left, right))) {
    if (!collectionPattern.test(name) || !object(definition) || !exact(definition, allowed) || !["local", "supabase"].includes(definition.provider)) throw new Error(`backend.records.${name} is invalid`);
    const configured = normalizedConfiguration({
      collection: name,
      equalityFields: definition.equalityFields,
      mutableFields: definition.mutableFields,
      insertFields: definition.insertFields,
      sorts: definition.sorts ?? { byId: [{ field: "id", direction: "asc" }] },
      defaultSort: definition.defaultSort,
      maximumLimit: definition.maximumLimit,
    });
    const common = {
      equalityFields: configured.equalityFields,
      mutableFields: configured.mutableFields,
      insertFields: configured.insertFields,
      sorts: configured.sorts,
      defaultSort: configured.defaultSort,
      maximumLimit: configured.maximumLimit,
    };
    if (definition.provider === "local") {
      if (definition.table !== undefined) throw new Error(`backend.records.${name}.table is only available for supabase`);
      declarations[name] = Object.freeze({ provider: "local", authorization: normalizedLocalAuthorization(definition.authorization, configured), ...common });
      continue;
    }
    if (identityProvider !== "supabase") throw new Error(`backend.records.${name} requires backend.identity.provider to be supabase`);
    if (definition.authorization !== undefined || !tablePattern.test(definition.table ?? "")) throw new Error(`backend.records.${name} must use a valid Supabase table and database RLS`);
    declarations[name] = Object.freeze({ provider: "supabase", table: definition.table, ...common });
  }
  return Object.freeze(declarations);
}

function localAuthorization(configuration) {
  if (configuration.mode === "public") return () => true;
  if (configuration.mode === "authenticated") return (_action, principal) => principal !== null;
  return (_action, principal, record) => principal !== null && record[configuration.field] === principal.id;
}

export function createDeclaredRecordCollections({ declarations, database, identityProvider = "none", createSupabaseRecordCollection = null } = {}) {
  const admitted = normalizeRecordDeclarations(declarations, { identityProvider });
  if (admitted === null) return null;
  const collections = {};
  for (const [name, definition] of Object.entries(admitted)) {
    const { provider: providerName, table, authorization, ...configuration } = definition;
    if (providerName === "local") {
      const provider = createLocalRecordProvider({ database, collection: name, authorize: localAuthorization(authorization) });
      collections[name] = createRecordCollection({ provider, collection: name, ...configuration });
      continue;
    }
    if (typeof createSupabaseRecordCollection !== "function") throw new Error("Supabase record declarations require the managed Supabase constructor");
    collections[name] = createSupabaseRecordCollection({ collection: name, table, ...configuration });
  }
  return Object.freeze(collections);
}

function normalizedQuery(value, configuration) {
  const query = value ?? {};
  if (!exact(query, new Set(["cursor", "direction", "equal", "limit", "sort"]))) throw new RecordProviderError("VALIDATION", "Invalid record query");
  const limit = query.limit ?? configuration.maximumLimit;
  const direction = query.direction ?? "forward";
  const sort = query.sort ?? configuration.defaultSort;
  const equality = query.equal ?? {};
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > configuration.maximumLimit || !["forward", "backward"].includes(direction) || !Object.hasOwn(configuration.sorts, sort) || !object(equality)) throw new RecordProviderError("VALIDATION", "Invalid record query");
  const allowedEquality = new Set(configuration.equalityFields);
  if (Object.entries(equality).some(([field, value]) => !allowedEquality.has(field) || !scalar(value))) throw new RecordProviderError("VALIDATION", "Invalid record equality filter");
  const canonicalEquality = Object.fromEntries(Object.keys(equality).sort().map((field) => [field, equality[field]]));
  let boundary = null;
  if (query.cursor !== undefined && query.cursor !== null) {
    const decoded = decodeCursor(query.cursor);
    if (decoded.collection !== configuration.collection || decoded.sort !== sort || JSON.stringify(decoded.equality) !== JSON.stringify(canonicalEquality) || decoded.boundary.length !== configuration.sorts[sort].length) throw new RecordProviderError("VALIDATION", "Record cursor does not match the query");
    boundary = decoded.boundary;
  }
  return Object.freeze({ limit, direction, sort, equality: Object.freeze(canonicalEquality), order: configuration.sorts[sort], boundary: boundary === null ? null : Object.freeze([...boundary]) });
}
function cursorFor(record, query, configuration) {
  const boundary = query.order.map((item) => record[item.field]);
  if (!boundary.every(scalar)) throw new RecordProviderError("NETWORK", "Record provider returned an invalid cursor field");
  return cursorEnvelope({ version: 1, collection: configuration.collection, sort: query.sort, equality: query.equality, boundary });
}
function admittedFields(value, fields, { patch = false } = {}) {
  if (!object(value) || Object.keys(value).length > 64 || Object.keys(value).some((field) => !fields.includes(field)) || (!patch && !fields.every((field) => Object.hasOwn(value, field))) || Object.values(value).some((item) => !validJson(item))) throw new RecordProviderError("VALIDATION", patch ? "Invalid record patch" : "Invalid record");
  if (patch && Object.keys(value).length === 0) throw new RecordProviderError("VALIDATION", "Record patch is empty");
  return Object.freeze(clone(value));
}

export class RecordProviderError extends Error {
  constructor(code, message) {
    super(message);
    if (!publicCodes.has(code) || typeof message !== "string" || message.length < 1 || bytes(message) > 512) throw new Error("invalid public record provider error");
    this.name = "RecordProviderError";
    this.code = code;
  }
}

export function createRecordCollection({ provider, ...configurationValue } = {}) {
  for (const name of ["list", "get", "insert", "update", "delete"]) method(provider, name);
  const configuration = normalizedConfiguration(configurationValue);
  const invoke = async (name, args) => {
    try { return await provider[name](...args); }
    catch (error) { throw mapped(error); }
  };
  return Object.freeze({
    async list(queryValue, principalValue, { signal = null } = {}) {
      const principal = admittedPrincipal(principalValue);
      const query = normalizedQuery(queryValue, configuration);
      const result = await invoke("list", [query, principal, { signal }]);
      if (!object(result) || !Array.isArray(result.items) || result.items.length > query.limit + 1 || typeof result.hasMore !== "boolean") throw new RecordProviderError("NETWORK", "Record provider returned an invalid page");
      let received;
      try { received = result.items.map((item) => admittedRecord(item, "NETWORK")); }
      catch (error) { throw mapped(error); }
      if ((received.length > query.limit) !== result.hasMore || received.some((item, index) => index > 0 && compareRecord(received[index - 1], item, query.order) >= 0)) throw new RecordProviderError("NETWORK", "Record provider returned an invalid page");
      let items = received;
      let hasPrevious = query.boundary !== null;
      let hasNext = query.boundary !== null;
      if (query.direction === "forward") {
        hasNext = result.hasMore;
        if (items.length > query.limit) items = items.slice(0, query.limit);
      } else {
        hasPrevious = result.hasMore;
        if (items.length > query.limit) items = items.slice(items.length - query.limit);
      }
      return Object.freeze({
        items: Object.freeze(items),
        previousCursor: hasPrevious && items.length > 0 ? cursorFor(items[0], query, configuration) : null,
        nextCursor: hasNext && items.length > 0 ? cursorFor(items.at(-1), query, configuration) : null,
      });
    },
    async get(id, principalValue, { signal = null } = {}) {
      if (!idPattern.test(id ?? "")) throw new RecordProviderError("VALIDATION", "Invalid record ID");
      const value = await invoke("get", [id, admittedPrincipal(principalValue), { signal }]);
      return value === null ? null : admittedRecord(value, "NETWORK");
    },
    async insert(value, principalValue, { signal = null } = {}) {
      const admitted = admittedRecord(admittedFields(value, configuration.insertFields));
      return admittedRecord(await invoke("insert", [admitted, admittedPrincipal(principalValue), { signal }]), "NETWORK");
    },
    async update(id, patch, principalValue, { signal = null } = {}) {
      if (!idPattern.test(id ?? "")) throw new RecordProviderError("VALIDATION", "Invalid record ID");
      const admitted = admittedFields(patch, configuration.mutableFields, { patch: true });
      return admittedRecord(await invoke("update", [id, admitted, admittedPrincipal(principalValue), { signal }]), "NETWORK");
    },
    async delete(id, principalValue, { signal = null } = {}) {
      if (!idPattern.test(id ?? "")) throw new RecordProviderError("VALIDATION", "Invalid record ID");
      const deleted = await invoke("delete", [id, admittedPrincipal(principalValue), { signal }]);
      if (typeof deleted !== "boolean") throw new RecordProviderError("NETWORK", "Record provider returned an invalid delete result");
      return deleted;
    },
    configuration,
  });
}

export function createLocalRecordProvider({ database, collection, authorize } = {}) {
  for (const name of ["list", "get", "insert", "update", "delete"]) method(database, name);
  if (!collectionPattern.test(collection ?? "") || typeof authorize !== "function") throw new Error("local record provider configuration is invalid");
  const allowed = async (action, principal, record) => await authorize(action, principal, record) === true;
  return Object.freeze({
    async list(query, principal, { signal = null } = {}) {
      if (signal?.aborted) throw new RecordProviderError("CANCELLED", "Record operation was cancelled");
      const visible = [];
      for (const value of database.list(collection)) {
        if (!Object.entries(query.equality).every(([field, expected]) => value[field] === expected)) continue;
        if (await allowed("list", principal, value)) visible.push(value);
      }
      visible.sort((left, right) => compareRecord(left, right, query.order));
      const bounded = query.boundary === null ? visible : visible.filter((value) => query.direction === "forward" ? compareBoundary(value, query.boundary, query.order) > 0 : compareBoundary(value, query.boundary, query.order) < 0);
      const items = query.direction === "forward" ? bounded.slice(0, query.limit + 1) : bounded.slice(Math.max(0, bounded.length - query.limit - 1));
      return Object.freeze({ items: Object.freeze(items.map((value) => Object.freeze(clone(value)))), hasMore: bounded.length > query.limit });
    },
    async get(id, principal) {
      const value = database.get(collection, id);
      return value && await allowed("get", principal, value) ? Object.freeze(clone(value)) : null;
    },
    async insert(value, principal) {
      if (!await allowed("insert", principal, value)) throw new RecordProviderError("FORBIDDEN", "Record is not available");
      if (!database.insert(collection, value)) throw new RecordProviderError("VALIDATION", "Record could not be inserted");
      return Object.freeze(clone(value));
    },
    async update(id, patch, principal) {
      const current = database.get(collection, id);
      if (!current || !await allowed("update", principal, current)) throw new RecordProviderError("FORBIDDEN", "Record is not available");
      const next = { ...current, ...patch, id };
      if (!await allowed("update", principal, next)) throw new RecordProviderError("FORBIDDEN", "Record is not available");
      if (!database.update(collection, id, next)) throw new RecordProviderError("VALIDATION", "Record could not be updated");
      return Object.freeze(clone(next));
    },
    async delete(id, principal) {
      const current = database.get(collection, id);
      if (!current || !await allowed("delete", principal, current)) throw new RecordProviderError("FORBIDDEN", "Record is not available");
      return database.delete(collection, id);
    },
  });
}

export function createSupabaseRecordCollectionProvider({ provider, collection, accessTokenForPrincipal } = {}) {
  for (const name of ["list", "get", "insert", "update", "delete"]) method(provider, name);
  if (!collectionPattern.test(collection ?? "") || typeof accessTokenForPrincipal !== "function") throw new Error("Supabase record collection configuration is invalid");
  const token = async (principal, signal) => {
    const value = await accessTokenForPrincipal(principal, { signal });
    if (value === null) return null;
    if (typeof value !== "string" || value.length < 1) throw new RecordProviderError("UNAUTHORIZED", "Record operation is unauthorized");
    return value;
  };
  return Object.freeze({
    async list(query, principal, { signal = null } = {}) {
      const result = await provider.list(collection, await token(principal, signal), { signal, query });
      if (!object(result) || !Array.isArray(result.items) || typeof result.hasMore !== "boolean") throw new Error("invalid Supabase record page");
      return result;
    },
    async get(id, principal, { signal = null } = {}) { return provider.get(collection, id, await token(principal, signal), { signal }); },
    async insert(value, principal, { signal = null } = {}) { return provider.insert(collection, value, await token(principal, signal), { signal }); },
    async update(id, patch, principal, { signal = null } = {}) {
      const accessToken = await token(principal, signal);
      const current = await provider.get(collection, id, accessToken, { signal });
      if (!current) throw new RecordProviderError("FORBIDDEN", "Record is not available");
      return provider.update(collection, id, { ...current, ...patch, id }, accessToken, { signal });
    },
    async delete(id, principal, { signal = null } = {}) { return provider.delete(collection, id, await token(principal, signal), { signal }); },
  });
}

export const recordProviderLimits = Object.freeze({ absoluteMaximumLimit, maximumCursorBytes });
