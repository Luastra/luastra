--!strict
-- SPDX-License-Identifier: 0BSD

local UI = require("luastra/ui")
local Motion = require("luastra/motion")
local Navigation = require("luastra/navigation")
local Assets = require("luastra/assets")
local Timer = require("luastra/timer")

local Application = {}
local nav = Navigation.create {
    routes = {
        "welcome",
        "game",
    },
    initial = "welcome"
}
local appTheme: UI.Theme = {
    backgroundColor = "#F4EFE3",
    textColor = "#16342E",
    accentColor = "#2F7568",
    mutedColor = "#526A64",
    surfaceColor = "#FFFDF7",
    successColor = "#245C53",
    warningColor = "#E4AD3A",
    dangerColor = "#9C3C32",
}
local cardBackImg = Assets.uri(Assets.image("image/card-back"))
local MAX_CARDS_NUM: number = 10

type GameData = {
    cards: {number},
    curCardNum: number,
    winNum: number,
    lossNum: number,
    cardFlip: boolean,
    cardFlipBack: boolean,
}
local gameData: GameData = {
    cards = {},
    curCardNum = 0,
    winNum = 0,
    lossNum = 0,
    cardFlip = false,
    cardFlipBack = false,
}

local function welcomeHeader(): UI.Node
    return UI.Text {
        id = "title",
        text = "Train Your Intuition",
        variant = "title",
        width = "full",
        textAlign = "center",
        paddingY = "xl",
    }
end

local function welcomeBody(): UI.Node
    return UI.Column {
        id = "welcome/body",
        width = "full",
        align = "center",

        UI.Layer {
            id = "welcome/layer",
            motion = Motion.pulse { scale = 1.07, durationMs = 3000, pauseMs = 100, iterations = 0 },

            UI.Shape {
                id = "welcome/card",
                shape = "roundedRectangle",
                width = 412 / 1.5,
                height = 573 / 1.5,
                fill = "surface",
                stroke = "accent",
                strokeWidth = 1,
            },
            UI.Row {
                id = "welcome/justify-center",
                width = "full",
                align = "center",
                padding = "md",

                UI.Column {
                    id = "welcome/content",
                    width = "full",
                    align = "center",
                    gap = "xl",

                    UI.Text {
                        id = "welcome/heading",
                        variant = "heading",
                        textAlign = "center",
                        textColor = "accent",
                        text = "Welcome!",
                    },
                    UI.Column {
                        id = "welcome/text",
                        gap = "xs",
                        UI.Text {
                            id = "welcome/text-1",
                            width = "content",
                            textAlign = "center",
                            text = "Would you like to test",
                        },
                        UI.Text {
                            id = "welcome/text-2",
                            width = "content",
                            textAlign = "center",
                            text = "or improve your intuition?",
                        },
                        UI.Text {
                            id = "welcome/text-3",
                            width = "content",
                            textAlign = "center",
                            text = "Ready to begin?",
                        },
                    },
                    UI.Column {
                        id = "welcome/goal-text",
                        gap = "xs",
                        textColor = "success",

                        UI.Text {
                            id = "welcome/goal-text-1",
                            width = "content",
                            textAlign = "center",
                            text = "Your goal:",
                        },
                        UI.Text {
                            id = "welcome/goal-text-2",
                            width = "content",
                            textAlign = "center",
                            text = "Guess the hidden card color!",
                        },
                    },
                },
            },
        },
    }
end

local function welcomeActions(): UI.Node
    return UI.Column {
        id = "start-game",
        width = "wide",
        paddingY = "xl",

        UI.Button {
            id = "start-game-btn",
            width = "content",
            text = "Let's go!",
            onTap = "go-game",
        },
    }
end

local function welcomePage(): UI.Node
    return UI.Screen {
        id = "welcome-page",
        theme = appTheme,

        welcomeHeader(),
        welcomeBody(),
        welcomeActions(),
    }
end

local function gameHeader(): UI.Node
    return UI.Text {
        id = "game/title",
        text = "Guess the hidden card color!",
        variant = "heading",
        width = "full",
        textAlign = "center",
        paddingY = "xl",
        textColor = "accent",
    }
end

local function gameBody(): UI.Node
    return UI.Column {
        id = "game/guess",
        width = "full",
        align = "center",
        paddingBottom = "lg",

        UI.Row {
            id = "game/status",
            width = "content",
            paddingY = "md",

            UI.Text { id = "game/status-text", text = "Current score:", width = "full", paddingX = "lg" },
            UI.Row {
                id = "game/status-bar",
                width = "full",
                align = "center",

                UI.Layer {
                    id = "game/status-bar-wins",

                    UI.Shape { id = "game/wins", shape = "rectangle", width = 100, height = 38, fill = "#399c0f", },
                    UI.Row {
                        id = "game/wins-row",
                        align = "center",
                        UI.Text { id = "game/wins-text", text = `correct: {gameData.winNum}`, textColor = "surface", width = "full", textAlign = "center" },
                    }
                },
                UI.Layer {
                    id = "game/status-bar-losses",

                    UI.Shape { id = "game/losses", shape = "rectangle", width = 100, height = 38, fill = "#d5267a", },
                    UI.Row {
                        id = "game/losses-row",
                        align = "center",
                        UI.Text { id = "game/losses-text", text = `wrong: {gameData.lossNum}`, textColor = "surface", width = "full", textAlign = "center" },
                    }
                },
            },
        },
        UI.FlipCard {
            id = "game/guess-card",
            width = 412 / 1.5,
            height = 573 / 1.5,
            motion = gameData.cardFlip
                and (gameData.cardFlipBack and Motion.flip { fromDeg = 180, toDeg = 0 } or Motion.flip { fromDeg = 0, toDeg = 180 } )
                or Motion.sway { durationMs = 1000, pauseMs = 1 },

            UI.Layer {
                id = "back-layer",

                UI.Image { id = "front", source = cardBackImg, label = "Closed Card" },
                UI.Column {
                    id = "back-content",
                    width = "full",
                    align = "center",
                    justify = "center",
                    textColor = "#35fff8",

                    UI.Text {
                        id = "the-end",
                        text = gameData.curCardNum > MAX_CARDS_NUM and "The End!" or "",
                        backgroundColor = "#000000",
                        variant = "title",
                        textAlign = "center",
                    },
                },
            },
            UI.Shape {
                id = "back",
                shape = "roundedRectangle",
                width = 412 / 1.5,
                height = 573 / 1.5,
                fill = gameData.cards[gameData.curCardNum] == 1 and "danger" or "#121212",
                stroke = "#000000",
                strokeWidth = 2,
            },
        },
    }
end

local function gameActions(): UI.Node
    return UI.Column {
        id = "game/actions",
        align = "center",
        gap = "xl",
        paddingY = "sm",

        UI.Actions {
            id = "game/choose-colors",
            gap = "md",

            UI.Button {
                id = "red-color",
                appearance = "danger",
                text = "Red",
                onTap = "red-chosen",
                disabled = gameData.cardFlip,
            },
            UI.Button {
                id = "black-color",
                appearance = "secondary",
                text = "Black",
                onTap = "black-chosen",
                disabled = gameData.cardFlip,
            },
        },
        UI.Button {
            id = "return-back-btn",
            width = "content",
            text = "<< Return home",
            onTap = "go-home",
        },
    }
end

local function gamePage(): UI.Node
    return UI.Screen {
        id = "game-page",
        theme = appTheme,

        gameHeader(),
        gameBody(),
        gameActions(),
    }
end

function Application.render() : UI.Node
    local curPage = nav.current()

    if curPage == "welcome" then
        return welcomePage()
    else
        return gamePage()
    end
end

local function initCards(): ()
    gameData.curCardNum = 1
    gameData.winNum = 0
    gameData.lossNum = 0
    gameData.cardFlip = false
    gameData.cardFlipBack = false
    for idx = 1, MAX_CARDS_NUM do
        gameData.cards[idx] = math.random(1, 2)
    end
end

function Application.handle(action: string, target: string, value: string): ()
    -- print(`action={action}, target={target}, value={value}`)
    if action == "go-game" and target == "start-game-btn" then
        initCards()
        nav.push("game")
    elseif action == "go-home" and target == "return-back-btn" then
        Timer.cancel("game/next-card")
        nav.back()
    elseif (action == "red-chosen" and target == "red-color") or (action == "black-chosen" and target == "black-color") then
        if gameData.cards[gameData.curCardNum] == 1 and target == "red-color" then
            gameData.winNum += 1
        elseif gameData.cards[gameData.curCardNum] == 2 and target == "black-color" then
            gameData.winNum += 1
        else
            gameData.lossNum += 1
        end
        gameData.cardFlip = true
        Timer.start { id = "game/next-card", delayMs = 1000, value = "flip-back" }
    elseif action == "timer" and target == "game/next-card" and value == "flip-back" then
        gameData.cardFlipBack = true
        Timer.start { id = "game/next-card", delayMs = 700, value = "wait-flip-back" }
    elseif action == "timer" and target == "game/next-card" and value == "wait-flip-back" then
        gameData.curCardNum += 1
        if gameData.curCardNum <= MAX_CARDS_NUM then
            gameData.cardFlip = false
            gameData.cardFlipBack = false
        end
    end
end

return Application
