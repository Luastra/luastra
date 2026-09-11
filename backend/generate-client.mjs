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

function generateLuauClientV1(contract) {
  const lines = [
    "-- Generated from the project backend declaration. Do not edit.",
    "--!strict",
    "",
    'local Server = require("luastra/server")',
    "",
    "export type RequestOptions = Server.Options",
    "export type Error = Server.Error",
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
    "Api.decodeError = Server.decodeError",
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

function luauLiteral(value) {
  if (value === null) return "nil";
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `{ ${value.map(luauLiteral).join(", ")} }`;
  return `{ ${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `[${JSON.stringify(key)}] = ${luauLiteral(item)}`).join(", ")} }`;
}

function v2Type(descriptor) {
  let result = descriptor.type;
  if (descriptor.array === true) result = `{ ${result} }`;
  if (descriptor.nullable === true) result = `Server.Nullable<${result}>`;
  if (descriptor.optional === true) result = `${result}?`;
  return result;
}

function v2Record(fields) {
  return `{ ${Object.entries(fields).sort(([a], [b]) => a.localeCompare(b)).map(([name, descriptor]) => `${name}: ${v2Type(descriptor)}`).join(", ")} }`;
}

function generateLuauClientV2(contract) {
  const lines = [
    "-- Generated from the project backend declaration. Do not edit.",
    "--!strict",
    "",
    'local Server = require("luastra/server")',
    "",
    "export type RequestOptions = Server.Options",
    "export type Nullable<T> = Server.Nullable<T>",
    "export type Error = Server.Error",
    "",
  ];
  for (const [name, members] of Object.entries(contract.enums).sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`export type ${name} = ${members.map(JSON.stringify).join(" | ")}`);
  }
  for (const [name, fields] of Object.entries(contract.types).sort(([a], [b]) => a.localeCompare(b))) lines.push(`export type ${name} = ${v2Record(fields)}`);
  if (Object.keys(contract.enums).length + Object.keys(contract.types).length > 0) lines.push("");
  for (const definition of Object.values(contract.functions).sort((a, b) => a.clientName.localeCompare(b.clientName))) {
    const base = title(definition.clientName);
    lines.push(`export type ${base}Input = ${v2Record(definition.input)}`);
    lines.push(`export type ${base}Result = ${v2Record(definition.result)}`);
  }
  lines.push(
    "",
    `local limits = ${luauLiteral(contract.limits)}`,
    `local enums = ${luauLiteral(Object.fromEntries(Object.entries(contract.enums).map(([name, members]) => [name, Object.fromEntries(members.map((member) => [member, true]))])))}`,
    `local types = ${luauLiteral(contract.types)}`,
    "local invalid = table.freeze({})",
    "local absent = table.freeze({})",
    "",
    "local encodeObject: (fields: { [string]: string }, prefix: string, definition: any, value: any, depth: number) -> ()",
    "local function encodeScalar(fields: { [string]: string }, path: string, descriptor: any, value: any, depth: number)",
    "    assert(depth <= limits.maximumDepth, \"server v2 value exceeds maximum depth\")",
    "    local typeName = descriptor.type",
    "    if typeName == \"string\" then",
    "        assert(type(value) == \"string\" and #value <= (descriptor.maximumBytes or limits.maximumStringBytes), \"server v2 string is invalid: \" .. path)",
    "        fields[path] = value",
    "    elseif typeName == \"number\" then",
    "        assert(type(value) == \"number\" and value % 1 == 0 and value >= -2147483647 and value <= 2147483647, \"server v2 number is invalid: \" .. path)",
    "        fields[path] = tostring(value)",
    "    elseif typeName == \"boolean\" then",
    "        assert(type(value) == \"boolean\", \"server v2 boolean is invalid: \" .. path)",
    "        fields[path] = if value then \"true\" else \"false\"",
    "    elseif enums[typeName] ~= nil then",
    "        assert(type(value) == \"string\" and enums[typeName][value] == true, \"server v2 enum is invalid: \" .. path)",
    "        fields[path] = value",
    "    else",
    "        assert(types[typeName] ~= nil, \"server v2 type is unknown\")",
    "        encodeObject(fields, path, types[typeName], value, depth + 1)",
    "    end",
    "end",
    "",
    "local function encodeField(fields: { [string]: string }, path: string, descriptor: any, authored: any, depth: number)",
    "    if authored == nil then",
    "        assert(descriptor.optional == true, \"server v2 required field is missing: \" .. path)",
    "        return",
    "    end",
    "    if descriptor.optional == true then fields[path .. \".present\"] = \"true\" end",
    "    local value = authored",
    "    if descriptor.nullable == true then",
    "        assert(type(authored) == \"table\" and (authored.kind == \"null\" or authored.kind == \"value\"), \"server v2 nullable field is invalid: \" .. path)",
    "        if authored.kind == \"null\" then fields[path .. \".null\"] = \"true\" return end",
    "        value = authored.value",
    "        assert(value ~= nil, \"server v2 nullable value is missing: \" .. path)",
    "    end",
    "    if descriptor.array == true then",
    "        assert(type(value) == \"table\", \"server v2 array is invalid: \" .. path)",
    "        local length = #value",
    "        assert(length <= (descriptor.maximumItems or limits.maximumItems), \"server v2 array exceeds item limit: \" .. path)",
    "        for key in pairs(value) do assert(type(key) == \"number\" and key % 1 == 0 and key >= 1 and key <= length, \"server v2 array is sparse: \" .. path) end",
    "        fields[path .. \".length\"] = tostring(length)",
    "        local itemDescriptor = table.clone(descriptor)",
    "        itemDescriptor.array = false itemDescriptor.optional = false itemDescriptor.nullable = false",
    "        for index = 1, length do encodeScalar(fields, path .. \".\" .. tostring(index), itemDescriptor, value[index], depth + 1) end",
    "    else",
    "        encodeScalar(fields, path, descriptor, value, depth)",
    "    end",
    "end",
    "",
    "encodeObject = function(fields: { [string]: string }, prefix: string, definition: any, value: any, depth: number)",
    "    assert(depth <= limits.maximumDepth and type(value) == \"table\", \"server v2 object is invalid: \" .. prefix)",
    "    for name in pairs(value) do assert(definition[name] ~= nil, \"server v2 object has unknown field: \" .. prefix .. \".\" .. tostring(name)) end",
    "    for name, descriptor in pairs(definition) do encodeField(fields, prefix .. \".\" .. name, descriptor, value[name], depth) end",
    "end",
    "",
    "local function take(fields: { [string]: string }, used: { [string]: boolean }, name: string, required: boolean): any",
    "    local value = fields[name]",
    "    if value == nil then return if required then invalid else absent end",
    "    if used[name] then return invalid end",
    "    used[name] = true",
    "    return value",
    "end",
    "",
    "local decodeObject: (fields: { [string]: string }, used: { [string]: boolean }, prefix: string, definition: any, depth: number) -> any",
    "local function decodeScalar(fields: { [string]: string }, used: { [string]: boolean }, path: string, descriptor: any, depth: number): any",
    "    if depth > limits.maximumDepth then return invalid end",
    "    local typeName = descriptor.type",
    "    if typeName == \"string\" then",
    "        local value = take(fields, used, path, true)",
    "        if value == invalid or #value > (descriptor.maximumBytes or limits.maximumStringBytes) then return invalid end",
    "        return value",
    "    elseif typeName == \"number\" then",
    "        local source = take(fields, used, path, true)",
    "        if source == invalid then return invalid end",
    "        local value = tonumber(source)",
    "        if value == nil or value % 1 ~= 0 or value < -2147483647 or value > 2147483647 or tostring(value) ~= source then return invalid end",
    "        return value",
    "    elseif typeName == \"boolean\" then",
    "        local value = take(fields, used, path, true)",
    "        if value ~= \"true\" and value ~= \"false\" then return invalid end",
    "        return value == \"true\"",
    "    elseif enums[typeName] ~= nil then",
    "        local value = take(fields, used, path, true)",
    "        if value == invalid or enums[typeName][value] ~= true then return invalid end",
    "        return value",
    "    end",
    "    if types[typeName] == nil then return invalid end",
    "    return decodeObject(fields, used, path, types[typeName], depth + 1)",
    "end",
    "",
    "local function decodeField(fields: { [string]: string }, used: { [string]: boolean }, path: string, descriptor: any, depth: number): any",
    "    if descriptor.optional == true then",
    "        local present = take(fields, used, path .. \".present\", false)",
    "        if present == absent then return absent end",
    "        if present ~= \"true\" then return invalid end",
    "    end",
    "    if descriptor.nullable == true then",
    "        local nullMarker = take(fields, used, path .. \".null\", false)",
    "        if nullMarker ~= absent then",
    "            if nullMarker ~= \"true\" then return invalid end",
    "            return Server.nullValue()",
    "        end",
    "    end",
    "    local value",
    "    if descriptor.array == true then",
    "        local source = take(fields, used, path .. \".length\", true)",
    "        if source == invalid or (source ~= \"0\" and string.match(source, \"^[1-9][0-9]*$\") == nil) then return invalid end",
    "        local length = tonumber(source)",
    "        if length == nil or length > (descriptor.maximumItems or limits.maximumItems) then return invalid end",
    "        value = {}",
    "        local itemDescriptor = table.clone(descriptor)",
    "        itemDescriptor.array = false itemDescriptor.optional = false itemDescriptor.nullable = false",
    "        for index = 1, length do",
    "            local item = decodeScalar(fields, used, path .. \".\" .. tostring(index), itemDescriptor, depth + 1)",
    "            if item == invalid then return invalid end",
    "            table.insert(value, item)",
    "        end",
    "    else",
    "        value = decodeScalar(fields, used, path, descriptor, depth)",
    "        if value == invalid then return invalid end",
    "    end",
    "    return if descriptor.nullable == true then Server.value(value) else value",
    "end",
    "",
    "decodeObject = function(fields: { [string]: string }, used: { [string]: boolean }, prefix: string, definition: any, depth: number): any",
    "    if depth > limits.maximumDepth then return invalid end",
    "    local value = {}",
    "    for name, descriptor in pairs(definition) do",
    "        local decoded = decodeField(fields, used, prefix .. \".\" .. name, descriptor, depth)",
    "        if decoded == invalid then return invalid end",
    "        if decoded ~= absent then value[name] = decoded end",
    "    end",
    "    return value",
    "end",
    "",
    "local function exact(fields: { [string]: string }, used: { [string]: boolean }): boolean",
    "    for name in pairs(fields) do if used[name] ~= true then return false end end",
    "    return true",
    "end",
    "",
    "local Api = {}",
    "Api.decodeError = Server.decodeError",
    "Api.nullValue = Server.nullValue",
    "Api.value = Server.value",
    "",
  );
  for (const [operation, definition] of Object.entries(contract.functions).sort(([a], [b]) => a.localeCompare(b))) {
    const base = title(definition.clientName);
    const inputSpec = luauLiteral(definition.input);
    const resultSpec = luauLiteral(definition.result);
    lines.push(`function Api.${definition.clientName}(input: ${base}Input, options: Server.Options?): number`);
    lines.push("    local fields: { [string]: string } = {}", `    encodeObject(fields, "input", ${inputSpec}, input, 0)`, `    return Server.callV2(${JSON.stringify(operation)}, fields, options, { maximumBytes = limits.maximumPayloadBytes, maximumFields = limits.maximumFields })`, "end", "");
    lines.push(`function Api.decode${base}(payload: string): ${base}Result?`);
    lines.push("    if #payload > limits.maximumPayloadBytes then return nil end", "    local decoded = Server.decodeV2(payload)", "    if not decoded.success then return nil end", "    local fields = decoded.fields", "    local fieldCount = 0", "    for _name in pairs(fields) do fieldCount += 1 end", "    if fieldCount > limits.maximumFields then return nil end", "    local used: { [string]: boolean } = {}", "    local version = take(fields, used, \"resultVersion\", true)", `    if version ~= ${JSON.stringify(String(definition.resultVersion))} then return nil end`, `    local result = decodeObject(fields, used, "result", ${resultSpec}, 0)`, "    if result == invalid or not exact(fields, used) then return nil end", `    return result :: ${base}Result`, "end", "");
  }
  lines.push("return table.freeze(Api)", "");
  return lines.join("\n");
}

export function generateLuauClient(contract) {
  return contract.schemaVersion === 2 ? generateLuauClientV2(contract) : generateLuauClientV1(contract);
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
