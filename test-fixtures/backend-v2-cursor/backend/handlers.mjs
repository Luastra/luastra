const records = Object.freeze([
  Object.freeze({ id: "record-1", title: "First reusable record", tags: Object.freeze(["alpha", "typed"]) }),
  Object.freeze({ id: "record-2", title: "Second reusable record", tags: Object.freeze(["cursor"]) }),
  Object.freeze({ id: "record-3", title: "Third reusable record", tags: Object.freeze([]) }),
]);

export function createHandlers() {
  return Object.freeze({
    async "records.page.v2"(input) {
      const start = input.cursor === null || input.cursor === undefined ? 0 : Number(input.cursor.slice("cursor-".length));
      const items = records.slice(start, start + input.limit).map((record) => ({ ...record, tags: [...record.tags] }));
      const next = start + items.length;
      return {
        page: {
          items,
          previousCursor: start === 0 ? null : `cursor-${Math.max(0, start - input.limit)}`,
          nextCursor: next >= records.length ? null : `cursor-${next}`,
          revision: "records-revision-1",
        },
      };
    },
    async "records.rename.v2"(_input, context) {
      context.reject("VALIDATION", "Invalid record fields", { title: "REQUIRED" });
    },
  });
}
