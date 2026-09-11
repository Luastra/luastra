--!strict

local App = require("luastra/app")
local Collection = require("luastra/collection")
local Resource = require("luastra/resource")
local UI = require("luastra/ui")

type Item = { id: string, value: string }

local function item(value: number): Item
    return { id = "item-" .. tostring(value), value = tostring(value) }
end

local function page(first: number, last: number, previousCursor: string?, nextCursor: string?): Collection.Page<Item>
    local items: { Item } = {}
    for value = first, last do table.insert(items, item(value)) end
    return { items = items, previousCursor = previousCursor, nextCursor = nextCursor, revision = "contract-v1" }
end

local function collection(maxItems: number, maxPages: number): Collection.State<Item>
    return Collection.new {
        key = function(value: Item): string return value.id end,
        maxItems = maxItems,
        maxPages = maxPages,
        maxPageItems = 4,
    }
end

local bidirectional = collection(8, 4)
assert(bidirectional.resolve(bidirectional.begin("initial", 1), page(3, 4, "before", "after")).accepted)
assert(bidirectional.resolve(bidirectional.begin("previous", 2), page(1, 2, nil, "2")).accepted)
assert(bidirectional.resolve(bidirectional.begin("next", 3), page(5, 6, "4", nil)).accepted)
assert(bidirectional.setAnchor("item-3"))
assert(bidirectional.replace("item-3", { id = "item-3", value = "three" }))
assert(bidirectional.insert(item(0), "start"))
assert(bidirectional.remove("item-2"))
local bidirectionalSnapshot = bidirectional.snapshot()
assert(#bidirectionalSnapshot.items == 6)
assert(bidirectionalSnapshot.items[1].value == "0")
assert(bidirectionalSnapshot.items[3].value == "three")
assert(bidirectionalSnapshot.items[6].value == "6")
assert(not bidirectionalSnapshot.hasPrevious and not bidirectionalSnapshot.hasNext)

local anchored = collection(4, 2)
assert(anchored.resolve(anchored.begin("initial", 10), page(3, 4, "2", "4")).accepted)
assert(anchored.resolve(anchored.begin("next", 11), page(5, 6, "4", "6")).accepted)
assert(anchored.setAnchor("item-5"))
assert(anchored.resolve(anchored.begin("next", 12), page(7, 8, "6", "8")).accepted)
local anchoredSnapshot = anchored.snapshot()
assert(#anchoredSnapshot.items == 4 and anchoredSnapshot.items[1].value == "5" and anchoredSnapshot.items[4].value == "8")
assert(anchoredSnapshot.pageCount == 2 and anchoredSnapshot.anchorKey == "item-5")
local collectionMutationAccepted = pcall(function() (anchored :: any).unexpected = true end)
assert(not collectionMutationAccepted)

local frozenResource: Resource.ReadState<string> = Resource.new {
    isEmpty = function(value: string): boolean return value == "" end,
}
local resourceMutationAccepted = pcall(function() (frozenResource :: any).unexpected = true end)
assert(not resourceMutationAccepted)

local invalid = collection(4, 2)
local invalidTicket = invalid.begin("initial", 20)
local invalidResult = invalid.resolve(invalidTicket, {
    items = { item(1), item(1) },
    previousCursor = nil,
    nextCursor = nil,
    revision = "contract-v1",
})
assert(not invalidResult.accepted and invalidResult.error == "DUPLICATE_ITEM_KEY")
assert(invalid.snapshot().status == "error")

local cancelled = collection(4, 2)
local cancelledTicket = cancelled.begin("initial", 30)
assert(cancelled.cancel(cancelledTicket))
local stale = cancelled.resolve(cancelledTicket, page(1, 2, nil, nil))
assert(not stale.accepted and stale.error == "STALE_RESULT")
assert(cancelled.snapshot().status == "cancelled")

local edgeFailure = collection(4, 2)
assert(edgeFailure.resolve(edgeFailure.begin("initial", 40), page(1, 2, nil, "2")).accepted)
local edgeTicket = edgeFailure.begin("next", 41)
assert(edgeFailure.reject(edgeTicket, Resource.error("NETWORK", true)))
local edgeSnapshot = edgeFailure.snapshot()
assert(edgeSnapshot.status == "ready" and edgeSnapshot.nextError ~= nil and edgeSnapshot.nextError.code == "NETWORK")

local slowPage = collection(4, 2)
assert(slowPage.resolve(slowPage.begin("initial", 42), page(1, 2, nil, "2")).accepted)
local slowTicket = slowPage.begin("next", 43)
local slowSnapshot = slowPage.snapshot()
assert(slowSnapshot.loading == "next" and #slowSnapshot.items == 2)
assert(slowPage.resolve(slowTicket, page(3, 4, "2", nil)).accepted)

local refreshed = collection(4, 2)
assert(refreshed.resolve(refreshed.begin("initial", 50), page(1, 2, nil, "2")).accepted)
refreshed.invalidate()
assert(refreshed.snapshot().invalidated)
local refreshTicket = refreshed.begin("refresh", 51, "anchor")
assert(refreshTicket.cursor == "anchor")
assert(refreshed.resolve(refreshTicket, page(9, 10, nil, nil)).accepted)
local refreshSnapshot = refreshed.snapshot()
assert(not refreshSnapshot.invalidated and refreshSnapshot.items[1].value == "9")

local stableIdentity = collection(4, 2)
local mutableItem = item(70)
assert(stableIdentity.resolve(stableIdentity.begin("initial", 60), {
    items = { mutableItem },
    previousCursor = nil,
    nextCursor = nil,
    revision = "contract-v1",
}).accepted)
mutableItem.id = "changed-after-admission"
assert(stableIdentity.snapshot().keys[1] == "item-70")
assert(stableIdentity.remove("item-70"))
assert(#stableIdentity.snapshot().items == 0)

return App.compose {
    features = {},
    render = function(): UI.Node
        return UI.Screen {
            id = "collection-contract",
            UI.Text { id = "contract-status", text = "PASS" },
            UI.Text { id = "contract-window", text = anchoredSnapshot.items[1].value .. ":" .. anchoredSnapshot.items[4].value },
        }
    end,
    snapshot = function()
        return table.freeze({ first = anchoredSnapshot.items[1].value, last = anchoredSnapshot.items[4].value })
    end,
}
