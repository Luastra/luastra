--!strict

local UI = require("luastra/ui")

local Examples = {}

local learningSteps = {
    {
        title = "1. Create a project",
        description = "Start from the installed CLI. The generated project already has a strict entry module and a smoke test.",
        code = "luastra create hello-luastra\ncd hello-luastra",
        language = "Shell",
    },
    {
        title = "2. Check the graph",
        description = "Run the analyzer before previewing. It verifies module dependencies, SDK identity, capabilities, assets, and strict Luau types.",
        code = "luastra check",
        language = "Shell",
    },
    {
        title = "3. Describe semantic UI",
        description = "Application.render returns one Screen. Text and Button retain native semantics on every admitted host.",
        code = "return UI.Screen { id = \"app\",\n    UI.Text { id = \"app/title\", text = \"Hello\", variant = \"title\" },\n    UI.Button { id = \"app/continue\", text = \"Continue\", onTap = \"app.continue\" },\n}",
        language = "Luau",
    },
    {
        title = "4. Handle an event",
        description = "The host sends a bounded action. Change application state in handle and let the next render describe the result.",
        code = "function Application.handle(action: string, target: string)\n    if action == \"app.continue\" and target == \"app/continue\" then\n        completed = true\n    end\nend",
        language = "Luau",
    },
    {
        title = "5. Test and preview",
        description = "Keep behavior in Luau tests, then run the local host. The URL printed by run is the source of truth.",
        code = "luastra test\nluastra run",
        language = "Shell",
    },
}

function Examples.learningStepCount(): number
    return #learningSteps
end

function Examples.renderLearning(step: number): UI.Node
    local current = learningSteps[step]
    assert(current ~= nil)
    return UI.Card {
        id = "learn/card",
        width = "full",
        surface = "elevated",
        padding = "lg",
        gap = "md",
        UI.Text {
            id = "learn/progress",
            text = `Step {step} of {#learningSteps}`,
            role = "status",
            tone = "muted",
        },
        UI.Text { id = "learn/title", text = current.title, variant = "subheading" },
        UI.Text { id = "learn/description", text = current.description },
        UI.CodeBlock { id = "learn/code", code = current.code, language = current.language },
        UI.Actions {
            id = "learn/actions",
            gap = "sm",
            responsive = true,
            UI.Button {
                id = "learn/back",
                text = "Back",
                appearance = "secondary",
                onTap = "learn.back",
                disabled = step == 1,
            },
            UI.Button {
                id = "learn/next",
                text = step == #learningSteps and "Completed" or "Next",
                onTap = "learn.next",
                disabled = step == #learningSteps,
            },
            UI.Button {
                id = "learn/reset",
                text = "Reset",
                appearance = "ghost",
                onTap = "learn.reset",
            },
        },
    }
end

function Examples.render(counter: number): UI.Node
    return UI.Card {
        id = "live/example",
        width = "full",
        surface = "card",
        padding = "lg",
        gap = "md",
        UI.Text { id = "live/heading", variant = "subheading", text = "Live Luastra example" },
        UI.Text { id = "live/description", text = "This is not a screenshot: the current Luastra runtime owns the buttons and state." },
        UI.Row {
            id = "live/actions",
            gap = "sm",
            responsive = true,
            UI.Button { id = "live/increment", text = `Clicks: {counter}`, onTap = "example.increment" },
            UI.Button { id = "live/reset", text = "Reset", appearance = "secondary", onTap = "example.reset" },
        },
    }
end

return table.freeze(Examples)
