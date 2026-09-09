--!strict
local UI = require("luastra/ui")
local Assets = require("luastra/assets")
local license = require("app/font-license")
local Application = {}
local branded = true
local large = false
local showLicense = false
function Application.render(): UI.Node
    local heading: UI.TextStyle = { size = if large then 48 else 32, weight = 400, lineHeight = 1.25, fallback = "serif" }
    if branded then heading.font = Assets.font("font/atkinson-regular") end
    return UI.Screen { id = "app", padding = "lg", gap = "lg",
        UI.Text { id = "heading", text = "Readable by design", variant = "title", textStyle = heading },
        UI.Text { id = "sample", text = "Atkinson Hyperlegible: clear letterforms for everyday reading. 0123456789 Il1 O0", textStyle = { font = Assets.font("font/atkinson-regular"), size = 20, lineHeight = 1.6, fallback = "sans" } },
        UI.Text { id = "default", text = "This paragraph retains the default Luastra typography." },
        UI.Button { id = "font", text = if branded then "Use system fallback" else "Use packaged font", onTap = "font.toggle" },
        UI.Button { id = "size", text = "Change heading size", onTap = "size.toggle" },
        UI.Button { id = "license", text = "Show font license", onTap = "license.toggle" },
        UI.Column { id = "license-text", hidden = not showLicense,
            UI.CodeBlock { id = "license-one", code = license[1] },
            UI.CodeBlock { id = "license-two", code = license[2] },
        },
    }
end
function Application.handle(action: string, _target: string, _value: string)
    if action == "font.toggle" then branded = not branded
    elseif action == "size.toggle" then large = not large
    elseif action == "license.toggle" then showLicense = not showLicense end
end
return Application
