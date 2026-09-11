--!strict

local Resource = require("luastra/resource")

export type Error = Resource.Error
export type Direction = "initial" | "refresh" | "next" | "previous"
export type Status = "idle" | "loading" | "ready" | "empty" | "refreshing" | "error" | "stale-error" | "cancelled"

export type Page<T> = {
    items: { T },
    previousCursor: string?,
    nextCursor: string?,
    revision: string?,
}

export type Ticket = {
    requestId: number,
    generation: number,
    direction: Direction,
    cursor: string?,
}

export type Options<T> = {
    key: (T) -> string,
    maxItems: number?,
    maxPages: number?,
    maxPageItems: number?,
}

type StoredPage<T> = {
    items: { T },
    keys: { string },
    previousCursor: string?,
    nextCursor: string?,
    revision: string?,
}

type InternalState<T> = {
    status: Status,
    pages: { StoredPage<T> },
    active: Ticket?,
    error: Error?,
    previousError: Error?,
    nextError: Error?,
    generation: number,
    invalidated: boolean,
    anchorKey: string?,
    key: (T) -> string,
    maxItems: number,
    maxPages: number,
    maxPageItems: number,
    consumedNext: { [string]: boolean },
    consumedPrevious: { [string]: boolean },
}

export type Snapshot<T> = {
    status: Status,
    items: { T },
    keys: { string },
    loading: Direction?,
    error: Error?,
    previousError: Error?,
    nextError: Error?,
    hasPrevious: boolean,
    hasNext: boolean,
    anchorKey: string?,
    generation: number,
    invalidated: boolean,
    pageCount: number,
}

export type ResolveResult = {
    accepted: boolean,
    error: string?,
}

export type State<T> = {
    begin: (direction: Direction, requestId: number, refreshCursor: string?) -> Ticket,
    resolve: (ticket: Ticket, page: Page<T>) -> ResolveResult,
    reject: (ticket: Ticket, error: Error) -> boolean,
    cancel: (ticket: Ticket?) -> boolean,
    setAnchor: (key: string?) -> boolean,
    insert: (item: T, edge: ("start" | "end")?) -> boolean,
    replace: (key: string, item: T) -> boolean,
    remove: (key: string) -> boolean,
    invalidate: () -> (),
    reset: () -> (),
    snapshot: () -> Snapshot<T>,
}

local defaultMaxItems = 200
local defaultMaxPages = 8
local defaultMaxPageItems = 100
local maximumItems = 10000
local maximumPages = 64
local maximumPageItems = 1000
local maximumCursorBytes = 1024
local maximumRevisionBytes = 256
local maximumKeyBytes = 256

local function boundedInteger(value: any, minimum: number, maximum: number, label: string): number
    assert(type(value) == "number" and value == value and math.abs(value) ~= math.huge and value % 1 == 0 and value >= minimum and value <= maximum, label .. " must be a bounded integer")
    return value
end

local function admittedCursor(value: any): boolean
    return value == nil or (type(value) == "string" and #value >= 1 and #value <= maximumCursorBytes)
end

local function admittedRevision(value: any): boolean
    return value == nil or (type(value) == "string" and #value >= 1 and #value <= maximumRevisionBytes)
end

local function admittedKey(value: any): boolean
    return type(value) == "string" and #value >= 1 and #value <= maximumKeyBytes and string.match(value, "^[%w%._~:@%-]+$") ~= nil
end

local function sameTicket(active: Ticket?, ticket: Ticket): boolean
    return active ~= nil and active.requestId == ticket.requestId and active.generation == ticket.generation and active.direction == ticket.direction and active.cursor == ticket.cursor
end

local function itemKey<T>(state: InternalState<T>, item: T): string?
    local ok, value = pcall(state.key, item)
    if not ok or not admittedKey(value) then return nil end
    return value :: string
end

local function copyItems<T>(items: { T }): { T }
    local output: { T } = {}
    for index, item in ipairs(items) do output[index] = item end
    return output
end

local function copyKeys(keys: { string }): { string }
    local output: { string } = {}
    for index, key in ipairs(keys) do output[index] = key end
    return output
end

local function allItems<T>(state: InternalState<T>): ({ T }, { string })
    local items: { T } = {}
    local keys: { string } = {}
    for _, page in ipairs(state.pages) do
        for index, item in ipairs(page.items) do
            table.insert(items, item)
            table.insert(keys, page.keys[index])
        end
    end
    return items, keys
end

local function itemCount<T>(state: InternalState<T>): number
    local count = 0
    for _, page in ipairs(state.pages) do count += #page.items end
    return count
end

local function edgeCursors<T>(state: InternalState<T>): (string?, string?)
    if #state.pages == 0 then return nil, nil end
    return state.pages[1].previousCursor, state.pages[#state.pages].nextCursor
end

local function setFailure<T>(state: InternalState<T>, direction: Direction, errorValue: Error)
    state.active = nil
    if direction == "next" then
        state.nextError = errorValue
    elseif direction == "previous" then
        state.previousError = errorValue
    else
        state.error = errorValue
        state.status = if itemCount(state) == 0 then "error" else "stale-error"
    end
end

local function failResolve<T>(state: InternalState<T>, direction: Direction, code: string): ResolveResult
    setFailure(state, direction, Resource.error(code, false))
    return table.freeze({ accepted = false, error = code }) :: ResolveResult
end

local function validatePage<T>(state: InternalState<T>, page: Page<T>): ({ T }?, { string }?, string?)
    if type(page) ~= "table" or type(page.items) ~= "table" or not admittedCursor(page.previousCursor) or not admittedCursor(page.nextCursor) or not admittedRevision(page.revision) then
        return nil, nil, "INVALID_PAGE"
    end
    local length = #page.items
    if length > state.maxPageItems or length > state.maxItems then return nil, nil, "PAGE_LIMIT_EXCEEDED" end
    for key in pairs(page.items) do
        if type(key) ~= "number" or key % 1 ~= 0 or key < 1 or key > length then return nil, nil, "INVALID_PAGE" end
    end
    local items: { T } = {}
    local keys: { string } = {}
    local seen: { [string]: boolean } = {}
    for index, item in ipairs(page.items) do
        local key = itemKey(state, item)
        if key == nil then return nil, nil, "INVALID_ITEM_KEY" end
        if seen[key] then return nil, nil, "DUPLICATE_ITEM_KEY" end
        seen[key] = true
        items[index] = item
        keys[index] = key
    end
    return items, keys, nil
end

local function removeKeys<T>(state: InternalState<T>, keys: { string })
    local removing: { [string]: boolean } = {}
    for _, key in ipairs(keys) do removing[key] = true end
    for _, page in ipairs(state.pages) do
        local retained: { T } = {}
        local retainedKeys: { string } = {}
        for index, item in ipairs(page.items) do
            local key = page.keys[index]
            if not removing[key] then
                table.insert(retained, item)
                table.insert(retainedKeys, key)
            end
        end
        page.items = retained
        page.keys = retainedKeys
    end
end

local function anchorPageIndex<T>(state: InternalState<T>): number?
    local anchor = state.anchorKey
    if anchor == nil then return nil end
    for pageIndex, page in ipairs(state.pages) do
        for _, key in ipairs(page.keys) do
            if key == anchor then return pageIndex end
        end
    end
    return nil
end

local function evictionEdge<T>(state: InternalState<T>, inserted: Direction): Direction
    local anchorIndex = anchorPageIndex(state)
    if anchorIndex == nil then return if inserted == "previous" then "next" else "previous" end
    local before = anchorIndex - 1
    local after = #state.pages - anchorIndex
    if before > after then return "previous" end
    if after > before then return "next" end
    return if inserted == "previous" then "next" else "previous"
end

local function pruneEmptyInteriorPages<T>(state: InternalState<T>)
    local retained: { StoredPage<T> } = {}
    for index, page in ipairs(state.pages) do
        if #page.items > 0 or index == 1 or index == #state.pages then table.insert(retained, page) end
    end
    state.pages = retained
end

local function evict<T>(state: InternalState<T>, inserted: Direction)
    pruneEmptyInteriorPages(state)
    while #state.pages > 1 and (#state.pages > state.maxPages or itemCount(state) > state.maxItems) do
        local edge = evictionEdge(state, inserted)
        if edge == "previous" then table.remove(state.pages, 1) else table.remove(state.pages, #state.pages) end
    end
    if state.anchorKey ~= nil and anchorPageIndex(state) == nil then state.anchorKey = nil end
end

local Internal = {}
local Collection = {}

local function newState<T>(optionsValue: Options<T>): InternalState<T>
    assert(type(optionsValue) == "table" and type(optionsValue.key) == "function", "Collection.new requires a key function")
    local maxItems = boundedInteger(optionsValue.maxItems or defaultMaxItems, 1, maximumItems, "maxItems")
    local maxPages = boundedInteger(optionsValue.maxPages or defaultMaxPages, 1, maximumPages, "maxPages")
    local maxPageItems = boundedInteger(optionsValue.maxPageItems or math.min(defaultMaxPageItems, maxItems), 1, maximumPageItems, "maxPageItems")
    assert(maxPageItems <= maxItems, "maxPageItems must not exceed maxItems")
    return {
        status = "idle",
        pages = {},
        active = nil,
        error = nil,
        previousError = nil,
        nextError = nil,
        generation = 0,
        invalidated = false,
        anchorKey = nil,
        key = optionsValue.key,
        maxItems = maxItems,
        maxPages = maxPages,
        maxPageItems = maxPageItems,
        consumedNext = {},
        consumedPrevious = {},
    }
end

function Internal.begin<T>(state: InternalState<T>, directionValue: Direction, requestIdValue: number, refreshCursor: string?): Ticket
    assert(type(state) == "table", "Collection.begin state is required")
    assert(state.active == nil, "Collection.begin does not allow concurrent page requests")
    assert(directionValue == "initial" or directionValue == "refresh" or directionValue == "next" or directionValue == "previous", "Collection.begin direction is invalid")
    local requestId = boundedInteger(requestIdValue, 1, 9007199254740991, "requestId")
    local previousCursor, nextCursor = edgeCursors(state)
    local cursor: string? = nil
    if directionValue == "next" then
        assert(nextCursor ~= nil, "Collection.begin has no next page")
        cursor = nextCursor
    elseif directionValue == "previous" then
        assert(previousCursor ~= nil, "Collection.begin has no previous page")
        cursor = previousCursor
    elseif directionValue == "refresh" then
        assert(admittedCursor(refreshCursor), "Collection.begin refresh cursor is invalid")
        cursor = refreshCursor
    else
        assert(refreshCursor == nil, "Collection.begin initial load does not accept a cursor")
    end
    state.generation += 1
    local ticket = table.freeze({ requestId = requestId, generation = state.generation, direction = directionValue, cursor = cursor }) :: Ticket
    state.active = ticket
    if directionValue == "initial" then
        state.status = "loading"
        state.error = nil
    elseif directionValue == "refresh" then
        state.status = "refreshing"
        state.error = nil
    elseif directionValue == "next" then
        state.nextError = nil
    else
        state.previousError = nil
    end
    return ticket
end

function Internal.resolve<T>(state: InternalState<T>, ticket: Ticket, page: Page<T>): ResolveResult
    assert(type(state) == "table" and type(ticket) == "table", "Collection.resolve state and ticket are required")
    if not sameTicket(state.active, ticket) then return table.freeze({ accepted = false, error = "STALE_RESULT" }) :: ResolveResult end
    local items, keys, validationError = validatePage(state, page)
    if validationError ~= nil or items == nil or keys == nil then return failResolve(state, ticket.direction, validationError or "INVALID_PAGE") end
    if ticket.direction == "next" then
        if ticket.cursor == page.nextCursor or (page.nextCursor ~= nil and state.consumedNext[page.nextCursor]) then return failResolve(state, ticket.direction, "CURSOR_CYCLE") end
        if ticket.cursor ~= nil then state.consumedNext[ticket.cursor] = true end
    elseif ticket.direction == "previous" then
        if ticket.cursor == page.previousCursor or (page.previousCursor ~= nil and state.consumedPrevious[page.previousCursor]) then return failResolve(state, ticket.direction, "CURSOR_CYCLE") end
        if ticket.cursor ~= nil then state.consumedPrevious[ticket.cursor] = true end
    end
    local stored: StoredPage<T> = {
        items = copyItems(items),
        keys = copyKeys(keys),
        previousCursor = page.previousCursor,
        nextCursor = page.nextCursor,
        revision = page.revision,
    }
    if ticket.direction == "initial" or ticket.direction == "refresh" then
        state.pages = { stored }
        state.consumedNext = {}
        state.consumedPrevious = {}
    else
        removeKeys(state, keys)
        if ticket.direction == "next" then table.insert(state.pages, stored) else table.insert(state.pages, 1, stored) end
    end
    state.active = nil
    state.error = nil
    state.previousError = nil
    state.nextError = nil
    state.invalidated = false
    evict(state, ticket.direction)
    state.status = if itemCount(state) == 0 then "empty" else "ready"
    return table.freeze({ accepted = true, error = nil }) :: ResolveResult
end

function Internal.reject<T>(state: InternalState<T>, ticket: Ticket, errorValue: Error): boolean
    assert(type(state) == "table" and type(ticket) == "table", "Collection.reject state and ticket are required")
    if not sameTicket(state.active, ticket) then return false end
    local error = Resource.error(errorValue.code, errorValue.retryable, errorValue.fields)
    setFailure(state, ticket.direction, error)
    return true
end

function Internal.cancel<T>(state: InternalState<T>, ticketValue: Ticket?): boolean
    assert(type(state) == "table", "Collection.cancel state is required")
    local active = state.active
    if active == nil or (ticketValue ~= nil and not sameTicket(active, ticketValue)) then return false end
    state.generation += 1
    state.active = nil
    state.status = if itemCount(state) == 0 then "cancelled" else "ready"
    return true
end

function Internal.setAnchor<T>(state: InternalState<T>, keyValue: string?): boolean
    assert(type(state) == "table", "Collection.setAnchor state is required")
    if keyValue == nil then state.anchorKey = nil return true end
    if not admittedKey(keyValue) then return false end
    local _, keys = allItems(state)
    for _, key in ipairs(keys) do
        if key == keyValue then state.anchorKey = keyValue return true end
    end
    return false
end

function Internal.insert<T>(state: InternalState<T>, item: T, edgeValue: "start" | "end"?): boolean
    assert(type(state) == "table", "Collection.insert state is required")
    local edge = edgeValue or "end"
    assert(edge == "start" or edge == "end", "Collection.insert edge is invalid")
    local key = itemKey(state, item)
    if key == nil then return false end
    Internal.remove(state, key)
    if #state.pages == 0 then
        state.pages = { { items = { item }, keys = { key }, previousCursor = nil, nextCursor = nil, revision = nil } }
    elseif edge == "start" then
        table.insert(state.pages[1].items, 1, item)
        table.insert(state.pages[1].keys, 1, key)
    else
        table.insert(state.pages[#state.pages].items, item)
        table.insert(state.pages[#state.pages].keys, key)
    end
    evict(state, if edge == "start" then "previous" else "next")
    state.status = "ready"
    return true
end

function Internal.replace<T>(state: InternalState<T>, keyValue: string, item: T): boolean
    assert(type(state) == "table", "Collection.replace state is required")
    if not admittedKey(keyValue) or itemKey(state, item) ~= keyValue then return false end
    for _, page in ipairs(state.pages) do
        for index, currentKey in ipairs(page.keys) do
            if currentKey == keyValue then page.items[index] = item return true end
        end
    end
    return false
end

function Internal.remove<T>(state: InternalState<T>, keyValue: string): boolean
    assert(type(state) == "table", "Collection.remove state is required")
    if not admittedKey(keyValue) then return false end
    local removed = false
    for _, page in ipairs(state.pages) do
        local retained: { T } = {}
        local retainedKeys: { string } = {}
        for index, item in ipairs(page.items) do
            local currentKey = page.keys[index]
            if currentKey == keyValue then
                removed = true
            else
                table.insert(retained, item)
                table.insert(retainedKeys, currentKey)
            end
        end
        page.items = retained
        page.keys = retainedKeys
    end
    if removed then
        pruneEmptyInteriorPages(state)
        if state.anchorKey == keyValue then state.anchorKey = nil end
        state.status = if itemCount(state) == 0 then "empty" else "ready"
    end
    return removed
end

function Internal.invalidate<T>(state: InternalState<T>)
    assert(type(state) == "table", "Collection.invalidate state is required")
    state.invalidated = true
end

function Internal.reset<T>(state: InternalState<T>)
    assert(type(state) == "table", "Collection.reset state is required")
    state.generation += 1
    state.status = "idle"
    state.pages = {}
    state.active = nil
    state.error = nil
    state.previousError = nil
    state.nextError = nil
    state.invalidated = false
    state.anchorKey = nil
    state.consumedNext = {}
    state.consumedPrevious = {}
end

function Internal.snapshot<T>(state: InternalState<T>): Snapshot<T>
    assert(type(state) == "table", "Collection.snapshot state is required")
    local items, keys = allItems(state)
    local previousCursor, nextCursor = edgeCursors(state)
    return table.freeze({
        status = state.status,
        items = table.freeze(items),
        keys = table.freeze(keys),
        loading = if state.active == nil then nil else state.active.direction,
        error = state.error,
        previousError = state.previousError,
        nextError = state.nextError,
        hasPrevious = previousCursor ~= nil,
        hasNext = nextCursor ~= nil,
        anchorKey = state.anchorKey,
        generation = state.generation,
        invalidated = state.invalidated,
        pageCount = #state.pages,
    }) :: Snapshot<T>
end

function Collection.new<T>(options: Options<T>): State<T>
    local state = newState(options)
    local Controller = {}
    function Controller.begin(direction: Direction, requestId: number, refreshCursor: string?): Ticket return Internal.begin(state, direction, requestId, refreshCursor) end
    function Controller.resolve(ticket: Ticket, page: Page<T>): ResolveResult return Internal.resolve(state, ticket, page) end
    function Controller.reject(ticket: Ticket, error: Error): boolean return Internal.reject(state, ticket, error) end
    function Controller.cancel(ticket: Ticket?): boolean return Internal.cancel(state, ticket) end
    function Controller.setAnchor(key: string?): boolean return Internal.setAnchor(state, key) end
    function Controller.insert(item: T, edge: "start" | "end"?): boolean return Internal.insert(state, item, edge) end
    function Controller.replace(key: string, item: T): boolean return Internal.replace(state, key, item) end
    function Controller.remove(key: string): boolean return Internal.remove(state, key) end
    function Controller.invalidate() Internal.invalidate(state) end
    function Controller.reset() Internal.reset(state) end
    function Controller.snapshot(): Snapshot<T> return Internal.snapshot(state) end
    return table.freeze(Controller) :: State<T>
end

Collection.limits = table.freeze({
    maximumItems = maximumItems,
    maximumPages = maximumPages,
    maximumPageItems = maximumPageItems,
    maximumCursorBytes = maximumCursorBytes,
    maximumRevisionBytes = maximumRevisionBytes,
    maximumKeyBytes = maximumKeyBytes,
})

return table.freeze(Collection)
