import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

function luauType(type) {
  if (type.endsWith("[]")) return `{ ${luauType(type.slice(0, -2))} }`;
  return type;
}
function title(value) { return value[0].toUpperCase() + value.slice(1); }
function inputValue(name, type) {
  if (type === "string") return `input.${name}`;
  if (type === "number") return `tostring(input.${name})`;
  if (type === "boolean") return `input.${name} and "true" or "false"`;
  throw new Error(`generated client does not support object input field: ${name}`);
}
function scalarDecode(raw, type, variable, indent) {
  if (type === "string") return `${indent}local ${variable} = ${raw}`;
  if (type === "number") return `${indent}local ${variable} = ${raw} and tonumber(${raw}) or nil\n${indent}if ${variable} == nil then return nil end`;
  if (type === "boolean") return `${indent}if ${raw} ~= "true" and ${raw} ~= "false" then return nil end\n${indent}local ${variable} = ${raw} == "true"`;
  throw new Error(`unsupported scalar decode type: ${type}`);
}
function objectDecode({ expression, typeName, variable, types, indent }) {
  const lines = [];
  const members = [];
  for (const [field, fieldType] of Object.entries(types[typeName]).sort(([a], [b]) => a.localeCompare(b))) {
    const raw = `${variable}_${field}Raw`;
    const value = `${variable}_${field}`;
    lines.push(`${indent}local ${raw} = take(fields, used, ${expression} .. ".${field}")`);
    lines.push(scalarDecode(raw, fieldType, value, indent));
    if (fieldType === "string") lines.push(`${indent}if ${value} == nil then return nil end`);
    members.push(`${field} = ${value}`);
  }
  lines.push(`${indent}local ${variable}: ${typeName} = { ${members.join(", ")} }`);
  return lines;
}

export function generateLuauClient(contract) {
  const lines = [
    "-- Generated from the project backend declaration. Do not edit.",
    "--!strict",
    "",
    'local Server = require("luastra/server")',
    "",
    "export type RequestOptions = Server.Options",
    "",
  ];
  for (const [name, fields] of Object.entries(contract.types).sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`export type ${name} = { ${Object.entries(fields).sort(([a], [b]) => a.localeCompare(b)).map(([field, type]) => `${field}: ${luauType(type)}`).join(", ")} }`);
  }
  if (Object.keys(contract.types).length > 0) lines.push("");
  for (const definition of Object.values(contract.functions).sort((a, b) => a.clientName.localeCompare(b.clientName))) {
    const base = title(definition.clientName);
    lines.push(`export type ${base}Input = { ${Object.entries(definition.input).sort(([a], [b]) => a.localeCompare(b)).map(([name, type]) => `${name}: ${luauType(type)}`).join(", ")} }`);
    lines.push(`export type ${base}Result = { ${Object.entries(definition.result).sort(([a], [b]) => a.localeCompare(b)).map(([name, type]) => `${name}: ${luauType(type)}`).join(", ")} }`);
  }
  lines.push(
    "",
    "local function take(fields: { [string]: string }, used: { [string]: boolean }, name: string): string?",
    "    local value = fields[name]",
    "    if value == nil or used[name] then return nil end",
    "    used[name] = true",
    "    return value",
    "end",
    "",
    "local function exact(fields: { [string]: string }, used: { [string]: boolean }): boolean",
    "    for name in pairs(fields) do if used[name] ~= true then return false end end",
    "    return true",
    "end",
    "",
    "local Api = {}",
    "",
  );
  for (const [operation, definition] of Object.entries(contract.functions).sort(([a], [b]) => a.localeCompare(b))) {
    const base = title(definition.clientName);
    const entries = Object.entries(definition.input).sort(([a], [b]) => a.localeCompare(b));
    lines.push(`function Api.${definition.clientName}(input: ${base}Input, options: Server.Options?): number`);
    lines.push(`    return Server.call("${operation}", { ${entries.map(([name, type]) => `["${name}"] = ${inputValue(name, type)}`).join(", ")} }, options)`);
    lines.push("end", "");
    lines.push(`function Api.decode${base}(payload: string): ${base}Result?`);
    lines.push("    local decoded = Server.decode(payload)", "    if not decoded.success then return nil end", "    local fields = decoded.fields", "    local used: { [string]: boolean } = {}", `    local result = {} :: ${base}Result`);
    for (const [name, type] of Object.entries(definition.result).sort(([a], [b]) => a.localeCompare(b))) {
      if (type.endsWith("[]")) {
        const itemType = type.slice(0, -2);
        lines.push(`    local ${name}LengthRaw = take(fields, used, "result.${name}.length")`, `    local ${name}Length = ${name}LengthRaw and tonumber(${name}LengthRaw) or nil`, `    if ${name}Length == nil or ${name}Length % 1 ~= 0 or ${name}Length < 0 or ${name}Length > 128 then return nil end`, `    local ${name}: { ${luauType(itemType)} } = {}`);
        if (contract.types[itemType]) {
          lines.push(`    for index = 1, ${name}Length do`);
          lines.push(...objectDecode({ expression: `"result.${name}." .. tostring(index)`, typeName: itemType, variable: "item", types: contract.types, indent: "        " }));
          lines.push(`        table.insert(${name}, item)`, "    end");
        } else {
          lines.push(`    for index = 1, ${name}Length do`, `        local itemRaw = take(fields, used, "result.${name}." .. tostring(index))`);
          lines.push(scalarDecode("itemRaw", itemType, "item", "        "));
          if (itemType === "string") lines.push("        if item == nil then return nil end");
          lines.push(`        table.insert(${name}, item)`, "    end");
        }
        lines.push(`    result.${name} = ${name}`);
      } else if (contract.types[type]) {
        lines.push(...objectDecode({ expression: `"result.${name}"`, typeName: type, variable: name, types: contract.types, indent: "    " }));
        lines.push(`    result.${name} = ${name}`);
      } else {
        const raw = `${name}Raw`;
        lines.push(`    local ${raw} = take(fields, used, "result.${name}")`);
        lines.push(scalarDecode(raw, type, name, "    "));
        if (type === "string") lines.push(`    if ${name} == nil then return nil end`);
        lines.push(`    result.${name} = ${name}`);
      }
    }
    lines.push("    if not exact(fields, used) then return nil end", "    return result", "end", "");
  }
  lines.push("return table.freeze(Api)", "");
  return lines.join("\n");
}

export async function writeGeneratedClient(contract, path) {
  const source = generateLuauClient(contract.value);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, source);
  return Object.freeze({ path, bytes: Buffer.byteLength(source), sha256: createHash("sha256").update(source).digest("hex") });
}

export async function verifyGeneratedClient(contract, path) {
  const expected = generateLuauClient(contract.value);
  const actual = await readFile(path, "utf8").catch(() => null);
  if (actual !== expected) throw new Error("generated backend client is missing or stale; run `luastra generate`");
  return Object.freeze({ path, bytes: Buffer.byteLength(expected), sha256: createHash("sha256").update(expected).digest("hex") });
}
