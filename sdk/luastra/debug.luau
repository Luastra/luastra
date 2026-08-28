--!strict

local Debug = {}

local function emit(level: string, ...: any)
    print("[luastra:" .. level .. "]", ...)
end

function Debug.log(...: any)
    emit("log", ...)
end

function Debug.warn(...: any)
    emit("warn", ...)
end

function Debug.error(...: any)
    emit("error", ...)
end

return table.freeze(Debug)
