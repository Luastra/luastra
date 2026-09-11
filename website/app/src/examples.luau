--!strict

local UI = require("luastra/ui")

local Examples = {}

local learningSteps = {
    {
        title = "1. Create the starter",
        description = "Prerequisite: luastra doctor reports PASS. Create the project, enter it, then open src/main.luau; that file is the application entry declared by luastra.json.",
        code = "luastra create hello-luastra\ncd hello-luastra\n# Now open src/main.luau in your editor.",
        language = "Shell",
    },
    {
        title = "2. Replace the entry module",
        description = "Paste this complete file into src/main.luau. State lives at module scope, render describes the current screen, and App.compose returns the checked host entry.",
        code = "--!strict\nlocal App = require(\"luastra/app\")\nlocal UI = require(\"luastra/ui\")\n\nlocal completed = false\n\nreturn App.compose {\n    render = function()\n        return UI.Screen {\n            id = \"app\",\n            UI.Text {\n                id = \"app/title\",\n                text = if completed then \"You did it!\" else \"Hello, Luastra\",\n                variant = \"title\",\n                role = \"status\",\n            },\n            UI.Button {\n                id = \"app/continue\",\n                text = if completed then \"Reset\" else \"Continue\",\n                onTap = \"app.toggle\",\n            },\n        }\n    end,\n    handle = function(action: string, target: string, _value: string)\n        if action == \"app.toggle\" and target == \"app/continue\" then\n            completed = not completed\n        end\n    end,\n    snapshot = function()\n        return table.freeze({ completed = completed })\n    end,\n}",
        language = "Luau",
    },
    {
        title = "3. Check the project",
        description = "Run the analyzer before previewing. It verifies the declared module dependency, ui.render capability, SDK identity, stable IDs, and strict Luau types. Continue only after result is PASS.",
        code = "luastra check\n# Expected JSON includes: \"result\":\"PASS\"",
        language = "Shell",
    },
    {
        title = "4. Test the declared modules",
        description = "Run the starter's test module. It confirms basic SDK construction. As your app grows, add tests that call handle and assert the next rendered state.",
        code = "luastra test\n# Expected JSON includes: \"result\":\"PASS\"",
        language = "Shell",
    },
    {
        title = "5. Preview the interaction",
        description = "Start the local host and open the READY URL it prints. Continue changes the heading to You did it!; Reset changes it back. Save the file to trigger a rebuild, and press Ctrl+C to stop.",
        code = "luastra run\n# Open the printed READY URL. Stop with Ctrl+C.",
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
