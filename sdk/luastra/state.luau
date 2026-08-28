--!strict

export type Fields = { [string]: string }
export type DecodeError = { code: string }
export type DecodeSuccess = { success: true, version: number, fields: Fields, error: nil }
export type DecodeFailure = { success: false, version: nil, fields: nil, error: DecodeError }
export type DecodeResult = DecodeSuccess | DecodeFailure
export type MigrationError = { code: string }
export type MigrationSuccess = { success: true, version: number, fields: Fields, encoded: string, error: nil }
export type MigrationFailure = { success: false, version: nil, fields: nil, encoded: nil, error: MigrationError }
export type MigrationResult = MigrationSuccess | MigrationFailure
export type Migration = (fields: Fields) -> Fields

local maximumBytes = 4096
local maximumFields = 32
local maximumMigrationSteps = 32
local keyPattern = "^[a-z][a-z0-9_-]*$"

local function failure(code: string): DecodeFailure
    return { success = false, version = nil, fields = nil, error = { code = code } }
end

local function encodeValue(value: string): string
    return (string.gsub(value, "([^%w%._~-])", function(character: string): string
        return string.format("%%%02X", string.byte(character))
    end))
end

local function decodeValue(value: string): string?
    local output = ""
    local index = 1
    while index <= #value do
        local character = string.sub(value, index, index)
        if character == "%" then
            if index + 2 > #value then return nil end
            local hex = string.sub(value, index + 1, index + 2)
            local byte = tonumber(hex, 16)
            if byte == nil then return nil end
            output ..= string.char(byte)
            index += 3
        else
            output ..= character
            index += 1
        end
    end
    if encodeValue(output) ~= value then return nil end
    return output
end

local function parts(value: string): { string }?
    local output = {}
    local start = 1
    while true do
        local separator = string.find(value, "&", start, true)
        local part: string
        if separator == nil then part = string.sub(value, start) else part = string.sub(value, start, separator - 1) end
        if part == "" then return nil end
        table.insert(output, part)
        if separator == nil then return output end
        start = separator + 1
    end
end

local State = {}

local function migrationFailure(code: string): MigrationFailure
    return { success = false, version = nil, fields = nil, encoded = nil, error = { code = code } }
end

local function copyFields(fields: Fields): Fields
    local output: Fields = {}
    for name, value in pairs(fields) do output[name] = value end
    return output
end

function State.encode(version: number, fields: Fields): string
    assert(type(version) == "number" and version % 1 == 0 and version >= 1 and version <= 999, "state version is invalid")
    assert(type(fields) == "table", "state fields are required")
    local names = {}
    for name, value in pairs(fields) do
        assert(type(name) == "string" and #name <= 64 and string.match(name, keyPattern) ~= nil, "state field name is invalid")
        assert(type(value) == "string", "state field value must be a string")
        table.insert(names, name)
        assert(#names <= maximumFields, "state field count exceeded")
    end
    table.sort(names)
    local encoded = "v=" .. tostring(version)
    for _, name in names do encoded ..= "&" .. name .. "=" .. encodeValue(fields[name]) end
    assert(#encoded <= maximumBytes, "encoded state exceeds 4096 bytes")
    return encoded
end

function State.decode(value: string, expectedVersion: number): DecodeResult
    if type(value) ~= "string" or #value == 0 then return failure("empty") end
    if #value > maximumBytes then return failure("too_large") end
    if type(expectedVersion) ~= "number" or expectedVersion % 1 ~= 0 or expectedVersion < 1 or expectedVersion > 999 then return failure("invalid_expected_version") end
    local tokens = parts(value)
    if tokens == nil or #tokens < 1 or string.sub(tokens[1], 1, 2) ~= "v=" then return failure("malformed") end
    local version = tonumber(string.sub(tokens[1], 3))
    if version == nil or version % 1 ~= 0 then return failure("malformed") end
    if version ~= expectedVersion then return failure("unsupported_version") end
    local fields: Fields = {}
    for index = 2, #tokens do
        if index - 1 > maximumFields then return failure("too_many_fields") end
        local separator = string.find(tokens[index], "=", 1, true)
        if separator == nil then return failure("malformed") end
        local name = string.sub(tokens[index], 1, separator - 1)
        local encoded = string.sub(tokens[index], separator + 1)
        if #name == 0 or #name > 64 or string.match(name, keyPattern) == nil or fields[name] ~= nil then return failure("invalid_field") end
        local decoded = decodeValue(encoded)
        if decoded == nil then return failure("invalid_encoding") end
        fields[name] = decoded
    end
    return { success = true, version = version, fields = fields, error = nil }
end

function State.migrate(value: string, targetVersion: number, migrationsValue: any): MigrationResult
    if type(value) ~= "string" or #value == 0 then return migrationFailure("empty") end
    if #value > maximumBytes then return migrationFailure("too_large") end
    if type(targetVersion) ~= "number" or targetVersion % 1 ~= 0 or targetVersion < 1 or targetVersion > 999 then return migrationFailure("invalid_target_version") end
    if type(migrationsValue) ~= "table" then return migrationFailure("invalid_migrations") end

    local firstToken = string.match(value, "^v=([^&]+)")
    local sourceVersion = firstToken and tonumber(firstToken) or nil
    if sourceVersion == nil or sourceVersion % 1 ~= 0 or sourceVersion < 1 or sourceVersion > 999 then return migrationFailure("malformed") end
    if sourceVersion > targetVersion then return migrationFailure("newer_version") end
    if targetVersion - sourceVersion > maximumMigrationSteps then return migrationFailure("too_many_migrations") end

    local decoded = State.decode(value, sourceVersion)
    if not decoded.success then return migrationFailure(decoded.error.code) end
    local active = copyFields(decoded.fields)
    local version = sourceVersion

    while version < targetVersion do
        local migration = migrationsValue[version]
        if type(migration) ~= "function" then return migrationFailure("missing_migration") end
        local isolated = copyFields(active)
        local ok, replacement = pcall(migration, isolated)
        if not ok then return migrationFailure("migration_failed") end
        if type(replacement) ~= "table" or replacement == isolated then return migrationFailure("invalid_migration") end
        local encodedOk, encodedOrError = pcall(function(): string
            return State.encode(version + 1, replacement :: Fields)
        end)
        if not encodedOk then return migrationFailure("invalid_migration") end
        local verified = State.decode(encodedOrError :: string, version + 1)
        if not verified.success then return migrationFailure("invalid_migration") end
        active = copyFields(verified.fields)
        version += 1
    end

    local encoded = State.encode(targetVersion, active)
    return { success = true, version = targetVersion, fields = copyFields(active), encoded = encoded, error = nil }
end

State.limits = table.freeze({ maximumBytes = maximumBytes, maximumFields = maximumFields, maximumMigrationSteps = maximumMigrationSteps })

return table.freeze(State)
