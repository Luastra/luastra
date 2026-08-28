--!strict

-- Replace the real host timer with a deterministic test double.
local requests: {any} = {}
local environment = getfenv() :: any

environment.HostCapability = {
    request = function(
        kind: string,
        operation: string,
        deadlineMs: number,
        input: string?
    ): number
        table.insert(requests, {
            kind = kind,
            operation = operation,
            deadlineMs = deadlineMs,
            input = input,
        })

        return #requests
    end,
}

-- The application must be required after HostCapability is replaced.
local Application = require("app/main")

-- Find a component by ID anywhere in the UI tree.
local function findNode(node: any, id: string): any?
    if node.id == id then
        return node
    end

    for _, child in ipairs(node.children) do
        local found = findNode(child, id)

        if found ~= nil then
            return found
        end
    end

    return nil
end

-- The application starts on the welcome page.
local welcome = Application.render()

assert(
    welcome.id == "welcome-page",
    "application must start on welcome"
)

-- Start the game.
Application.handle("go-game", "start-game-btn", "")

local game = Application.render()

assert(
    game.id == "game-page",
    "start button must open the game"
)

-- Choose red.
Application.handle("red-chosen", "red-color", "")

assert(
    #requests == 1
        and requests[1].input == "start:1000:flip-back",
    "choice must schedule reveal delay"
)

local revealed = Application.render()
local redButton = findNode(revealed, "red-color")

assert(
    redButton ~= nil
        and redButton.properties.disabled == true,
    "choice buttons must lock while the card is revealed"
)

-- Deliver timer events manually instead of waiting for real time.
Application.handle(
    "timer",
    "game/next-card",
    "flip-back"
)

assert(
    #requests == 2
        and requests[2].input == "start:700:wait-flip-back",
    "first timer must schedule the return delay"
)

Application.handle(
    "timer",
    "game/next-card",
    "wait-flip-back"
)

local nextCard = Application.render()
local enabledButton = findNode(nextCard, "red-color")

assert(
    enabledButton ~= nil
        and enabledButton.properties.disabled == false,
    "timer chain must unlock the next card"
)

-- Exactly one score counter must change.
local wins = findNode(nextCard, "game/wins-text")
local losses = findNode(nextCard, "game/losses-text")

assert(
    wins ~= nil and losses ~= nil,
    "score fields must remain rendered"
)

assert(
    (
        wins.properties.text == "correct: 1"
        and losses.properties.text == "wrong: 0"
    )
    or (
        wins.properties.text == "correct: 0"
        and losses.properties.text == "wrong: 1"
    ),
    "one choice must change exactly one score"
)

-- Advance the game to its end manually.
for _ = 2, 10 do
    Application.handle(
        "timer",
        "game/next-card",
        "wait-flip-back"
    )
end

local finished = Application.render()
local ending = findNode(finished, "the-end")

assert(
    ending ~= nil
        and ending.properties.text == "The End!",
    "ten cards must finish the game"
)

-- Verify navigation home and timer cancellation.
Application.handle(
    "go-home",
    "return-back-btn",
    ""
)

assert(
    #requests == 3
        and requests[3].input == "cancel",
    "leaving the game must cancel its timer"
)

assert(
    Application.render().id == "welcome-page",
    "back button must return home"
)

return true
