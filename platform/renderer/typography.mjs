const prefix = "luastra-type-";
const assetId = /^[a-z][a-z0-9_-]*(\/[a-z][a-z0-9_-]*)*$/u;
export function fontClass(id) {
  if (typeof id !== "string" || id.length > 128 || !assetId.test(id)) throw new Error("invalid font asset id");
  return `${prefix}font-${Array.from(id, (c) => c.charCodeAt(0).toString(16).padStart(2, "0")).join("")}`;
}
export function validateTypographyClasses(value, resolveAsset) {
  const found = new Set();
  for (const token of (value ?? "").split(" ").filter((s) => s.startsWith(prefix))) {
    const part = token.slice(prefix.length), separator = part.indexOf("-");
    const key = part.slice(0, separator), raw = part.slice(separator + 1);
    if (found.has(key)) throw new Error(`duplicate typography field: ${key}`);
    found.add(key);
    if (key === "font") {
      if (!/^(?:[0-9a-f]{2}){1,128}$/u.test(raw)) throw new Error("invalid font class");
      const id = raw.match(/../gu).map((byte) => String.fromCharCode(parseInt(byte, 16))).join("");
      if (fontClass(id) !== token) throw new Error("invalid font class");
      resolveAsset(`asset:${id}`, "font");
    } else if (key === "fallback") {
      if (!["sans", "serif", "mono"].includes(raw)) throw new Error("invalid font fallback");
    } else {
      const number = Number(raw);
      const range = { size: [8, 128], weight: [100, 900], leading: [100, 300] }[key];
      if (!range || !/^[1-9][0-9]*$/u.test(raw) || number < range[0] || number > range[1] || key === "weight" && number % 100 !== 0) throw new Error("invalid typography value");
    }
  }
}
