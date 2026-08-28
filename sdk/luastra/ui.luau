--!strict

export type Properties = { [string]: any }
export type Theme = {
    backgroundColor: string?,
    textColor: string?,
    accentColor: string?,
    mutedColor: string?,
    surfaceColor: string?,
    successColor: string?,
    warningColor: string?,
    dangerColor: string?,
}
export type Node = {
    type: string,
    id: string,
    properties: Properties,
    children: { Node },
}

local defaultClasses: { [string]: string } = {
    Screen = "luastra-screen",
    Column = "luastra-column",
    Row = "luastra-row",
    Text = "luastra-text",
    Button = "luastra-button",
    Code = "luastra-code",
    CodeBlock = "luastra-code-block",
    Divider = "luastra-divider",
    FlipCard = "luastra-flip-card",
    Image = "luastra-image",
    Layer = "luastra-layer",
    Link = "luastra-link",
    TextInput = "luastra-input",
    List = "luastra-list",
    ListItem = "luastra-list-item",
    Modal = "luastra-modal",
    Shape = "luastra-shape",
    Table = "luastra-table",
    TableCell = "luastra-table-cell",
    TableRow = "luastra-table-row",
}

local styleOptions: { [string]: { [string]: string } } = {
    gap = {
        none = "luastra-gap-none", xs = "luastra-gap-xs", sm = "luastra-gap-sm",
        md = "luastra-gap-md", lg = "luastra-gap-lg", xl = "luastra-gap-xl",
    },
    surface = {
        plain = "luastra-surface-plain", card = "luastra-surface-card",
        elevated = "luastra-surface-elevated", accent = "luastra-surface-accent",
    },
    width = {
        full = "luastra-width-full", content = "luastra-width-content", wide = "luastra-width-wide",
    },
    align = {
        start = "luastra-align-start", center = "luastra-align-center", ["end"] = "luastra-align-end",
        stretch = "luastra-align-stretch", between = "luastra-align-between",
    },
    justify = {
        start = "luastra-justify-start", center = "luastra-justify-center",
        ["end"] = "luastra-justify-end", between = "luastra-justify-between",
    },
    flow = { wrap = "luastra-flow-wrap", nowrap = "luastra-flow-nowrap" },
    columns = {
        adaptive = "luastra-columns-adaptive", two = "luastra-columns-two", three = "luastra-columns-three",
    },
    scroll = { vertical = "luastra-scroll-vertical", horizontal = "luastra-scroll-horizontal" },
    tone = {
        muted = "luastra-tone-muted", error = "luastra-tone-error", success = "luastra-tone-success",
    },
    appearance = {
        primary = "luastra-action-primary", secondary = "luastra-action-secondary",
        danger = "luastra-action-danger", ghost = "luastra-action-ghost",
    },
    fit = {
        contain = "luastra-fit-contain", cover = "luastra-fit-cover", fill = "luastra-fit-fill",
        none = "luastra-fit-none", scaleDown = "luastra-fit-scale-down",
    },
    shape = {
        circle = "luastra-shape-circle", diamond = "luastra-shape-diamond",
        hexagon = "luastra-shape-hexagon", oval = "luastra-shape-oval",
        pentagon = "luastra-shape-pentagon", rectangle = "luastra-shape-rectangle",
        roundedRectangle = "luastra-shape-rounded-rectangle", star = "luastra-shape-star",
        triangle = "luastra-shape-triangle",
    },
}

local spacingValues = { "none", "xs", "sm", "md", "lg", "xl" }
for _, property in {
    "padding", "paddingX", "paddingY", "paddingTop", "paddingBottom", "paddingStart", "paddingEnd",
    "margin", "marginX", "marginY", "marginTop", "marginBottom", "marginStart", "marginEnd",
} do
    local values: { [string]: string } = {}
    for _, value in spacingValues do
        values[value] = "luastra-" .. property .. "-" .. value
    end
    styleOptions[property] = values
end
styleOptions.padding.responsive = "luastra-padding-responsive"

local numericFrameComponents: { [string]: boolean } = { FlipCard = true, Image = true, Shape = true }
local scopedColorComponents: { [string]: boolean } = {
    Code = true, CodeBlock = true, Column = true, Layer = true, Link = true, List = true,
    ListItem = true, Modal = true, Row = true, Table = true, TableCell = true, Text = true,
}
local eventProperties: { [string]: boolean } = { onDismiss = true, onInput = true, onTap = true }
local colorTokens: { [string]: boolean } = {
    accent = true, danger = true, muted = true, surface = true, success = true,
    text = true, transparent = true, warning = true,
}
local textAlignClasses: { [string]: string } = {
    start = "luastra-text-align-start",
    center = "luastra-text-align-center",
    ["end"] = "luastra-text-align-end",
}
local screenThemeProperties: { [string]: boolean } = {
    accentColor = true,
    dangerColor = true,
    mutedColor = true,
    surfaceColor = true,
    successColor = true,
    warningColor = true,
}

local screenColorProperties: { [string]: boolean } = {
    backgroundColor = true,
    textColor = true,
    accentColor = true,
    mutedColor = true,
    surfaceColor = true,
    successColor = true,
    warningColor = true,
    dangerColor = true,
}

local function validHexColor(value: any): boolean
    return type(value) == "string" and string.match(value, "^#%x%x%x%x%x%x$") ~= nil
end

local function validColor(value: any): boolean
    return type(value) == "string" and (colorTokens[value] == true or validHexColor(value))
end

local function validIdentifier(value: any): boolean
    if type(value) ~= "string" or #value == 0 or #value > 128 then return false end
    if string.sub(value, 1, 1) == "/" or string.sub(value, -1) == "/" or string.find(value, "//", 1, true) ~= nil then return false end
    if string.match(value, "^[a-z0-9_/-]+$") == nil then return false end
    for segment in string.gmatch(value, "[^/]+") do
        if string.match(segment, "^[a-z][a-z0-9_-]*$") == nil then return false end
    end
    return true
end

local function validAction(value: any): boolean
    return type(value) == "string" and #value <= 64 and string.match(value, "^[a-z][a-z0-9._-]*$") ~= nil
end

local function validLink(value: any): boolean
    if type(value) ~= "string" or #value < 2 or #value > 2048 then return false end
    if string.match(value, "^#[a-z][a-z0-9_/-]*$") ~= nil then return true end
    if string.match(value, "^https://[^%s]+$") == nil then return false end
    return string.find(value, "@", 1, true) == nil
end

local function validLanguage(value: any): boolean
    return type(value) == "string" and (
        string.match(value, "^[a-z][a-z]$") ~= nil
        or string.match(value, "^[a-z][a-z][a-z]$") ~= nil
        or string.match(value, "^[a-z][a-z]%-[A-Z][A-Z]$") ~= nil
    )
end

local function appendClass(classes: { string }, value: string)
    table.insert(classes, value)
end

local function customClasses(classes: { string }, value: any)
    assert(type(value) == "string" and #value <= 256, "className must be a string of at most 256 bytes")
    assert(string.match(value, "^[a-z][a-z0-9-]*( [a-z][a-z0-9-]*)*$") ~= nil, "className contains an invalid token")
    appendClass(classes, value)
end

local function make(componentType: string, input: any, semanticClass: string?): Node
    assert(type(input) == "table", componentType .. " requires a table")
    assert(validIdentifier(input.id), componentType .. " id must use lowercase path segments (letters, digits, _ or -)")
    local properties: Properties = {}
    local children: { Node } = {}
    local numericKeys = 0
    local classes: { string } = { defaultClasses[componentType] }
    if semanticClass ~= nil then appendClass(classes, semanticClass) end

    for key, value in pairs(input) do
        if type(key) == "number" then
            assert(key > 0 and key % 1 == 0, componentType .. " children must use positive integer keys")
            numericKeys += 1
            children[key :: number] = value :: Node
        elseif key == "className" then
            customClasses(classes, value)
        elseif key == "responsive" then
            assert(type(value) == "boolean", "responsive must be a boolean")
            if value then appendClass(classes, "luastra-responsive") end
        elseif key == "width" and type(value) == "number" and numericFrameComponents[componentType] == true then
            assert(value >= 1 and value <= 4096, componentType .. " width must be between 1 and 4096")
            properties.width = value
        elseif key == "height" and numericFrameComponents[componentType] == true then
            assert(type(value) == "number" and value >= 1 and value <= 4096, componentType .. " height must be between 1 and 4096")
            properties.height = value
        elseif key == "aspectRatio" and (componentType == "FlipCard" or componentType == "Image") then
            assert(type(value) == "number" and value >= 0.05 and value <= 20, componentType .. " aspectRatio must be between 0.05 and 20")
            properties.aspectRatio = value
        elseif key == "cornerRadius" and (componentType == "Image" or componentType == "Shape") then
            assert(type(value) == "number" and value >= 0 and value <= 2048, componentType .. " cornerRadius must be between 0 and 2048")
            properties.cornerRadius = value
        elseif key == "strokeWidth" and componentType == "Shape" then
            assert(type(value) == "number" and value >= 0 and value <= 64, "Shape strokeWidth must be between 0 and 64")
            properties.strokeWidth = value
        elseif (key == "fill" or key == "stroke") and componentType == "Shape" then
            assert(validColor(value), "Shape " .. key .. " must be a color token or #RRGGBB")
            properties[key] = value
        elseif key == "textAlign" then
            assert(componentType == "Text", "textAlign is supported only by Text")
            assert(type(value) == "string" and textAlignClasses[value] ~= nil, "Text textAlign must be start, center or end")
            appendClass(classes, textAlignClasses[value])
        elseif key == "variant" and componentType == "Text" then
            assert(value == "title" or value == "heading" or value == "subheading" or value == "body", "Text variant must be title, heading, subheading or body")
            properties.variant = value
        elseif key == "documentTitle" then
            assert(componentType == "Screen" and type(value) == "string" and #value >= 1 and #value <= 160, "Screen documentTitle must contain 1 to 160 bytes")
            properties.documentTitle = value
        elseif key == "documentDescription" then
            assert(componentType == "Screen" and type(value) == "string" and #value >= 1 and #value <= 320, "Screen documentDescription must contain 1 to 320 bytes")
            properties.documentDescription = value
        elseif key == "documentLanguage" then
            assert(componentType == "Screen" and validLanguage(value), "Screen documentLanguage is invalid")
            properties.documentLanguage = value
        elseif key == "textColor" or key == "backgroundColor" then
            assert(componentType == "Screen" or componentType == "Button" or scopedColorComponents[componentType] == true, key .. " is not supported by " .. componentType)
            if componentType == "Screen" then
                assert(validHexColor(value), "Screen " .. key .. " must be #RRGGBB")
            else
                assert(validColor(value), componentType .. " " .. key .. " must be a color token or #RRGGBB")
            end
            properties[key] = value
        elseif type(key) == "string" and eventProperties[key] == true then
            assert(validAction(value), componentType .. " " .. key .. " must start with a lowercase letter and use only lowercase letters, digits, ., _ or -")
            properties[key] = value
        elseif type(key) == "string" and screenThemeProperties[key] == true then
            assert(componentType == "Screen", key .. " is supported only by Screen")
            assert(validHexColor(value), "Screen " .. key .. " must be #RRGGBB")
            properties[key] = value
        elseif type(key) == "string" and styleOptions[key] ~= nil then
            assert(type(value) == "string" and styleOptions[key][value] ~= nil, componentType .. " has an invalid " .. key)
            appendClass(classes, styleOptions[key][value])
        elseif key ~= "id" then
            assert(type(key) == "string", componentType .. " property names must be strings")
            properties[key :: string] = value
        end
    end
    assert(#children == numericKeys, componentType .. " children must be contiguous")
    properties.className = table.concat(classes, " ")

    return {
        type = componentType,
        id = input.id :: string,
        properties = properties,
        children = children,
    }
end

local function sourceNode(componentType: string, input: any): Node
    assert(type(input) == "table", componentType .. " requires a table")
    assert(type(input.code) == "string" and #input.code <= 4096, componentType .. " code must be a string of at most 4096 bytes")
    if input.language ~= nil then
        assert(type(input.language) == "string" and #input.language <= 32 and string.match(input.language, "^[A-Za-z0-9_+.-]+$") ~= nil, componentType .. " language is invalid")
    end
    local normalized = table.clone(input)
    normalized.text = normalized.code
    normalized.code = nil
    local node = make(componentType, normalized)
    assert(#node.children == 0, componentType .. " does not accept children")
    return node
end

local UI = {}
UI.Screen = function(input: any): Node
    assert(type(input) == "table", "Screen requires a table")
    if input.theme == nil then return make("Screen", input) end

    assert(type(input.theme) == "table", "Screen theme must be a UI.Theme table")
    local merged = table.clone(input)
    merged.theme = nil
    for key, value in pairs(input.theme) do
        assert(type(key) == "string" and screenColorProperties[key] == true, "Screen theme contains an unsupported property")
        assert(validHexColor(value), "Screen theme " .. key .. " must be #RRGGBB")
        if merged[key] == nil then merged[key] = value end
    end
    return make("Screen", merged)
end
UI.Column = function(input: any): Node return make("Column", input) end
UI.Row = function(input: any): Node return make("Row", input) end
UI.Text = function(input: any): Node return make("Text", input) end
UI.Button = function(input: any): Node return make("Button", input) end
UI.Link = function(input: any): Node
    assert(type(input) == "table", "Link requires a table")
    assert(type(input.text) == "string", "Link requires string text")
    assert(validLink(input.href), "Link href must be a safe node fragment or HTTPS URL without credentials")
    if input.external ~= nil then assert(type(input.external) == "boolean", "Link external must be a boolean") end
    local node = make("Link", input)
    assert(#node.children == 0, "Link does not accept children")
    return node
end
UI.Code = function(input: any): Node return sourceNode("Code", input) end
UI.CodeBlock = function(input: any): Node return sourceNode("CodeBlock", input) end
UI.Divider = function(input: any): Node
    local node = make("Divider", input)
    assert(#node.children == 0, "Divider does not accept children")
    return node
end
UI.Image = function(input: any): Node
    assert(type(input) == "table", "Image requires a table")
    assert(type(input.source) == "string" and string.match(input.source, "^asset:image/[a-z][a-z0-9_/%-]*$") ~= nil, "Image requires an admitted image source")
    assert(type(input.label) == "string", "Image requires a string label; use an empty label for decorative images")
    local node = make("Image", input)
    assert(#node.children == 0, "Image does not accept children")
    return node
end
UI.Shape = function(input: any): Node
    assert(type(input) == "table", "Shape requires a table")
    assert(type(input.shape) == "string" and styleOptions.shape[input.shape] ~= nil, "Shape requires a supported shape")
    assert(type(input.width) == "number" and input.width >= 1 and input.width <= 4096, "Shape width must be between 1 and 4096")
    assert(type(input.height) == "number" and input.height >= 1 and input.height <= 4096, "Shape height must be between 1 and 4096")
    local node = make("Shape", input)
    assert(#node.children == 0, "Shape does not accept children")
    return node
end
UI.Layer = function(input: any): Node return make("Layer", input) end
UI.FlipCard = function(input: any): Node
    local node = make("FlipCard", input)
    assert(#node.children == 2, "FlipCard requires exactly two children: front and back")
    return node
end
UI.TextInput = function(input: any): Node return make("TextInput", input) end
UI.List = function(input: any): Node return make("List", input) end
UI.ListItem = function(input: any): Node return make("ListItem", input) end
UI.Table = function(input: any): Node
    local node = make("Table", input)
    for _, child in node.children do assert(child.type == "TableRow", "Table children must be TableRow nodes") end
    return node
end
UI.TableRow = function(input: any): Node
    local node = make("TableRow", input)
    for _, child in node.children do assert(child.type == "TableCell", "TableRow children must be TableCell nodes") end
    return node
end
UI.TableCell = function(input: any): Node
    assert(type(input) == "table", "TableCell requires a table")
    if input.header ~= nil then assert(type(input.header) == "boolean", "TableCell header must be a boolean") end
    if input.scope ~= nil then assert(input.header == true and (input.scope == "col" or input.scope == "row"), "TableCell scope requires a header cell and must be col or row") end
    return make("TableCell", input)
end
UI.Modal = function(input: any): Node return make("Modal", input) end
UI.Stack = function(input: any): Node return make("Column", input, "luastra-stack") end
UI.Grid = function(input: any): Node return make("Row", input, "luastra-grid") end
UI.Scroll = function(input: any): Node return make("Column", input, "luastra-scroll") end
UI.Card = function(input: any): Node return make("Column", input, "luastra-card") end
UI.Field = function(input: any): Node return make("Column", input, "luastra-field") end
UI.Actions = function(input: any): Node return make("Row", input, "luastra-actions") end

return table.freeze(UI)
