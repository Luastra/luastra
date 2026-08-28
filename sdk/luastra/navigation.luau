--!strict

export type Snapshot = { version: number, routes: { string } }
export type RestoreError = { code: string }
export type RestoreResult = { success: boolean, error: RestoreError? }
export type Options = { routes: { string }, initial: string, maximumDepth: number? }
export type Stack = {
    current: () -> string,
    canBack: () -> boolean,
    push: (route: string) -> boolean,
    replace: (route: string) -> boolean,
    back: () -> boolean,
    snapshot: () -> Snapshot,
    restore: (snapshot: any) -> RestoreResult,
}
export type RouteError = { code: string }
export type RouteEntry = { name: string, params: { [string]: any }, query: { [string]: any } }
export type RouteResult = { success: boolean, entry: RouteEntry?, location: string?, error: RouteError? }
export type RouteCompiler = {
    match: (location: string) -> RouteResult,
    generate: (entry: any) -> RouteResult,
    canonicalize: (location: string) -> RouteResult,
}
export type EntrySnapshot = { version: number, entries: { RouteEntry } }
export type MutationResult = { success: boolean, changed: boolean, error: RouteError? }
export type EntryStack = {
    current: () -> RouteEntry,
    currentLocation: () -> string,
    canBack: () -> boolean,
    push: (entry: any) -> MutationResult,
    pushLocation: (location: string) -> MutationResult,
    replace: (entry: any) -> MutationResult,
    replaceLocation: (location: string) -> MutationResult,
    back: () -> boolean,
    snapshot: () -> EntrySnapshot,
    encode: () -> string,
    restore: (snapshot: any) -> RestoreResult,
    restoreEncoded: (value: string) -> RestoreResult,
}

local routePattern = "^[a-z][a-z0-9_-]*$"
local maximumKnownRoutes = 64
local maximumStackDepth = 32
local maximumLocationBytes = 2048
local maximumRouteSegments = 16
local maximumQueryFields = 16
local maximumNestingDepth = 8
local maximumSnapshotBytes = 4096

local function exactKeys(value: any, admitted: { [string]: boolean }): boolean
    if type(value) ~= "table" then return false end
    for key in pairs(value) do
        if type(key) ~= "string" or admitted[key] == nil then return false end
    end
    return true
end

local function unreserved(byte: number): boolean
    return (byte >= 48 and byte <= 57) or (byte >= 65 and byte <= 90) or (byte >= 97 and byte <= 122) or byte == 45 or byte == 46 or byte == 95 or byte == 126
end

local function percentEncode(value: string): string
    local output = table.create(#value)
    for index = 1, #value do
        local byte = string.byte(value, index)
        table.insert(output, unreserved(byte) and string.char(byte) or string.format("%%%02X", byte))
    end
    return table.concat(output)
end

local function percentDecode(value: string): string?
    local output = table.create(#value)
    local index = 1
    while index <= #value do
        local character = string.sub(value, index, index)
        if character == "%" then
            if index + 2 > #value then return nil end
            local byte = tonumber(string.sub(value, index + 1, index + 2), 16)
            if byte == nil or byte == 0 then return nil end
            table.insert(output, string.char(byte))
            index += 3
        else
            local byte = string.byte(character)
            if not unreserved(byte) then return nil end
            table.insert(output, character)
            index += 1
        end
    end
    return table.concat(output)
end

local function split(value: string, separator: string): { string }
    local output = {}
    local start = 1
    while true do
        local found = string.find(value, separator, start, true)
        if found == nil then
            table.insert(output, string.sub(value, start))
            return output
        end
        table.insert(output, string.sub(value, start, found - 1))
        start = found + #separator
    end
end

local function copyMap(value: any): { [string]: any }?
    if value == nil then return {} end
    if type(value) ~= "table" then return nil end
    local output: { [string]: any } = {}
    for key, item in pairs(value) do
        if type(key) ~= "string" then return nil end
        output[key] = item
    end
    return output
end

local function validateSchema(schemaValue: any, maximumFields: number): { [string]: any }
    if schemaValue == nil then return {} end
    assert(type(schemaValue) == "table", "route schema is invalid")
    local output: { [string]: any } = {}
    local count = 0
    for key, specification in pairs(schemaValue) do
        local item = specification :: any
        count += 1
        assert(count <= maximumFields and type(key) == "string" and #key <= 32 and string.match(key, "^[a-z][a-z0-9_]*$") ~= nil, "route schema field is invalid")
        assert(type(item) == "table" and exactKeys(item, { type = true, required = true, maximumLength = true, minimum = true, maximum = true, values = true }), "route schema specification is invalid")
        local kind = item.type
        assert(kind == "string" or kind == "integer" or kind == "boolean" or kind == "enum", "route schema type is invalid")
        assert(item.required == nil or type(item.required) == "boolean", "route schema required flag is invalid")
        local normalized = {} :: any
        normalized.type = kind
        normalized.required = item.required == true
        if kind == "string" then
            local maximumLength = item.maximumLength or 128
            assert(type(maximumLength) == "number" and maximumLength % 1 == 0 and maximumLength >= 1 and maximumLength <= 512, "route string limit is invalid")
            assert(item.minimum == nil and item.maximum == nil and item.values == nil, "route string specification is invalid")
            normalized.maximumLength = maximumLength
        elseif kind == "integer" then
            local minimum = item.minimum or -2147483648
            local maximum = item.maximum or 2147483647
            assert(type(minimum) == "number" and minimum % 1 == 0 and type(maximum) == "number" and maximum % 1 == 0 and minimum <= maximum, "route integer range is invalid")
            assert(item.maximumLength == nil and item.values == nil, "route integer specification is invalid")
            normalized.minimum = minimum
            normalized.maximum = maximum
        elseif kind == "enum" then
            assert(item.maximumLength == nil and item.minimum == nil and item.maximum == nil and type(item.values) == "table", "route enum specification is invalid")
            local values: { string } = {}
            local seen: { [string]: boolean } = {}
            for _, enumValue in item.values do
                assert(type(enumValue) == "string" and #enumValue >= 1 and #enumValue <= 64 and seen[enumValue] == nil, "route enum value is invalid")
                seen[enumValue] = true
                table.insert(values, enumValue)
            end
            assert(#values >= 1 and #values <= 32, "route enum values are invalid")
            normalized.values = table.freeze(values)
        else
            assert(item.maximumLength == nil and item.minimum == nil and item.maximum == nil and item.values == nil, "route boolean specification is invalid")
        end
        output[key] = table.freeze(normalized)
    end
    return output
end

local function decodeValue(raw: string, specification: any): any
    if specification.type == "string" then
        if #raw < 1 or #raw > specification.maximumLength then return nil end
        return raw
    elseif specification.type == "integer" then
        if string.match(raw, "^-?%d+$") == nil then return nil end
        local number = tonumber(raw)
        if number == nil or number % 1 ~= 0 or number < specification.minimum or number > specification.maximum then return nil end
        return number
    elseif specification.type == "boolean" then
        if raw == "true" then return true end
        if raw == "false" then return false end
        return nil
    else
        for _, item in specification.values do
            if raw == item then return raw end
        end
        return nil
    end
end

local function encodeValue(value: any, specification: any): string?
    if specification.type == "string" then
        if type(value) ~= "string" or #value < 1 or #value > specification.maximumLength then return nil end
        return value
    elseif specification.type == "integer" then
        if type(value) ~= "number" or value % 1 ~= 0 or value < specification.minimum or value > specification.maximum then return nil end
        return tostring(value)
    elseif specification.type == "boolean" then
        if type(value) ~= "boolean" then return nil end
        return value and "true" or "false"
    else
        if type(value) ~= "string" then return nil end
        for _, item in specification.values do
            if value == item then return value end
        end
        return nil
    end
end

local function exactSnapshot(value: any): boolean
    if type(value) ~= "table" then return false end
    local count = 0
    for key in pairs(value) do
        if key ~= "version" and key ~= "routes" then return false end
        count += 1
    end
    return count == 2
end

local Navigation = {}

function Navigation.decideBack(options: any): string
    assert(type(options) == "table" and exactKeys(options, { modalOpen = true, canBack = true }), "Back decision options are invalid")
    assert(type(options.modalOpen) == "boolean" and type(options.canBack) == "boolean", "Back decision state is invalid")
    if options.modalOpen then return "dismiss-modal" end
    if options.canBack then return "history" end
    return "exit"
end

function Navigation.create(options: Options): Stack
    assert(type(options) == "table" and type(options.routes) == "table", "navigation options are invalid")
    assert(#options.routes >= 1 and #options.routes <= maximumKnownRoutes, "navigation routes are empty or exceed the limit")
    local admitted: { [string]: boolean } = {}
    for _, route in options.routes do
        assert(type(route) == "string" and #route <= 64 and string.match(route, routePattern) ~= nil, "navigation route is invalid")
        assert(admitted[route] == nil, "navigation route is duplicated")
        admitted[route] = true
    end
    assert(admitted[options.initial] == true, "initial navigation route is not admitted")
    local maximumDepth = options.maximumDepth or maximumStackDepth
    assert(type(maximumDepth) == "number" and maximumDepth % 1 == 0 and maximumDepth >= 1 and maximumDepth <= maximumStackDepth, "maximum navigation depth is invalid")

    local routes = { options.initial }
    local stack = {} :: any

    function stack.current(): string
        return routes[#routes]
    end

    function stack.canBack(): boolean
        return #routes > 1
    end

    function stack.push(route: string): boolean
        assert(admitted[route] == true, "navigation route is not admitted")
        if routes[#routes] == route then return false end
        assert(#routes < maximumDepth, "navigation stack depth exceeded")
        table.insert(routes, route)
        return true
    end

    function stack.replace(route: string): boolean
        assert(admitted[route] == true, "navigation route is not admitted")
        if routes[#routes] == route then return false end
        routes[#routes] = route
        return true
    end

    function stack.back(): boolean
        if #routes <= 1 then return false end
        table.remove(routes)
        return true
    end

    function stack.snapshot(): Snapshot
        return { version = 1, routes = table.clone(routes) }
    end

    function stack.restore(snapshot: any): RestoreResult
        if not exactSnapshot(snapshot) or snapshot.version ~= 1 or type(snapshot.routes) ~= "table" then return { success = false, error = { code = "invalid_snapshot" } } end
        local snapshotRoutes = snapshot.routes :: { any }
        if #snapshotRoutes < 1 or #snapshotRoutes > maximumDepth then return { success = false, error = { code = "invalid_stack" } } end
        local restored: { string } = {}
        for index, route in snapshotRoutes do
            if type(index) ~= "number" or index % 1 ~= 0 or index < 1 or index > #snapshotRoutes or type(route) ~= "string" or admitted[route] ~= true then return { success = false, error = { code = "unknown_route" } } end
            restored[index] = route :: string
        end
        if #restored ~= #snapshotRoutes then return { success = false, error = { code = "invalid_stack" } } end
        routes = restored
        return { success = true, error = nil }
    end

    return table.freeze(stack) :: Stack
end

function Navigation.createRouter(options: any): EntryStack
    assert(type(options) == "table" and exactKeys(options, { compiler = true, initial = true, maximumDepth = true }), "router options are invalid")
    local compilerValue = options.compiler
    assert(type(compilerValue) == "table" and type(compilerValue.generate) == "function" and type(compilerValue.match) == "function", "route compiler is invalid")
    local compiler = compilerValue :: RouteCompiler
    local maximumDepth = options.maximumDepth or maximumStackDepth
    assert(type(maximumDepth) == "number" and maximumDepth % 1 == 0 and maximumDepth >= 1 and maximumDepth <= maximumStackDepth, "maximum navigation depth is invalid")

    local initial = compiler.generate(options.initial) :: RouteResult
    assert(initial.success and initial.entry ~= nil and initial.location ~= nil, "initial route entry is invalid")
    local records: { any } = { table.freeze({ entry = initial.entry, location = initial.location }) }
    local stack = {} :: any

    local function mutation(result: RouteResult, replace: boolean): MutationResult
        if not result.success or result.entry == nil or result.location == nil then
            return { success = false, changed = false, error = result.error or { code = "invalid_entry" } }
        end
        local current = records[#records]
        if current.location == result.location then return { success = true, changed = false } end
        local record = table.freeze({ entry = result.entry, location = result.location })
        if replace then
            if #records > 1 and records[#records - 1].location == result.location then
                table.remove(records)
            else
                records[#records] = record
            end
        else
            if #records >= maximumDepth then return { success = false, changed = false, error = { code = "stack_depth_exceeded" } } end
            table.insert(records, record)
        end
        return { success = true, changed = true }
    end

    function stack.current(): RouteEntry
        return records[#records].entry
    end

    function stack.currentLocation(): string
        return records[#records].location
    end

    function stack.canBack(): boolean
        return #records > 1
    end

    function stack.push(entry: any): MutationResult
        return mutation(compiler.generate(entry), false)
    end

    function stack.pushLocation(location: string): MutationResult
        return mutation(compiler.match(location), false)
    end

    function stack.replace(entry: any): MutationResult
        return mutation(compiler.generate(entry), true)
    end

    function stack.replaceLocation(location: string): MutationResult
        return mutation(compiler.match(location), true)
    end

    function stack.back(): boolean
        if #records <= 1 then return false end
        table.remove(records)
        return true
    end

    function stack.snapshot(): EntrySnapshot
        local entries: { RouteEntry } = {}
        for _, record in records do
            local params = copyMap(record.entry.params) :: { [string]: any }
            local query = copyMap(record.entry.query) :: { [string]: any }
            table.insert(entries, { name = record.entry.name, params = params, query = query })
        end
        return { version = 2, entries = entries }
    end

    function stack.encode(): string
        local output = "2:" .. tostring(#records) .. ":"
        for _, record in records do output ..= tostring(#record.location) .. ":" .. record.location end
        assert(#output <= maximumSnapshotBytes, "encoded navigation snapshot exceeds 4096 bytes")
        return output
    end

    function stack.restore(snapshot: any): RestoreResult
        if type(snapshot) ~= "table" or not exactKeys(snapshot, { version = true, entries = true }) or snapshot.version ~= 2 or type(snapshot.entries) ~= "table" then
            return { success = false, error = { code = "invalid_snapshot" } }
        end
        local snapshotEntries = snapshot.entries :: { any }
        if #snapshotEntries < 1 or #snapshotEntries > maximumDepth then return { success = false, error = { code = "invalid_stack" } } end
        local restored: { any } = {}
        local seen = 0
        for index, entry in snapshotEntries do
            seen += 1
            if type(index) ~= "number" or index % 1 ~= 0 or index < 1 or index > #snapshotEntries then return { success = false, error = { code = "invalid_stack" } } end
            local result = compiler.generate(entry) :: RouteResult
            if not result.success or result.entry == nil or result.location == nil then return { success = false, error = { code = "invalid_entry" } } end
            if #restored == 0 or restored[#restored].location ~= result.location then
                table.insert(restored, table.freeze({ entry = result.entry, location = result.location }))
            end
        end
        if seen ~= #snapshotEntries or #restored < 1 then return { success = false, error = { code = "invalid_stack" } } end
        records = restored
        return { success = true }
    end

    function stack.restoreEncoded(value: string): RestoreResult
        if type(value) ~= "string" or #value < 5 or #value > maximumSnapshotBytes or string.sub(value, 1, 2) ~= "2:" then
            return { success = false, error = { code = "invalid_snapshot" } }
        end
        local countEnd = string.find(value, ":", 3, true)
        if countEnd == nil then return { success = false, error = { code = "invalid_snapshot" } } end
        local countText = string.sub(value, 3, countEnd - 1)
        local count = tonumber(countText)
        if count == nil or count % 1 ~= 0 or count < 1 or count > maximumDepth or tostring(count) ~= countText then
            return { success = false, error = { code = "invalid_stack" } }
        end
        local cursor = countEnd + 1
        local entries: { RouteEntry } = {}
        for _ = 1, count do
            local lengthEnd = string.find(value, ":", cursor, true)
            if lengthEnd == nil then return { success = false, error = { code = "invalid_snapshot" } } end
            local lengthText = string.sub(value, cursor, lengthEnd - 1)
            local length = tonumber(lengthText)
            if length == nil or length % 1 ~= 0 or length < 1 or length > maximumLocationBytes or tostring(length) ~= lengthText then
                return { success = false, error = { code = "invalid_snapshot" } }
            end
            local locationStart = lengthEnd + 1
            local locationEnd = locationStart + length - 1
            if locationEnd > #value then return { success = false, error = { code = "invalid_snapshot" } } end
            local matched = compiler.match(string.sub(value, locationStart, locationEnd))
            if not matched.success or matched.entry == nil then return { success = false, error = { code = "invalid_entry" } } end
            table.insert(entries, matched.entry)
            cursor = locationEnd + 1
        end
        if cursor ~= #value + 1 then return { success = false, error = { code = "invalid_snapshot" } } end
        return stack.restore({ version = 2, entries = entries })
    end

    return table.freeze(stack) :: EntryStack
end

function Navigation.compile(definitionsValue: any): RouteCompiler
    assert(type(definitionsValue) == "table" and #definitionsValue >= 1 and #definitionsValue <= maximumKnownRoutes, "route definitions are empty or exceed the limit")
    local definitions: { any } = {}
    local byName: { [string]: any } = {}

    for index, source in definitionsValue do
        assert(type(index) == "number" and index % 1 == 0 and index >= 1 and index <= #definitionsValue and type(source) == "table", "route definition is invalid")
        assert(exactKeys(source, { name = true, path = true, parent = true, params = true, query = true }), "route definition is invalid")
        assert(type(source.name) == "string" and #source.name <= 64 and string.match(source.name, routePattern) ~= nil and byName[source.name] == nil, "route name is invalid or duplicated")
        assert(type(source.path) == "string" and #source.path >= 1 and #source.path <= 256 and string.find(source.path, "?", 1, true) == nil and string.find(source.path, "#", 1, true) == nil, "route path is invalid")
        assert(source.parent == nil or (type(source.parent) == "string" and byName[source.parent] ~= nil), "route parent must be declared before its child")

        local path = source.path
        if source.parent == nil then
            assert(string.sub(path, 1, 1) == "/", "root route path must be absolute")
        else
            assert(string.sub(path, 1, 1) ~= "/", "child route path must be relative")
        end
        if path ~= "/" then assert(string.sub(path, -1) ~= "/", "route path has a trailing separator") end

        local ownSegments = path == "/" and {} or split(string.sub(path, source.parent == nil and 2 or 1), "/")
        local params = validateSchema(source.params, maximumRouteSegments)
        local query = validateSchema(source.query, maximumQueryFields)
        local seenTemplateParams: { [string]: boolean } = {}
        local normalizedOwn: { any } = {}
        for _, segment in ownSegments do
            assert(#segment >= 1 and #segment <= 64, "route segment is invalid")
            if string.sub(segment, 1, 1) == ":" then
                local name = string.sub(segment, 2)
                assert(string.match(name, "^[a-z][a-z0-9_]*$") ~= nil and params[name] ~= nil and seenTemplateParams[name] == nil, "route path parameter is invalid")
                seenTemplateParams[name] = true
                table.insert(normalizedOwn, table.freeze({ kind = "parameter", value = name }))
            else
                assert(string.match(segment, "^[a-z0-9][a-z0-9_-]*$") ~= nil, "route literal segment is invalid")
                table.insert(normalizedOwn, table.freeze({ kind = "literal", value = segment }))
            end
        end
        for name in pairs(params) do
            assert(seenTemplateParams[name] == true, "route parameter schema is not used by its path")
        end

        local parent = source.parent and byName[source.parent] or nil
        local depth = parent and (parent.depth + 1) or 1
        assert(depth <= maximumNestingDepth, "route nesting depth exceeded")
        local fullSegments: { any } = {}
        local combinedParams: { [string]: any } = {}
        if parent then
            for _, segment in parent.segments do table.insert(fullSegments, segment) end
            for name, specification in pairs(parent.params) do combinedParams[name] = specification end
        end
        for name, specification in pairs(params) do
            assert(combinedParams[name] == nil, "nested route parameter is duplicated")
            combinedParams[name] = specification
        end
        for _, segment in normalizedOwn do table.insert(fullSegments, segment) end
        assert(#fullSegments <= maximumRouteSegments, "route segment limit exceeded")

        local definition = {
            name = source.name,
            parent = source.parent,
            depth = depth,
            segments = table.freeze(fullSegments),
            params = table.freeze(combinedParams),
            query = table.freeze(query),
        }
        table.freeze(definition)
        byName[source.name] = definition
        table.insert(definitions, definition)
    end
    assert(#definitions == #definitionsValue, "route definitions are sparse")

    local compiler = {} :: any

    function compiler.match(location: string): RouteResult
        if type(location) ~= "string" or #location < 1 or #location > maximumLocationBytes or string.sub(location, 1, 1) ~= "/" or string.find(location, "#", 1, true) ~= nil or string.find(location, "://", 1, true) ~= nil then
            return { success = false, error = { code = "invalid_location" } }
        end
        local question = string.find(location, "?", 1, true)
        local path = question and string.sub(location, 1, question - 1) or location
        local queryText = question and string.sub(location, question + 1) or ""
        if path ~= "/" and string.sub(path, -1) == "/" then return { success = false, error = { code = "invalid_location" } } end
        local rawSegments = path == "/" and {} or split(string.sub(path, 2), "/")
        if #rawSegments > maximumRouteSegments then return { success = false, error = { code = "invalid_location" } } end

        for _, definition in definitions do
            if #definition.segments == #rawSegments then
                local params: { [string]: any } = {}
                local matches = true
                for index, template in definition.segments do
                    local decoded = percentDecode(rawSegments[index])
                    if decoded == nil then
                        matches = false
                        break
                    elseif template.kind == "literal" then
                        if decoded ~= template.value then matches = false break end
                    else
                        local value = decodeValue(decoded, definition.params[template.value])
                        if value == nil then matches = false break end
                        params[template.value] = value
                    end
                end
                if matches then
                    local query: { [string]: any } = {}
                    local count = 0
                    if queryText ~= "" then
                        for _, pair in split(queryText, "&") do
                            count += 1
                            if count > maximumQueryFields then matches = false break end
                            local equal = string.find(pair, "=", 1, true)
                            if equal == nil or string.find(pair, "=", equal + 1, true) ~= nil then matches = false break end
                            local key = percentDecode(string.sub(pair, 1, equal - 1))
                            local raw = percentDecode(string.sub(pair, equal + 1))
                            local specification = key and definition.query[key] or nil
                            if key == nil or raw == nil or specification == nil or query[key] ~= nil then matches = false break end
                            local value = decodeValue(raw, specification)
                            if value == nil then matches = false break end
                            query[key] = value
                        end
                    elseif question ~= nil then
                        matches = false
                    end
                    if matches then
                        for key, specification in pairs(definition.query) do
                            if specification.required and query[key] == nil then matches = false break end
                        end
                    end
                    if matches then
                        local entry = table.freeze({ name = definition.name :: string, params = table.freeze(params), query = table.freeze(query) }) :: RouteEntry
                        local generated = compiler.generate(entry)
                        if generated.success then return { success = true, entry = entry, location = generated.location } end
                    end
                end
            end
        end
        return { success = false, error = { code = "route_not_found" } }
    end

    function compiler.generate(entryValue: any): RouteResult
        if type(entryValue) ~= "table" or not exactKeys(entryValue, { name = true, params = true, query = true }) or type(entryValue.name) ~= "string" then
            return { success = false, error = { code = "invalid_entry" } }
        end
        local definition = byName[entryValue.name]
        if definition == nil then return { success = false, error = { code = "unknown_route" } } end
        local params = copyMap(entryValue.params)
        local query = copyMap(entryValue.query)
        if params == nil or query == nil or not exactKeys(params, definition.params) or not exactKeys(query, definition.query) then
            return { success = false, error = { code = "invalid_entry" } }
        end

        local pathSegments: { string } = {}
        for _, template in definition.segments do
            if template.kind == "literal" then
                table.insert(pathSegments, template.value)
            else
                local raw = encodeValue(params[template.value], definition.params[template.value])
                if raw == nil then return { success = false, error = { code = "invalid_parameter" } } end
                table.insert(pathSegments, percentEncode(raw))
            end
        end
        local queryKeys: { string } = {}
        for key, specification in pairs(definition.query) do
            if query[key] == nil then
                if specification.required then return { success = false, error = { code = "missing_query" } } end
            else
                table.insert(queryKeys, key)
            end
        end
        table.sort(queryKeys)
        local pairsOutput: { string } = {}
        for _, key in queryKeys do
            local raw = encodeValue(query[key], definition.query[key])
            if raw == nil then return { success = false, error = { code = "invalid_query" } } end
            table.insert(pairsOutput, percentEncode(key) .. "=" .. percentEncode(raw))
        end
        local location = #pathSegments == 0 and "/" or ("/" .. table.concat(pathSegments, "/"))
        if #pairsOutput > 0 then location ..= "?" .. table.concat(pairsOutput, "&") end
        if #location > maximumLocationBytes then return { success = false, error = { code = "location_too_large" } } end
        local entry = table.freeze({ name = definition.name :: string, params = table.freeze(params), query = table.freeze(query) }) :: RouteEntry
        return { success = true, entry = entry, location = location }
    end

    function compiler.canonicalize(location: string): RouteResult
        return compiler.match(location)
    end

    return table.freeze(compiler) :: RouteCompiler
end

Navigation.limits = table.freeze({
    maximumKnownRoutes = maximumKnownRoutes,
    maximumStackDepth = maximumStackDepth,
    maximumLocationBytes = maximumLocationBytes,
    maximumRouteSegments = maximumRouteSegments,
    maximumQueryFields = maximumQueryFields,
    maximumNestingDepth = maximumNestingDepth,
    maximumSnapshotBytes = maximumSnapshotBytes,
})

return table.freeze(Navigation)
