-- Generated from protocol/schema.v1.json. Do not edit.
--!strict

export type CapabilityRequest = { version: number, kind: string, requestId: number, traceId: string, deadlineMs: number, payload: any }
export type CapabilityResponse = { version: number, requestId: number, traceId: string, status: string, payload: any }
export type RendererPatch = { kind: string, target: string, name: string, value: string }
export type RendererBatch = { version: number, sequence: number, patches: { RendererPatch } }
export type RpcRequest = { version: number, operation: string, input: any, traceId: string, deadlineMs: number }
export type RpcError = { code: string, message: string }
export type RpcResponse = { version: number, success: boolean, data: any?, error: RpcError?, traceId: string }

local Protocol = {}
Protocol.version = 1
Protocol.limits = {
    envelopeBytes = 65536, stringBytes = 4096, traceIdBytes = 64,
    nestingDepth = 16, collectionItems = 1024, objectProperties = 128,
    inFlightRequests = 16, minimumDeadlineMs = 1, maximumDeadlineMs = 30000,
    rendererBatchPatches = 4096,
}
local capabilityKinds = { ["app.launchurl.get"] = true, ["clipboard.write"] = true, ["media.command"] = true, ["navigation.history"] = true, ["rpc.call"] = true, ["storage.get"] = true, ["storage.set"] = true, ["timer.control"] = true, ["timer.sleep"] = true }
local patchKinds = { ["append"] = true, ["attribute"] = true, ["create"] = true, ["event"] = true, ["focus"] = true, ["modal"] = true, ["place"] = true, ["remove"] = true, ["remove-attribute"] = true, ["text"] = true }
local semanticTags = { ["a"] = true, ["button"] = true, ["code"] = true, ["dialog"] = true, ["div"] = true, ["h1"] = true, ["h2"] = true, ["h3"] = true, ["hr"] = true, ["img"] = true, ["input"] = true, ["label"] = true, ["li"] = true, ["main"] = true, ["p"] = true, ["pre"] = true, ["section"] = true, ["span"] = true, ["table"] = true, ["td"] = true, ["th"] = true, ["tr"] = true, ["ul"] = true }
local attributes = { ["alt"] = true, ["aria-busy"] = true, ["aria-controls"] = true, ["aria-describedby"] = true, ["aria-expanded"] = true, ["aria-hidden"] = true, ["aria-invalid"] = true, ["aria-label"] = true, ["aria-live"] = true, ["autocomplete"] = true, ["class"] = true, ["data-language"] = true, ["data-luastra-aspect-ratio"] = true, ["data-luastra-background-color"] = true, ["data-luastra-corner-radius"] = true, ["data-luastra-document-description"] = true, ["data-luastra-document-language"] = true, ["data-luastra-document-title"] = true, ["data-luastra-fill"] = true, ["data-luastra-height"] = true, ["data-luastra-stroke"] = true, ["data-luastra-stroke-width"] = true, ["data-luastra-text-color"] = true, ["data-luastra-theme-accent"] = true, ["data-luastra-theme-background"] = true, ["data-luastra-theme-danger"] = true, ["data-luastra-theme-muted"] = true, ["data-luastra-theme-success"] = true, ["data-luastra-theme-surface"] = true, ["data-luastra-theme-text"] = true, ["data-luastra-theme-warning"] = true, ["data-luastra-width"] = true, ["decoding"] = true, ["disabled"] = true, ["enterkeyhint"] = true, ["hidden"] = true, ["href"] = true, ["inputmode"] = true, ["loading"] = true, ["placeholder"] = true, ["rel"] = true, ["required"] = true, ["role"] = true, ["scope"] = true, ["src"] = true, ["target"] = true, ["type"] = true, ["value"] = true }
local rendererEvents = { ["click"] = true, ["dismiss"] = true, ["input"] = true }
local componentTypes = { ["Button"] = true, ["Code"] = true, ["CodeBlock"] = true, ["Column"] = true, ["Divider"] = true, ["FlipCard"] = true, ["Image"] = true, ["Layer"] = true, ["Link"] = true, ["List"] = true, ["ListItem"] = true, ["Modal"] = true, ["Row"] = true, ["Screen"] = true, ["Shape"] = true, ["Table"] = true, ["TableCell"] = true, ["TableRow"] = true, ["Text"] = true, ["TextInput"] = true }
local rpcOperations = { ["server.call.v1"] = true, ["tasks.admin.v1"] = true, ["tasks.fail.v1"] = true, ["tasks.list.v1"] = true, ["tasks.slow.v1"] = true }
local capabilityRequestKeys = { version = true, kind = true, requestId = true, traceId = true, deadlineMs = true, payload = true }
local capabilityResponseKeys = { version = true, requestId = true, traceId = true, status = true, payload = true }
local rendererPatchKeys = { kind = true, target = true, name = true, value = true }
local rpcRequestKeys = { version = true, operation = true, input = true, traceId = true, deadlineMs = true }
local resultStatuses = { ["ok"] = true, ["error"] = true, ["cancelled"] = true, ["deadline"] = true }
local errorCodes = { ["CANCELLED"] = true, ["DEADLINE"] = true, ["FORBIDDEN"] = true, ["INTERNAL"] = true, ["NETWORK"] = true, ["UNAUTHORIZED"] = true, ["VALIDATION"] = true }

local function exactKeys(value: any, allowed: { [string]: boolean }, expected: number): boolean
    if type(value) ~= "table" then return false end
    local count = 0
    for key in pairs(value) do
        if type(key) ~= "string" or allowed[key] ~= true then return false end
        count += 1
    end
    return count == expected
end

local function boundedString(value: any, maximum: number): boolean
    return type(value) == "string" and #value <= maximum
end

local function identifier(value: any): boolean
    return boundedString(value, 128) and string.match(value, "^[a-z][a-z0-9_/-]*$") ~= nil and string.find(value, "//", 1, true) == nil
end

local function traceId(value: any): boolean
    return boundedString(value, Protocol.limits.traceIdBytes) and string.match(value, "^[A-Za-z0-9][A-Za-z0-9%._:%-]*$") ~= nil
end

local function deadline(value: any): boolean
    return type(value) == "number" and value % 1 == 0 and value >= Protocol.limits.minimumDeadlineMs and value <= Protocol.limits.maximumDeadlineMs
end

function Protocol.validateCapabilityRequest(value: any): boolean
    return exactKeys(value, capabilityRequestKeys, 6) and value.version == 1 and capabilityKinds[value.kind] == true and
        type(value.requestId) == "number" and value.requestId > 0 and value.requestId % 1 == 0 and
        traceId(value.traceId) and deadline(value.deadlineMs) and value.payload ~= nil
end

function Protocol.validateCapabilityResponse(value: any): boolean
    if not exactKeys(value, capabilityResponseKeys, 5) or value.version ~= 1 or resultStatuses[value.status] ~= true or
        type(value.requestId) ~= "number" or value.requestId <= 0 or value.requestId % 1 ~= 0 or not traceId(value.traceId) then return false end
    if value.status == "error" then
        return type(value.payload) == "table" and errorCodes[value.payload.code] == true and boundedString(value.payload.message, 512)
    end
    return value.payload ~= nil
end

function Protocol.validateRendererPatch(value: any): boolean
    if not exactKeys(value, rendererPatchKeys, 4) or patchKinds[value.kind] ~= true or not identifier(value.target) or
        not boundedString(value.name, 128) or not boundedString(value.value, Protocol.limits.stringBytes) then return false end
    if value.kind == "create" then return value.name == "" and semanticTags[value.value] == true end
    if value.kind == "attribute" then return attributes[value.name] == true end
    if value.kind == "remove-attribute" then return attributes[value.name] == true and value.value == "" end
    if value.kind == "event" then return rendererEvents[value.name] == true and boundedString(value.value, 64) end
    if value.kind == "append" then return value.name == "" and identifier(value.value) end
    if value.kind == "place" then return identifier(value.name) and (value.value == "" or identifier(value.value)) end
    if value.kind == "focus" or value.kind == "remove" then return value.name == "" and value.value == "" end
    if value.kind == "modal" then return value.name == "" and (value.value == "open" or value.value == "closed") end
    return value.kind == "text" and value.name == ""
end

function Protocol.validComponentType(value: any): boolean
    return type(value) == "string" and componentTypes[value] == true
end

function Protocol.validateRpcRequest(value: any): boolean
    return exactKeys(value, rpcRequestKeys, 5) and value.version == 1 and rpcOperations[value.operation] == true and
        traceId(value.traceId) and deadline(value.deadlineMs) and value.input ~= nil
end

return Protocol
