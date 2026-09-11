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
  return Object.freeze({
    async "records.list.v1"(_input, context) {
      requirePrincipal(context);
      const page = await context.records.records.list({}, context.principal, { signal: context.signal });
      return { records: page.items.map(publicRecord) };
    },
    async "records.create.v1"(input, context) {
      const ownerId = requirePrincipal(context);
      const draft = validateDraft(input, context);
      const record = { id: `record-${nextId++}`, ownerId, ...draft };
      return { record: publicRecord(await context.records.records.insert(record, context.principal, { signal: context.signal })) };
    },
    async "records.update.v1"(input, context) {
      requirePrincipal(context);
      const current = await context.records.records.get(input.id, context.principal, { signal: context.signal });
      if (!current) context.reject("FORBIDDEN", "Record is not available");
      const record = await context.records.records.update(input.id, validateDraft(input, context), context.principal, { signal: context.signal });
      return { record: publicRecord(record) };
    },
    async "records.delete.v1"(input, context) {
      requirePrincipal(context);
      if (!await context.records.records.delete(input.id, context.principal, { signal: context.signal })) throw new Error("database delete failed");
      return { deletedId: input.id };
    },
    async "records.admin.v1"(_input, context) { return { count: context.database.list("records").length }; },
    async "records.fail.v1"() { throw new Error("private database connection details"); },
  });
}
