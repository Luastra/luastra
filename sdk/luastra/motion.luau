--!strict

export type Easing = "linear" | "easeOutCubic" | "easeInOutCubic"
export type TweenOptions = {
    from: number,
    to: number,
    durationMs: number,
    easing: Easing?,
}
export type Tween = {
    kind: "tween",
    from: number,
    to: number,
    durationMs: number,
    easing: Easing,
}
export type Wait = { kind: "wait", durationMs: number }
export type Sequence = { kind: "sequence", steps: { Tween | Wait }, iterations: number }
export type Descriptor = Tween | Sequence
export type MotionMap = { [string]: Descriptor }

local function finite(value: number): boolean
    return value == value and math.abs(value) ~= math.huge
end

local Motion = {}

function Motion.tween(options: TweenOptions): Tween
    assert(type(options) == "table", "Motion.tween requires a table")
    assert(finite(options.from), "Motion.tween from must be finite")
    assert(finite(options.to), "Motion.tween to must be finite")
    assert(finite(options.durationMs) and options.durationMs >= 0 and options.durationMs <= 60000, "Motion.tween durationMs must be between 0 and 60000")
    local easing: Easing = options.easing or "linear"
    assert(easing == "linear" or easing == "easeOutCubic" or easing == "easeInOutCubic", "Motion.tween easing is unsupported")
    return table.freeze({
        kind = "tween",
        from = options.from,
        to = options.to,
        durationMs = options.durationMs,
        easing = easing,
    }) :: Tween
end

function Motion.wait(durationMs: number): Wait
    assert(finite(durationMs) and durationMs >= 0 and durationMs <= 60000, "Motion.wait durationMs must be between 0 and 60000")
    return table.freeze({ kind = "wait", durationMs = durationMs }) :: Wait
end

function Motion.sequence(steps: { Tween | Wait }, iterations: number?): Sequence
    assert(type(steps) == "table" and #steps >= 1 and #steps <= 32, "Motion.sequence requires 1 to 32 steps")
    local admitted: { Tween | Wait } = {}
    local hasTween = false
    for index, step in ipairs(steps) do
        assert(type(step) == "table" and (step.kind == "tween" or step.kind == "wait"), "Motion.sequence has an invalid step at " .. tostring(index))
        if step.kind == "tween" then hasTween = true end
        admitted[index] = step
    end
    assert(hasTween, "Motion.sequence requires at least one tween")
    local count = iterations or 1
    assert(finite(count) and count % 1 == 0 and count >= 0 and count <= 1000, "Motion.sequence iterations must be 0 to 1000; 0 means continuous")
    return table.freeze({ kind = "sequence", steps = table.freeze(admitted), iterations = count }) :: Sequence
end

local function duration(options: any, fallback: number): number
    local value = if type(options) == "table" and options.durationMs ~= nil then options.durationMs else fallback
    assert(type(value) == "number" and finite(value) and value >= 0 and value <= 60000, "motion effect durationMs must be between 0 and 60000")
    return value
end

local function easing(options: any, fallback: Easing): Easing
    local value = if type(options) == "table" and options.easing ~= nil then options.easing else fallback
    assert(value == "linear" or value == "easeOutCubic" or value == "easeInOutCubic", "motion effect easing is unsupported")
    return value
end

function Motion.fadeIn(options: any?): MotionMap
    return table.freeze({ opacity = Motion.tween { from = 0, to = 1, durationMs = duration(options, 180), easing = easing(options, "easeOutCubic") } }) :: MotionMap
end

function Motion.slideIn(options: any?): MotionMap
    local input = options or {}
    local result: MotionMap = {}
    local milliseconds = duration(input, 240)
    local curve = easing(input, "easeOutCubic")
    if input.x ~= nil then
        assert(type(input.x) == "number" and finite(input.x), "Motion.slideIn x must be finite")
        result.translateX = Motion.tween { from = input.x, to = 0, durationMs = milliseconds, easing = curve }
    end
    if input.y ~= nil or input.x == nil then
        local y = input.y or 18
        assert(type(y) == "number" and finite(y), "Motion.slideIn y must be finite")
        result.translateY = Motion.tween { from = y, to = 0, durationMs = milliseconds, easing = curve }
    end
    return table.freeze(result)
end

function Motion.scaleIn(options: any?): MotionMap
    local input = options or {}
    local from = input.from or 0.92
    assert(type(from) == "number" and finite(from) and from >= 0 and from <= 100, "Motion.scaleIn from must be between 0 and 100")
    local tween = Motion.tween { from = from, to = 1, durationMs = duration(input, 220), easing = easing(input, "easeOutCubic") }
    return table.freeze({ scaleX = tween, scaleY = tween }) :: MotionMap
end

function Motion.sway(options: any?): MotionMap
    local input = options or {}
    local angle = input.angleDeg or 2
    local movementMs = duration(input, 180)
    local pauseMs = input.pauseMs or 2400
    assert(type(angle) == "number" and finite(angle) and angle > 0 and angle <= 45, "Motion.sway angleDeg must be between 0 and 45")
    assert(type(pauseMs) == "number" and finite(pauseMs) and pauseMs >= 0 and pauseMs <= 60000, "Motion.sway pauseMs must be between 0 and 60000")
    local curve = easing(input, "easeInOutCubic")
    return table.freeze({
        rotationDeg = Motion.sequence({
            Motion.wait(pauseMs),
            Motion.tween { from = 0, to = -angle, durationMs = movementMs, easing = curve },
            Motion.tween { from = -angle, to = angle, durationMs = movementMs * 2, easing = curve },
            Motion.tween { from = angle, to = 0, durationMs = movementMs, easing = curve },
        }, 0),
    }) :: MotionMap
end

function Motion.pulse(options: any?): MotionMap
    local input = options or {}
    local scale = input.scale or 1.04
    local pauseMs = input.pauseMs or 0
    assert(type(scale) == "number" and finite(scale) and scale >= 0 and scale <= 100, "Motion.pulse scale must be between 0 and 100")
    assert(type(pauseMs) == "number" and finite(pauseMs) and pauseMs >= 0 and pauseMs <= 60000, "Motion.pulse pauseMs must be between 0 and 60000")
    local milliseconds = duration(input, 420)
    local curve = easing(input, "easeInOutCubic")
    local steps: { Tween | Wait } = {
        Motion.tween { from = 1, to = scale, durationMs = milliseconds, easing = curve },
        Motion.tween { from = scale, to = 1, durationMs = milliseconds, easing = curve },
    }
    if pauseMs > 0 then table.insert(steps, Motion.wait(pauseMs)) end
    local sequence = Motion.sequence(steps, input.iterations or 1)
    return table.freeze({ scaleX = sequence, scaleY = sequence }) :: MotionMap
end

function Motion.shake(options: any?): MotionMap
    local input = options or {}
    local distance = input.distance or 8
    local milliseconds = duration(input, 70)
    assert(type(distance) == "number" and finite(distance) and distance > 0 and distance <= 1000, "Motion.shake distance must be between 0 and 1000")
    return table.freeze({
        translateX = Motion.sequence({
            Motion.tween { from = 0, to = -distance, durationMs = milliseconds, easing = "linear" },
            Motion.tween { from = -distance, to = distance, durationMs = milliseconds * 2, easing = "linear" },
            Motion.tween { from = distance, to = 0, durationMs = milliseconds, easing = "linear" },
        }, input.iterations or 1),
    }) :: MotionMap
end

function Motion.flip(options: any?): MotionMap
    local input = options or {}
    local from = input.fromDeg or 0
    local to = input.toDeg or 180
    assert(type(from) == "number" and finite(from) and type(to) == "number" and finite(to), "Motion.flip endpoints must be finite")
    return table.freeze({
        rotationYDeg = Motion.tween { from = from, to = to, durationMs = duration(input, 500), easing = easing(input, "easeInOutCubic") },
    }) :: MotionMap
end

return table.freeze(Motion)
