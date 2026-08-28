--!strict

local Assets = require("luastra/assets")
local Motion = require("luastra/motion")
local UI = require("luastra/ui")

local revealed = false
local hasFlipped = false
local selection = "Calm green"
local Application = {}

local function cardMotion(): Motion.MotionMap
    if revealed then
        return Motion.flip { fromDeg = 0, toDeg = 180, durationMs = 560 }
    elseif hasFlipped then
        return Motion.flip { fromDeg = 180, toDeg = 0, durationMs = 560 }
    end
    return Motion.sway { angleDeg = 2.5, durationMs = 180, pauseMs = 1800 }
end

local function specimen(id: string, shape: string, width: number, height: number, fill: string): UI.Node
    return UI.Stack {
        id = "shape/" .. id,
        gap = "sm",
        align = "center",
        UI.Shape {
            id = "shape/" .. id .. "/visual",
            shape = shape,
            width = width,
            height = height,
            fill = fill,
            stroke = "text",
            strokeWidth = 3,
            label = shape .. " specimen",
        },
        UI.Text { id = "shape/" .. id .. "/label", text = shape, tone = "muted" },
    }
end

function Application.render(): UI.Node
    return UI.Screen {
        id = "live-visuals",
        width = "wide",
        padding = "responsive",
        backgroundColor = "#F4EFE3",
        textColor = "#16342E",
        accentColor = "#2F7568",
        surfaceColor = "#FFFDF7",
        mutedColor = "#526A64",
        successColor = "#245C53",
        dangerColor = "#9C3C32",
        warningColor = "#E4AD3A",
        UI.Stack {
            id = "live-visuals/content",
            gap = "xl",
            UI.Stack {
                id = "live-visuals/intro",
                gap = "sm",
                UI.Text {
                    id = "live-visuals/title",
                    text = "Live visuals",
                    variant = "title",
                    width = "full",
                    textAlign = "center",
                    textColor = "accent",
                    backgroundColor = "surface",
                },
                UI.Text {
                    id = "live-visuals/copy",
                    text = "Event-driven motion, admitted images, layered content and vector-like shapes from Luau.",
                    tone = "muted",
                },
            },
            UI.Row {
                id = "live-visuals/demo",
                gap = "xl",
                responsive = true,
                align = "center",
                UI.Stack {
                    id = "live-visuals/card-column",
                    gap = "md",
                    align = "center",
                    UI.FlipCard {
                        id = "live-visuals/card",
                        width = 220,
                        height = 300,
                        motion = cardMotion(),
                        UI.Image {
                            id = "live-visuals/card-front",
                            source = Assets.uri(Assets.image("image/luastra-mark")),
                            label = "Luastra card back",
                            width = 220,
                            height = 300,
                            fit = "contain",
                            cornerRadius = 24,
                        },
                        UI.Layer {
                            id = "live-visuals/card-back",
                            UI.Shape {
                                id = "live-visuals/card-color",
                                shape = "roundedRectangle",
                                width = 220,
                                height = 300,
                                fill = "accent",
                                stroke = "text",
                                strokeWidth = 3,
                                cornerRadius = 24,
                                label = selection,
                            },
                            UI.Stack {
                                id = "live-visuals/card-answer",
                                gap = "sm",
                                align = "center",
                                UI.Text { id = "live-visuals/card-answer-title", text = selection, variant = "heading" },
                                UI.Text { id = "live-visuals/card-answer-copy", text = "The revealed side", tone = "muted" },
                            },
                        },
                    },
                    UI.Button {
                        id = "live-visuals/flip",
                        text = revealed and "Cover card" or "Reveal card",
                        onTap = "flip-card",
                    },
                },
                UI.Card {
                    id = "live-visuals/effects",
                    gap = "md",
                    padding = "lg",
                    surface = "elevated",
                    UI.Text { id = "live-visuals/effects-title", text = "Predefined effects", variant = "heading" },
                    UI.Text { id = "live-visuals/effects-list", text = "fadeIn · slideIn · scaleIn · sway · pulse · shake · flip" },
                    UI.Text { id = "live-visuals/effects-note", text = "No permanent game loop: frames run only while an effect is active.", tone = "success" },
                },
            },
            UI.Stack {
                id = "live-visuals/shapes",
                gap = "lg",
                UI.Text { id = "live-visuals/shapes-title", text = "Shape primitives", variant = "heading" },
                UI.Grid {
                    id = "live-visuals/shape-grid",
                    gap = "lg",
                    columns = "adaptive",
                    responsive = true,
                    specimen("rectangle", "rectangle", 120, 80, "surface"),
                    specimen("rounded-rectangle", "roundedRectangle", 120, 80, "accent"),
                    specimen("circle", "circle", 88, 88, "warning"),
                    specimen("oval", "oval", 128, 78, "success"),
                    specimen("triangle", "triangle", 96, 88, "danger"),
                    specimen("diamond", "diamond", 92, 92, "accent"),
                    specimen("pentagon", "pentagon", 96, 96, "warning"),
                    specimen("hexagon", "hexagon", 104, 92, "success"),
                    specimen("star", "star", 104, 104, "warning"),
                },
            },
        },
    }
end

function Application.handle(action: string, target: string, _value: string)
    if action == "flip-card" and target == "live-visuals/flip" then
        revealed = not revealed
        hasFlipped = true
    end
end

function Application.snapshot()
    return { revealed = revealed, hasFlipped = hasFlipped, selection = selection }
end

return Application
