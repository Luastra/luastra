--!strict

local App = require("luastra/app")
local Collection = require("luastra/collection")
local Host = require("luastra/host")
local Resource = require("luastra/resource")
local UI = require("luastra/ui")

type Record = { id: string, value: string }

local function asyncFeature(id: string): App.Feature<UI.Node>
    local state: Resource.ReadState<string> = Resource.new { isEmpty = function(value: string): boolean return value == "" end }
    local tickets: { [number]: Resource.Ticket } = {}
    local resolvedPurpose = "none"

    return {
        id = id,
        render = function(_context: App.Context): UI.Node
            local snapshot = state.snapshot()
            return UI.Card {
                id = id .. "/card",
                UI.Text { id = id .. "/status", text = snapshot.status },
                UI.Text { id = id .. "/value", text = snapshot.value or "none" },
                UI.Text { id = id .. "/purpose", text = resolvedPurpose },
                UI.Button { id = id .. "/start", text = "Start", onTap = "start" },
            }
        end,
        handle = function(context: App.Context, action: string, target: string, _value: string)
            if action ~= "start" or target ~= id .. "/start" then return end
            local requestId = Host.storageGet(id .. ".value")
            tickets[requestId] = state.begin(requestId, "load")
            context.claim(requestId, "load")
        end,
        resolve = function(_context: App.Context, requestId: number, success: boolean, payload: string, errorCode: string, _errorMessage: string, purpose: string, _generation: number)
            local ticket = tickets[requestId]
            if ticket == nil then return end
            tickets[requestId] = nil
            resolvedPurpose = purpose
            if success then state.resolve(ticket, payload)
            else state.reject(ticket, Resource.error(errorCode, errorCode == "NETWORK")) end
        end,
        dispose = function(_context: App.Context)
            state.cancel()
            tickets = {}
        end,
    }
end

local collection: Collection.State<Record> = Collection.new {
    key = function(item: Record): string return item.id end,
    maxItems = 300,
    maxPages = 3,
    maxPageItems = 100,
}
local collectionRequest = 0
local traversed = 0
local probe = "idle"
local optimisticValue = "before"
local announcement = "No records loaded."

local function page(first: number, last: number, previousCursor: string?, nextCursor: string?): Collection.Page<Record>
    local items: { Record } = {}
    for value = first, last do table.insert(items, { id = "record-" .. tostring(value), value = tostring(value) }) end
    return { items = items, previousCursor = previousCursor, nextCursor = nextCursor, revision = "fixture-v1" }
end

local collectionFeature: App.Feature<UI.Node> = {
    id = "records",
    render = function(_context: App.Context): UI.Node
        local snapshot = collection.snapshot()
        local first = if #snapshot.items == 0 then "none" else snapshot.items[1].value
        local last = if #snapshot.items == 0 then "none" else snapshot.items[#snapshot.items].value
        local nextError = "none"
        if snapshot.nextError ~= nil then nextError = snapshot.nextError.code end
        local recordViews: { UI.Node } = {}
        for _, item in snapshot.items do
            table.insert(recordViews, UI.ListItem {
                id = "records/items/" .. item.id,
                UI.Button {
                    id = "records/items/" .. item.id .. "/open",
                    text = "Record " .. item.value,
                    onTap = "inspect",
                },
            })
        end
        local itemOffset = 0
        if #snapshot.items > 0 then
            local firstNumber = tonumber(snapshot.items[1].value)
            assert(firstNumber ~= nil)
            itemOffset = (firstNumber :: number) - 1
        end
        return UI.Card {
            id = "records/card",
            UI.Text { id = "records/status", text = snapshot.status },
            UI.Text { id = "records/announcement", text = announcement, role = "status" },
            UI.Text { id = "records/count", text = tostring(#snapshot.items) },
            UI.Text { id = "records/pages", text = tostring(snapshot.pageCount) },
            UI.Text { id = "records/first", text = first },
            UI.Text { id = "records/last", text = last },
            UI.Text { id = "records/traversed", text = tostring(traversed) },
            UI.Text { id = "records/probe", text = probe },
            UI.Text { id = "records/next-error", text = nextError },
            UI.Text { id = "records/optimistic", text = optimisticValue },
            UI.Button { id = "records/load", text = "Load", onTap = "load" },
            UI.Button { id = "records/next", text = "Next", onTap = "next", disabled = not snapshot.hasNext },
            UI.Button { id = "records/probes", text = "Run probes", onTap = "probes" },
            UI.Button { id = "records/duplicate", text = "Merge duplicate", onTap = "duplicate" },
            UI.Button { id = "records/cycle", text = "Reject cursor cycle", onTap = "cycle" },
            UI.List {
                id = "records/items",
                label = "Retained records",
                mode = "windowed",
                estimatedItemSize = 48,
                overscan = 4,
                itemCount = 100000,
                itemOffset = itemOffset,
                startBusy = snapshot.loading == "previous",
                endBusy = snapshot.loading == "next",
                onStartReached = if snapshot.hasPrevious then "previous" else nil,
                onEndReached = if snapshot.hasNext then "next" else nil,
                table.unpack(recordViews),
            },
        }
    end,
    handle = function(_context: App.Context, action: string, target: string, _value: string)
        if target == "records/load" and action == "load" then
            collectionRequest += 1
            local ticket = collection.begin("initial", collectionRequest)
            local result = collection.resolve(ticket, page(1, 100, nil, "100"))
            assert(result.accepted)
            traversed = 100
            announcement = "Showing records 1 through 100."
        elseif (target == "records/next" or target == "records/items") and action == "next" then
            collectionRequest += 1
            local ticket = collection.begin("next", collectionRequest)
            local cursor = tonumber(ticket.cursor)
            assert(cursor ~= nil)
            local first = cursor + 1
            local last = math.min(first + 99, 100000)
            local nextCursor = if last < 100000 then tostring(last) else nil
            local result = collection.resolve(ticket, page(first, last, tostring(first - 1), nextCursor))
            assert(result.accepted)
            traversed = last
            local resolved = collection.snapshot()
            announcement = "Showing records " .. resolved.items[1].value .. " through " .. resolved.items[#resolved.items].value .. "."
        elseif target == "records/items" and action == "previous" then
            collectionRequest += 1
            local ticket = collection.begin("previous", collectionRequest)
            local cursor = tonumber(ticket.cursor)
            assert(cursor ~= nil)
            local last = cursor
            local first = math.max(1, last - 99)
            local previousCursor = if first > 1 then tostring(first - 1) else nil
            local result = collection.resolve(ticket, page(first, last, previousCursor, tostring(last)))
            assert(result.accepted)
            local resolved = collection.snapshot()
            announcement = "Showing records " .. resolved.items[1].value .. " through " .. resolved.items[#resolved.items].value .. "."
        elseif target == "records/probes" and action == "probes" then
            local read: Resource.ReadState<string> = Resource.new { isEmpty = function(value: string): boolean return value == "" end }
            local oldTicket = read.begin(9001, "load")
            local currentTicket = read.begin(9002, "refresh")
            local staleAccepted = read.resolve(oldTicket, "stale")
            local currentAccepted = read.resolve(currentTicket, "current")

            local mutation: Resource.MutationState<string> = Resource.newMutation { retryable = true, accept = function(_value: string): boolean return true end }
            local mutationTicket = mutation.begin(9003, {
                idempotencyKey = "fixture-mutation-1",
                optimistic = {
                    apply = function() optimisticValue = "optimistic" end,
                    rollback = function() optimisticValue = "before" end,
                },
            })
            local rejected = mutation.reject(mutationTicket, Resource.error("NETWORK", true))
            probe = tostring(not staleAccepted and currentAccepted and rejected and read.snapshot().value == "current" and mutation.snapshot().status == "failed")
        elseif target == "records/duplicate" and action == "duplicate" then
            collectionRequest += 1
            local ticket = collection.begin("next", collectionRequest)
            local result = collection.resolve(ticket, page(100, 101, "99", "101"))
            assert(result.accepted)
        elseif target == "records/cycle" and action == "cycle" then
            collectionRequest += 1
            local ticket = collection.begin("next", collectionRequest)
            local result = collection.resolve(ticket, { items = {}, previousCursor = nil, nextCursor = ticket.cursor, revision = "fixture-v1" })
            assert(not result.accepted and result.error == "CURSOR_CYCLE")
            announcement = "Loading failed: cursor cycle."
        elseif action == "inspect" then
            local selected = string.match(target, "^records/items/record%-(%d+)/open$")
            if selected ~= nil then announcement = "Selected record " .. selected .. "." end
        end
    end,
}

local alpha = asyncFeature("alpha")
local beta = asyncFeature("beta")

return App.compose {
    features = { alpha, beta, collectionFeature },
    render = function(outputs: { [string]: UI.Node }): UI.Node
        return UI.Screen {
            id = "state-foundations",
            UI.Text { id = "title", text = "Universal state foundations", variant = "title" },
            outputs.alpha :: UI.Node,
            outputs.beta :: UI.Node,
            outputs.records :: UI.Node,
        }
    end,
    snapshot = function()
        return table.freeze({
            traversed = traversed,
            records = collection.snapshot(),
            probe = probe,
        })
    end,
}
