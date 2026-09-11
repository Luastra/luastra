--!strict

export type Error = {
    code: string,
    retryable: boolean,
    fields: { [string]: string }?,
}

export type ReadStatus =
    "idle"
    | "loading"
    | "success"
    | "empty"
    | "refreshing"
    | "retrying"
    | "stale-error"
    | "error"
    | "cancelled"
export type MutationStatus = "idle" | "submitting" | "succeeded" | "failed" | "cancelled"
export type ReadMode = "load" | "refresh" | "retry"

export type Ticket = {
    requestId: number,
    generation: number,
}

export type ReadOptions<T> = {
    isEmpty: (T) -> boolean,
}

export type ReadSnapshot<T> = {
    status: ReadStatus,
    value: T?,
    error: Error?,
    requestId: number?,
    generation: number,
    invalidated: boolean,
    stale: boolean,
}

export type ReadState<T> = {
    begin: (requestId: number, mode: ReadMode?) -> Ticket,
    resolve: (ticket: Ticket, value: T) -> boolean,
    reject: (ticket: Ticket, error: Error) -> boolean,
    cancel: (ticket: Ticket?) -> boolean,
    invalidate: () -> (),
    reset: () -> (),
    snapshot: () -> ReadSnapshot<T>,
}

export type OptimisticChange = {
    apply: () -> (),
    rollback: () -> (),
}

export type MutationOptions<T> = {
    retryable: boolean?,
    accept: (T) -> boolean,
}

export type MutationStartOptions = {
    idempotencyKey: string?,
    optimistic: OptimisticChange?,
}

export type MutationSnapshot<T> = {
    status: MutationStatus,
    value: T?,
    error: Error?,
    requestId: number?,
    generation: number,
    retryable: boolean,
}

export type MutationState<T> = {
    begin: (requestId: number, options: MutationStartOptions?) -> Ticket,
    resolve: (ticket: Ticket, value: T) -> boolean,
    reject: (ticket: Ticket, error: Error) -> boolean,
    cancel: (ticket: Ticket?) -> boolean,
    reset: () -> (),
    snapshot: () -> MutationSnapshot<T>,
}

local maximumErrorFields = 32
local maximumErrorCodeBytes = 64
local maximumErrorFieldBytes = 128
local maximumIdempotencyKeyBytes = 128
local minimumIdempotencyKeyBytes = 8
local maximumRequestId = 9007199254740991
local tokenPattern = "^[A-Z][A-Z0-9_]*$"

local function boundedRequestId(value: any): number
    assert(type(value) == "number" and value == value and math.abs(value) ~= math.huge and value % 1 == 0 and value >= 1 and value <= maximumRequestId, "requestId must be a safe positive integer")
    return value
end

local function sameTicket(active: Ticket?, ticket: Ticket): boolean
    return active ~= nil and active.requestId == ticket.requestId and active.generation == ticket.generation
end

local function admittedError(value: Error): Error
    assert(type(value) == "table", "resource error must be a table")
    assert(type(value.code) == "string" and #value.code >= 1 and #value.code <= maximumErrorCodeBytes and string.match(value.code, tokenPattern) ~= nil, "resource error code is invalid")
    assert(type(value.retryable) == "boolean", "resource error retryable must be a boolean")
    local fields: { [string]: string }? = nil
    if value.fields ~= nil then
        assert(type(value.fields) == "table", "resource error fields must be a table")
        fields = {}
        local count = 0
        for name, code in pairs(value.fields) do
            count += 1
            assert(count <= maximumErrorFields, "resource error has too many fields")
            assert(type(name) == "string" and #name >= 1 and #name <= maximumErrorFieldBytes and string.match(name, "^[%a_][%w_.%[%]-]*$") ~= nil, "resource error field name is invalid")
            assert(type(code) == "string" and #code >= 1 and #code <= maximumErrorCodeBytes and string.match(code, tokenPattern) ~= nil, "resource error field code is invalid")
            fields[name] = code
        end
        table.freeze(fields)
    end
    return table.freeze({ code = value.code, retryable = value.retryable, fields = fields }) :: Error
end

local function newTicket(generation: number, requestId: number): Ticket
    return table.freeze({ requestId = boundedRequestId(requestId), generation = generation }) :: Ticket
end

local function activeRequestId(ticket: Ticket?): number?
    return if ticket == nil then nil else ticket.requestId
end

local Resource = {}

function Resource.error(code: string, retryable: boolean, fields: { [string]: string }?): Error
    return admittedError({ code = code, retryable = retryable, fields = fields })
end

function Resource.new<T>(options: ReadOptions<T>): ReadState<T>
    assert(type(options) == "table", "Resource.new options must be a table")
    assert(type(options.isEmpty) == "function", "Resource.new isEmpty must be a function")

    local status: ReadStatus = "idle"
    local value: T? = nil
    local error: Error? = nil
    local active: Ticket? = nil
    local generation = 0
    local invalidated = false
    local Controller = {}

    function Controller.begin(requestId: number, modeValue: ReadMode?): Ticket
        local mode: ReadMode = modeValue or "load"
        assert(mode == "load" or mode == "refresh" or mode == "retry", "Resource.begin mode is invalid")
        generation += 1
        local ticket = newTicket(generation, requestId)
        active = ticket
        error = nil
        invalidated = false
        if mode == "refresh" and value ~= nil then status = "refreshing"
        elseif mode == "retry" then status = "retrying"
        else status = "loading" end
        return ticket
    end

    function Controller.resolve(ticket: Ticket, nextValue: T): boolean
        assert(type(ticket) == "table", "Resource.resolve ticket is required")
        if not sameTicket(active, ticket) then return false end
        local checked, emptyValue = pcall(options.isEmpty, nextValue)
        assert(checked and type(emptyValue) == "boolean", "Resource isEmpty must return a boolean")
        value = nextValue
        error = nil
        active = nil
        invalidated = false
        status = if emptyValue then "empty" else "success"
        return true
    end

    function Controller.reject(ticket: Ticket, errorValue: Error): boolean
        assert(type(ticket) == "table", "Resource.reject ticket is required")
        if not sameTicket(active, ticket) then return false end
        error = admittedError(errorValue)
        active = nil
        status = if value == nil then "error" else "stale-error"
        return true
    end

    function Controller.cancel(ticketValue: Ticket?): boolean
        if active == nil or (ticketValue ~= nil and not sameTicket(active, ticketValue)) then return false end
        generation += 1
        active = nil
        error = nil
        status = "cancelled"
        return true
    end

    function Controller.invalidate()
        invalidated = true
    end

    function Controller.reset()
        generation += 1
        status = "idle"
        value = nil
        error = nil
        active = nil
        invalidated = false
    end

    function Controller.snapshot(): ReadSnapshot<T>
        return table.freeze({
            status = status,
            value = value,
            error = error,
            requestId = activeRequestId(active),
            generation = generation,
            invalidated = invalidated,
            stale = value ~= nil and (status == "refreshing" or status == "retrying" or status == "stale-error" or invalidated),
        }) :: ReadSnapshot<T>
    end

    return table.freeze(Controller) :: ReadState<T>
end

function Resource.newMutation<T>(options: MutationOptions<T>): MutationState<T>
    assert(type(options) == "table", "Resource.newMutation options must be a table")
    assert(options.retryable == nil or type(options.retryable) == "boolean", "Resource.newMutation retryable must be a boolean")
    assert(type(options.accept) == "function", "Resource.newMutation accept must be a function")

    local status: MutationStatus = "idle"
    local value: T? = nil
    local error: Error? = nil
    local active: Ticket? = nil
    local generation = 0
    local retryable = options.retryable == true
    local rollback: (() -> ())? = nil
    local Controller = {}

    local function runRollback()
        local callback = rollback
        rollback = nil
        if callback ~= nil then callback() end
    end

    function Controller.begin(requestId: number, startOptionsValue: MutationStartOptions?): Ticket
        assert(active == nil, "Resource.beginMutation does not allow concurrent execution")
        local startOptions: MutationStartOptions = startOptionsValue or {}
        local key = startOptions.idempotencyKey
        if retryable then
            assert(type(key) == "string" and #key >= minimumIdempotencyKeyBytes and #key <= maximumIdempotencyKeyBytes and string.match(key, "^[A-Za-z0-9._~:@%-]+$") ~= nil, "retryable mutation requires an admitted idempotencyKey")
        else
            assert(key == nil, "non-retryable mutation must not declare an idempotencyKey")
        end
        local optimistic = startOptions.optimistic
        assert(optimistic == nil or (type(optimistic) == "table" and type(optimistic.apply) == "function" and type(optimistic.rollback) == "function"), "optimistic mutation requires apply and rollback functions")
        generation += 1
        local ticket = newTicket(generation, requestId)
        if optimistic ~= nil then optimistic.apply() end
        status = "submitting"
        value = nil
        error = nil
        active = ticket
        rollback = if optimistic == nil then nil else optimistic.rollback
        return ticket
    end

    function Controller.resolve(ticket: Ticket, nextValue: T): boolean
        assert(type(ticket) == "table", "Resource.resolveMutation ticket is required")
        if not sameTicket(active, ticket) then return false end
        local checked, accepted = pcall(options.accept, nextValue)
        assert(checked and accepted == true, "mutation result was rejected by its accept function")
        status = "succeeded"
        value = nextValue
        error = nil
        active = nil
        rollback = nil
        return true
    end

    function Controller.reject(ticket: Ticket, errorValue: Error): boolean
        assert(type(ticket) == "table", "Resource.rejectMutation ticket is required")
        if not sameTicket(active, ticket) then return false end
        status = "failed"
        value = nil
        error = admittedError(errorValue)
        active = nil
        runRollback()
        return true
    end

    function Controller.cancel(ticketValue: Ticket?): boolean
        if active == nil or (ticketValue ~= nil and not sameTicket(active, ticketValue)) then return false end
        generation += 1
        status = "cancelled"
        value = nil
        error = nil
        active = nil
        runRollback()
        return true
    end

    function Controller.reset()
        assert(active == nil, "Resource.resetMutation requires an idle mutation")
        generation += 1
        status = "idle"
        value = nil
        error = nil
        rollback = nil
    end

    function Controller.snapshot(): MutationSnapshot<T>
        return table.freeze({
            status = status,
            value = value,
            error = error,
            requestId = activeRequestId(active),
            generation = generation,
            retryable = retryable,
        }) :: MutationSnapshot<T>
    end

    return table.freeze(Controller) :: MutationState<T>
end

Resource.limits = table.freeze({
    maximumErrorFields = maximumErrorFields,
    maximumErrorCodeBytes = maximumErrorCodeBytes,
    maximumErrorFieldBytes = maximumErrorFieldBytes,
    maximumIdempotencyKeyBytes = maximumIdempotencyKeyBytes,
    minimumIdempotencyKeyBytes = minimumIdempotencyKeyBytes,
    maximumRequestId = maximumRequestId,
})

return table.freeze(Resource)
