function publicRecord(record) { return { id: record.id, title: record.title, details: record.details }; }
function requirePrincipal(context) {
  if (!context.principal?.id) context.reject("UNAUTHORIZED", "Authentication required");
  return context.principal.id;
}
function validateDraft(input, context) {
  const title = input.title.trim();
  const details = input.details.trim();
  if (title.length === 0 || new TextEncoder().encode(title).byteLength > 80 || new TextEncoder().encode(details).byteLength > 240) context.reject("VALIDATION", "Invalid record fields");
  return { title, details };
}

export function createHandlers({ database }) {
  if (!database) throw new Error("forms backend requires a database adapter");
  database.seed("records", [
    { id: "record-1", ownerId: "local-user", title: "Define the public contract", details: "Keep application code Luau-first." },
    { id: "record-2", ownerId: "local-user", title: "Verify the fixture", details: "Exercise validation and CRUD behavior." },
  ]);
  let nextId = 3;
  const owned = (principalId) => database.list("records").filter((record) => record.ownerId === principalId);
  return Object.freeze({
    async "records.list.v1"(_input, context) {
      const principalId = requirePrincipal(context);
      return { records: owned(principalId).map(publicRecord) };
    },
    async "records.create.v1"(input, context) {
      const ownerId = requirePrincipal(context);
      const draft = validateDraft(input, context);
      const record = { id: `record-${nextId++}`, ownerId, ...draft };
      if (!database.insert("records", record)) throw new Error("database insert failed");
      return { record: publicRecord(record) };
    },
    async "records.update.v1"(input, context) {
      const ownerId = requirePrincipal(context);
      const current = database.get("records", input.id);
      if (!current || current.ownerId !== ownerId) context.reject("FORBIDDEN", "Record is not available");
      const record = { ...current, ...validateDraft(input, context) };
      if (!database.update("records", record.id, record)) throw new Error("database update failed");
      return { record: publicRecord(record) };
    },
    async "records.delete.v1"(input, context) {
      const ownerId = requirePrincipal(context);
      const current = database.get("records", input.id);
      if (!current || current.ownerId !== ownerId) context.reject("FORBIDDEN", "Record is not available");
      if (!database.delete("records", input.id)) throw new Error("database delete failed");
      return { deletedId: input.id };
    },
    async "records.admin.v1"(_input, context) { return { count: context.database.list("records").length }; },
    async "records.fail.v1"() { throw new Error("private database connection details"); },
  });
}
