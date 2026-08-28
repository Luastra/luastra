--!strict

export type ValidationError = {
    code: string,
    path: string,
}

export type Success = { success: true, value: any, error: nil }
export type Failure = { success: false, value: nil, error: ValidationError }
export type Result = Success | Failure

export type StringOptions = { minBytes: number?, maxBytes: number?, trim: boolean? }
export type NumberOptions = { integer: boolean?, min: number?, max: number? }
export type ArrayOptions = { minItems: number?, maxItems: number? }
export type ObjectOptions = { exact: boolean? }

export type Schema = {
    kind: string,
    optional: boolean?,
    options: { [string]: any }?,
    item: Schema?,
    fields: { [string]: Schema }?,
}

local maximumDepth = 16
local maximumFields = 128
local maximumItems = 256
local maximumStringBytes = 4096

local function success(value: any): Success
    return { success = true, value = value, error = nil }
end

local function failure(code: string, path: string): Failure
    return { success = false, value = nil, error = { code = code, path = path } }
end

local function exactOptions(options: any, allowed: { [string]: boolean }, label: string): { [string]: any }
    if options == nil then return {} end
    assert(type(options) == "table", label .. " options must be a table")
    for key in pairs(options) do
        assert(type(key) == "string" and allowed[key] == true, label .. " has an unsupported option")
    end
    return options :: { [string]: any }
end

local function boundedInteger(value: any, minimum: number, maximum: number, label: string): number
    assert(type(value) == "number" and value % 1 == 0 and value >= minimum and value <= maximum, label .. " must be a bounded integer")
    return value
end

local function finiteNumber(value: any): boolean
    return type(value) == "number" and value == value and value ~= math.huge and value ~= -math.huge
end

local Data = {}

function Data.string(optionsValue: StringOptions?): Schema
    local options = exactOptions(optionsValue, { minBytes = true, maxBytes = true, trim = true }, "string schema")
    local minBytes = boundedInteger(options.minBytes or 0, 0, maximumStringBytes, "minBytes")
    local maxBytes = boundedInteger(options.maxBytes or maximumStringBytes, 0, maximumStringBytes, "maxBytes")
    assert(minBytes <= maxBytes, "minBytes must not exceed maxBytes")
    assert(options.trim == nil or type(options.trim) == "boolean", "trim must be a boolean")
    return table.freeze({ kind = "string", options = table.freeze({ minBytes = minBytes, maxBytes = maxBytes, trim = options.trim == true }) }) :: any
end

function Data.number(optionsValue: NumberOptions?): Schema
    local options = exactOptions(optionsValue, { integer = true, min = true, max = true }, "number schema")
    assert(options.integer == nil or type(options.integer) == "boolean", "integer must be a boolean")
    assert(options.min == nil or finiteNumber(options.min), "min must be a finite number")
    assert(options.max == nil or finiteNumber(options.max), "max must be a finite number")
    assert(options.min == nil or options.max == nil or options.min <= options.max, "min must not exceed max")
    return table.freeze({ kind = "number", options = table.freeze({ integer = options.integer == true, min = options.min, max = options.max }) }) :: any
end

function Data.boolean(): Schema
    return table.freeze({ kind = "boolean" }) :: any
end

function Data.array(item: Schema, optionsValue: ArrayOptions?): Schema
    assert(type(item) == "table", "array item schema is required")
    local options = exactOptions(optionsValue, { minItems = true, maxItems = true }, "array schema")
    local minItems = boundedInteger(options.minItems or 0, 0, maximumItems, "minItems")
    local maxItems = boundedInteger(options.maxItems or maximumItems, 0, maximumItems, "maxItems")
    assert(minItems <= maxItems, "minItems must not exceed maxItems")
    return table.freeze({ kind = "array", item = item, options = table.freeze({ minItems = minItems, maxItems = maxItems }) }) :: any
end

function Data.object(fields: { [string]: Schema }, optionsValue: ObjectOptions?): Schema
    assert(type(fields) == "table", "object fields are required")
    local count = 0
    local frozenFields: { [string]: Schema } = {}
    for name, schema in pairs(fields) do
        assert(type(name) == "string" and string.match(name, "^[%a_][%w_]*$") ~= nil, "object field name is invalid")
        assert(type(schema) == "table", "object field schema is invalid")
        count += 1
        assert(count <= maximumFields, "object schema has too many fields")
        frozenFields[name] = schema
    end
    local options = exactOptions(optionsValue, { exact = true }, "object schema")
    assert(options.exact == nil or type(options.exact) == "boolean", "exact must be a boolean")
    return table.freeze({ kind = "object", fields = table.freeze(frozenFields), options = table.freeze({ exact = options.exact ~= false }) }) :: any
end

function Data.optional(schema: Schema): Schema
    assert(type(schema) == "table", "optional schema is required")
    return table.freeze({ kind = schema.kind, optional = true, options = schema.options, item = schema.item, fields = schema.fields }) :: any
end

local function decodeValue(schema: Schema, value: any, path: string, depth: number, active: { [Schema]: boolean }): Result
    if type(schema) ~= "table" or type(schema.kind) ~= "string" then return failure("invalid_schema", path) end
    if value == nil and schema.optional == true then return success(nil) end
    if depth > maximumDepth then return failure("maximum_depth", path) end
    if active[schema] then return failure("schema_cycle", path) end
    active[schema] = true

    local result: Result
    if schema.kind == "string" then
        if type(value) ~= "string" then
            result = failure("expected_string", path)
        else
            local options = (schema.options or {}) :: { [string]: any }
            local normalized = options.trim == true and string.match(value, "^%s*(.-)%s*$") or value
            local length = #(normalized :: string)
            if length < (options.minBytes or 0) then result = failure("too_short", path)
            elseif length > (options.maxBytes or maximumStringBytes) then result = failure("too_long", path)
            else result = success(normalized) end
        end
    elseif schema.kind == "number" then
        local options = (schema.options or {}) :: { [string]: any }
        if type(value) ~= "number" or value ~= value or value == math.huge or value == -math.huge then result = failure("expected_number", path)
        elseif options.integer == true and value % 1 ~= 0 then result = failure("expected_integer", path)
        elseif options.min ~= nil and value < options.min then result = failure("too_small", path)
        elseif options.max ~= nil and value > options.max then result = failure("too_large", path)
        else result = success(value) end
    elseif schema.kind == "boolean" then
        result = type(value) == "boolean" and success(value) or failure("expected_boolean", path)
    elseif schema.kind == "array" then
        if type(value) ~= "table" or schema.item == nil then
            result = failure("expected_array", path)
        else
            local options = (schema.options or {}) :: { [string]: any }
            local length = #value
            local validShape = true
            for key in pairs(value) do
                if type(key) ~= "number" or key % 1 ~= 0 or key < 1 or key > length then validShape = false break end
            end
            if not validShape then result = failure("expected_array", path)
            elseif length < (options.minItems or 0) then result = failure("too_few_items", path)
            elseif length > (options.maxItems or maximumItems) then result = failure("too_many_items", path)
            else
                local output = {}
                result = success(output)
                for index = 1, length do
                    local itemResult = decodeValue(schema.item, value[index], path .. "[" .. tostring(index) .. "]", depth + 1, active)
                    if not itemResult.success then result = itemResult break end
                    output[index] = itemResult.value
                end
            end
        end
    elseif schema.kind == "object" then
        if type(value) ~= "table" or schema.fields == nil then
            result = failure("expected_object", path)
        else
            local options = (schema.options or {}) :: { [string]: any }
            local output: { [string]: any } = {}
            result = success(output)
            if options.exact ~= false then
                for key in pairs(value) do
                    if type(key) ~= "string" or schema.fields[key] == nil then result = failure("unexpected_field", path) break end
                end
            end
            if result.success then
                for name, fieldSchema in pairs(schema.fields) do
                    local fieldResult = decodeValue(fieldSchema, value[name], path .. "." .. name, depth + 1, active)
                    if not fieldResult.success then result = fieldResult break end
                    if fieldResult.value ~= nil then output[name] = fieldResult.value end
                end
            end
        end
    else
        result = failure("unknown_schema", path)
    end

    active[schema] = nil
    return result
end

function Data.decode(schema: Schema, value: any): Result
    return decodeValue(schema, value, "$", 0, {})
end

Data.limits = table.freeze({ maximumDepth = maximumDepth, maximumFields = maximumFields, maximumItems = maximumItems, maximumStringBytes = maximumStringBytes })

return table.freeze(Data)
