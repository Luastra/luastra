--!strict

export type Context = {
    id: string,
    claim: (requestId: number, purpose: string) -> number,
    cancel: (requestId: number) -> boolean,
    owns: (requestId: number, generation: number) -> boolean,
    activeCount: () -> number,
}

export type Feature<T> = {
    id: string,
    render: ((context: Context) -> T)?,
    handle: ((context: Context, action: string, target: string, value: string) -> ())?,
    resolve: ((
        context: Context,
        requestId: number,
        success: boolean,
        payload: string,
        errorCode: string,
        errorMessage: string,
        purpose: string,
        generation: number
    ) -> ())?,
    dispose: ((context: Context) -> ())?,
}

export type ComposeOptions<T, S> = {
    features: { Feature<T> }?,
    render: (outputs: { [string]: T }) -> T,
    handle: ((action: string, target: string, value: string) -> ())?,
    resolve: ((requestId: number, success: boolean, payload: string, errorCode: string, errorMessage: string) -> ())?,
    snapshot: () -> S,
}

export type Diagnostics = {
    disposed: boolean,
    featureIds: { string },
    activeRequests: number,
    suppressedResults: number,
}

export type Instance<T, S> = {
    render: () -> T,
    handle: (action: string, target: string, value: string) -> (),
    resolve: (requestId: number, success: boolean, payload: string, errorCode: string, errorMessage: string) -> (),
    snapshot: () -> S,
    inspect: () -> Diagnostics,
}

type Ownership = {
    featureId: string,
    generation: number,
    purpose: string,
}

type FeatureRecord<T> = {
    feature: Feature<T>,
    context: Context,
    generation: number,
    active: boolean,
}

local maximumFeatures = 64
local maximumPurposeBytes = 128
local maximumIdBytes = 128
local maximumRequestId = 9007199254740991
local maximumActionBytes = 128
local maximumTargetBytes = 256
local maximumEventValueBytes = 4096
local maximumResolvePayloadBytes = 65536
local maximumErrorCodeBytes = 64
local maximumErrorMessageBytes = 512

local function boundedRequestId(value: any): number
    assert(type(value) == "number" and value == value and math.abs(value) ~= math.huge and value % 1 == 0 and value >= 1 and value <= maximumRequestId, "feature requestId must be a safe positive integer")
    return value
end

local function path(value: any, label: string, maximumBytes: number): string
    assert(type(value) == "string" and #value >= 1 and #value <= maximumBytes, label .. " must be bounded")
    assert(string.sub(value, 1, 1) ~= "/" and string.sub(value, -1) ~= "/" and string.find(value, "//", 1, true) == nil, label .. " must use lowercase path segments")
    for segment in string.gmatch(value, "[^/]+") do
        assert(string.match(segment, "^[a-z][a-z0-9_-]*$") ~= nil, label .. " must use lowercase path segments")
    end
    return value
end

local function targetOwnedBy(featureId: string, target: string): boolean
    return target == featureId or string.sub(target, 1, #featureId + 1) == featureId .. "/"
end

local App = {}

function App.compose<T, S>(optionsValue: ComposeOptions<T, S>): Instance<T, S>
    assert(type(optionsValue) == "table", "App.compose requires a table")
    local features = optionsValue.features or {}
    assert(type(features) == "table" and #features <= maximumFeatures, "App.compose features must contain at most 64 items")
    assert(type(optionsValue.render) == "function", "App.compose render must be a function")
    assert(optionsValue.handle == nil or type(optionsValue.handle) == "function", "App.compose handle must be a function")
    assert(optionsValue.resolve == nil or type(optionsValue.resolve) == "function", "App.compose resolve must be a function")
    assert(type(optionsValue.snapshot) == "function", "App.compose snapshot must be a function")
    assert(optionsValue.resolve == nil or #features == 0, "App.compose root resolve cannot be combined with features")

    local records: { FeatureRecord<T> } = {}
    local byId: { [string]: FeatureRecord<T> } = {}
    local ownership: { [number]: Ownership } = {}
    local disposed = false
    local suppressedResults = 0

    local function countOwned(featureId: string?): number
        local count = 0
        for _, owner in pairs(ownership) do
            if featureId == nil or owner.featureId == featureId then count += 1 end
        end
        return count
    end

    local function suppress()
        suppressedResults = math.min(suppressedResults + 1, 2147483647)
    end

    for index, feature in ipairs(features) do
        assert(type(feature) == "table", "App.compose feature at " .. tostring(index) .. " must be a table")
        local id = path(feature.id, "feature id", maximumIdBytes)
        assert(byId[id] == nil, "App.compose feature id is duplicated: " .. id)
        assert(feature.render == nil or type(feature.render) == "function", "feature render must be a function")
        assert(feature.handle == nil or type(feature.handle) == "function", "feature handle must be a function")
        assert(feature.resolve == nil or type(feature.resolve) == "function", "feature resolve must be a function")
        assert(feature.dispose == nil or type(feature.dispose) == "function", "feature dispose must be a function")
        for previousId in pairs(byId) do
            assert(not targetOwnedBy(previousId, id) and not targetOwnedBy(id, previousId), "App.compose feature namespaces overlap: " .. previousId .. " and " .. id)
        end

        local record: FeatureRecord<T>
        local context: Context
        context = table.freeze({
            id = id,
            claim = function(requestIdValue: number, purposeValue: string): number
                assert(record.active and not disposed, "disposed feature cannot claim requests")
                local requestId = boundedRequestId(requestIdValue)
                local purpose = path(purposeValue, "request purpose", maximumPurposeBytes)
                assert(ownership[requestId] == nil, "requestId is already owned: " .. tostring(requestId))
                ownership[requestId] = { featureId = id, generation = record.generation, purpose = purpose }
                return record.generation
            end,
            cancel = function(requestIdValue: number): boolean
                local requestId = boundedRequestId(requestIdValue)
                local owner = ownership[requestId]
                if owner == nil or owner.featureId ~= id or owner.generation ~= record.generation then return false end
                ownership[requestId] = nil
                return true
            end,
            owns = function(requestIdValue: number, generation: number): boolean
                local requestId = boundedRequestId(requestIdValue)
                local owner = ownership[requestId]
                return owner ~= nil and owner.featureId == id and owner.generation == generation and record.active and not disposed
            end,
            activeCount = function(): number
                return countOwned(id)
            end,
        }) :: Context
        record = { feature = feature, context = context, generation = 1, active = true }
        table.insert(records, record)
        byId[id] = record
    end

    local function disposeAll()
        if disposed then return end
        disposed = true
        for _, record in ipairs(records) do
            record.active = false
            record.generation += 1
        end
        ownership = {}
        for _, record in ipairs(records) do
            if record.feature.dispose ~= nil then record.feature.dispose(record.context) end
        end
    end

    local Instance = {}

    function Instance.render(): T
        local outputs: { [string]: T } = {}
        for _, record in ipairs(records) do
            if record.feature.render ~= nil then outputs[record.feature.id] = record.feature.render(record.context) end
        end
        return optionsValue.render(outputs)
    end

    function Instance.handle(action: string, target: string, value: string)
        assert(type(action) == "string" and #action >= 1 and #action <= maximumActionBytes, "App.handle action is invalid")
        assert(type(target) == "string" and #target >= 1 and #target <= maximumTargetBytes, "App.handle target is invalid")
        assert(type(value) == "string" and #value <= maximumEventValueBytes, "App.handle value is invalid")
        if disposed then return end
        if action == "lifecycle" and target == "app" then
            if value == "dispose" then
                for _, record in ipairs(records) do record.active = false end
            end
            for _, record in ipairs(records) do
                if record.feature.handle ~= nil then record.feature.handle(record.context, action, target, value) end
            end
            if optionsValue.handle ~= nil then optionsValue.handle(action, target, value) end
            if value == "dispose" then disposeAll() end
            return
        end
        for _, record in ipairs(records) do
            if targetOwnedBy(record.feature.id, target) then
                if record.feature.handle ~= nil then record.feature.handle(record.context, action, target, value) end
                return
            end
        end
        if optionsValue.handle ~= nil then optionsValue.handle(action, target, value) end
    end

    function Instance.resolve(requestIdValue: number, success: boolean, payload: string, errorCode: string, errorMessage: string)
        local requestId = boundedRequestId(requestIdValue)
        assert(type(success) == "boolean", "App.resolve success must be a boolean")
        assert(type(payload) == "string" and #payload <= maximumResolvePayloadBytes, "App.resolve payload is invalid")
        assert(type(errorCode) == "string" and #errorCode <= maximumErrorCodeBytes, "App.resolve errorCode is invalid")
        assert(type(errorMessage) == "string" and #errorMessage <= maximumErrorMessageBytes, "App.resolve errorMessage is invalid")
        local owner = ownership[requestId]
        if owner == nil then
            if not disposed and optionsValue.resolve ~= nil then
                optionsValue.resolve(requestId, success, payload, errorCode, errorMessage)
            else
                suppress()
            end
            return
        end
        ownership[requestId] = nil
        local record = byId[owner.featureId]
        if disposed or record == nil or not record.active or record.generation ~= owner.generation then suppress() return end
        if record.feature.resolve ~= nil then
            record.feature.resolve(record.context, requestId, success, payload, errorCode, errorMessage, owner.purpose, owner.generation)
        end
    end

    function Instance.snapshot(): S
        return optionsValue.snapshot()
    end

    function Instance.inspect(): Diagnostics
        local ids: { string } = {}
        for index, record in ipairs(records) do ids[index] = record.feature.id end
        return table.freeze({
            disposed = disposed,
            featureIds = table.freeze(ids),
            activeRequests = countOwned(nil),
            suppressedResults = suppressedResults,
        }) :: Diagnostics
    end

    return table.freeze(Instance) :: Instance<T, S>
end

App.limits = table.freeze({
    maximumFeatures = maximumFeatures,
    maximumPurposeBytes = maximumPurposeBytes,
    maximumIdBytes = maximumIdBytes,
    maximumRequestId = maximumRequestId,
    maximumActionBytes = maximumActionBytes,
    maximumTargetBytes = maximumTargetBytes,
    maximumEventValueBytes = maximumEventValueBytes,
    maximumResolvePayloadBytes = maximumResolvePayloadBytes,
    maximumErrorCodeBytes = maximumErrorCodeBytes,
    maximumErrorMessageBytes = maximumErrorMessageBytes,
})

return table.freeze(App)
