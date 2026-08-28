--!strict

local UI = require("luastra/ui")

local name = ""
local email = ""
local composed = ""
local bottomNote = ""
local emailError: string? = nil
local status = "Ready for accessibility and keyboard checks"
local modalOpen = false

local Application = {}

function Application.render(): UI.Node
    return UI.Screen {
        id = "accessibility",
        width = "wide",
        padding = "responsive",
        UI.Stack {
            id = "accessibility/content",
            gap = "xl",
            UI.Stack {
                id = "accessibility/intro",
                gap = "sm",
                UI.Text { id = "accessibility/title", text = "Accessibility and keyboard lab", variant = "title" },
                UI.Text { id = "accessibility/description", text = "A host-neutral Luastra fixture for real screen readers, IME, scaling and keyboard avoidance.", tone = "muted" },
                UI.Text { id = "accessibility/status", text = status, role = "status", tone = emailError ~= nil and "error" or "success" },
            },
            UI.Grid {
                id = "accessibility/fields",
                columns = "two",
                gap = "lg",
                responsive = true,
                UI.Card {
                    id = "accessibility/contact-card",
                    gap = "md",
                    padding = "lg",
                    surface = "elevated",
                    UI.Text { id = "accessibility/contact-heading", text = "Contact details", variant = "heading" },
                    UI.Field {
                        id = "accessibility/name-field",
                        gap = "xs",
                        role = "group",
                        label = "Name field",
                        UI.Text { id = "accessibility/name-label", text = "Name" },
                        UI.TextInput { id = "accessibility/name-input", label = "Name", value = name, onInput = "change-name", inputMode = "text", enterKeyHint = "next", autoComplete = "name", required = true },
                    },
                    UI.Field {
                        id = "accessibility/email-field",
                        gap = "xs",
                        role = "group",
                        label = "Email field",
                        UI.Text { id = "accessibility/email-label", text = "Email" },
                        UI.TextInput { id = "accessibility/email-input", label = "Email", value = email, onInput = "change-email", inputType = "email", inputMode = "email", enterKeyHint = "next", autoComplete = "email", required = true, errorId = emailError ~= nil and "accessibility/email-error" or nil },
                        UI.Text { id = "accessibility/email-error", text = emailError or "", role = "alert", tone = "error", hidden = emailError == nil },
                    },
                    UI.Field {
                        id = "accessibility/composed-field",
                        gap = "xs",
                        role = "group",
                        label = "Composing text field",
                        UI.Text { id = "accessibility/composed-label", text = "Composing text" },
                        UI.TextInput { id = "accessibility/composed-input", label = "Composing text", value = composed, onInput = "change-composed", inputMode = "text", enterKeyHint = "done", autoComplete = "off" },
                        UI.Text { id = "accessibility/composed-hint", text = "Use Russian, Japanese conversion, suggestions, selection and deletion.", tone = "muted" },
                    },
                    UI.Actions {
                        id = "accessibility/actions",
                        gap = "sm",
                        responsive = true,
                        UI.Button { id = "accessibility/validate", text = "Validate", onTap = "validate", appearance = "primary" },
                        UI.Button { id = "accessibility/open-modal", text = "Open information", onTap = "open-modal", appearance = "secondary" },
                    },
                },
                UI.Card {
                    id = "accessibility/checklist-card",
                    gap = "md",
                    padding = "lg",
                    surface = "card",
                    UI.Text { id = "accessibility/checklist-heading", text = "Traversal checklist", variant = "heading" },
                    UI.List {
                        id = "accessibility/checklist",
                        label = "Accessibility traversal checklist",
                        gap = "sm",
                        UI.ListItem { id = "accessibility/checklist/headings", text = "Logical title and heading order" },
                        UI.ListItem { id = "accessibility/checklist/labels", text = "Labels, required state and validation alert" },
                        UI.ListItem { id = "accessibility/checklist/modal", text = "Modal boundary, dismissal and focus return" },
                        UI.ListItem { id = "accessibility/checklist/scaling", text = "Large text and responsive reflow" },
                    },
                },
            },
            UI.Card {
                id = "accessibility/keyboard-card",
                gap = "md",
                padding = "lg",
                surface = "elevated",
                UI.Text { id = "accessibility/keyboard-heading", text = "Bottom keyboard-avoidance field", variant = "heading" },
                UI.Text { id = "accessibility/keyboard-copy", text = "On a phone, focus this field after scrolling to verify that the software keyboard cannot cover it.", tone = "muted" },
                UI.TextInput { id = "accessibility/bottom-input", label = "Bottom note", value = bottomNote, onInput = "change-bottom", inputMode = "text", enterKeyHint = "done", autoComplete = "off" },
            },
        },
        UI.Modal {
            id = "accessibility/modal",
            label = "Accessibility information",
            open = modalOpen,
            onDismiss = "close-modal",
            UI.Stack {
                id = "accessibility/modal-content",
                gap = "md",
                padding = "lg",
                UI.Text { id = "accessibility/modal-title", text = "Accessible modal", variant = "heading" },
                UI.Text { id = "accessibility/modal-copy", text = "Focus should remain inside this dialog and return to Open information after dismissal." },
                UI.Button { id = "accessibility/modal-close", text = "Close", onTap = "close-modal", appearance = "primary" },
            },
        },
    }
end

function Application.handle(action: string, target: string, value: string)
    if action == "change-name" and target == "accessibility/name-input" then name = value status = "Name updated" return end
    if action == "change-email" and target == "accessibility/email-input" then email = value emailError = nil status = "Email updated" return end
    if action == "change-composed" and target == "accessibility/composed-input" then composed = value status = "Composed text committed" return end
    if action == "change-bottom" and target == "accessibility/bottom-input" then bottomNote = value status = "Bottom note updated" return end
    if action == "validate" and target == "accessibility/validate" then
        if email == "" or string.find(email, "@", 1, true) == nil then emailError = "Enter a valid email address." status = "Validation failed"
        else emailError = nil status = "Validation passed" end
        return
    end
    if action == "open-modal" and target == "accessibility/open-modal" then modalOpen = true status = "Information opened" return end
    if action == "close-modal" and (target == "accessibility/modal-close" or target == "accessibility/modal") then modalOpen = false status = "Information closed" return end
end

return Application
