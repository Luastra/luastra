--!strict

local Assets = require("luastra/assets")

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

export type TextStyle = {
    font: Assets.Font?,
    size: number?,
    weight: number?,
    lineHeight: number?,
    fallback: ("sans" | "serif" | "mono")?,
}

-- Author-facing fields are checked before execution. Dynamic tables and
-- semantic constraints (ranges, vocabularies, child structure) still pass
-- through the runtime validators below.
export type Input = {
    [number]: Node,
    id: string,
    accentColor: string?,
    align: string?,
    appearance: string?,
    aspectRatio: number?,
    autoComplete: string?,
    backgroundColor: string?,
    busy: boolean?,
    className: string?,
    code: string?,
    columns: string?,
    cornerRadius: number?,
    count: number?,
    dangerColor: string?,
    depth: number?,
    description: string?,
    disabled: boolean?,
    documentDescription: string?,
    documentLanguage: string?,
    documentTitle: string?,
    enterKeyHint: string?,
    errorId: string?,
    external: boolean?,
    fill: string?,
    fit: string?,
    flow: string?,
    gap: string?,
    header: boolean?,
    height: number?,
    hidden: boolean?,
    href: string?,
    icon: string?,
    inputMode: string?,
    inputType: string?,
    justify: string?,
    label: string?,
    language: string?,
    layerState: string?,
    margin: string?,
    marginBottom: string?,
    marginEnd: string?,
    marginStart: string?,
    marginTop: string?,
    marginX: string?,
    marginY: string?,
    maxVisible: number?,
    motion: unknown,
    mutedColor: string?,
    nodeKind: string?,
    onDismiss: string?,
    onInput: string?,
    onTap: string?,
    open: boolean?,
    orbitMotion: string?,
    orbitTheme: string?,
    padding: string?,
    paddingBottom: string?,
    paddingEnd: string?,
    paddingStart: string?,
    paddingTop: string?,
    paddingX: string?,
    paddingY: string?,
    placeholder: string?,
    presentation: string?,
    priority: number?,
    query: string?,
    relatedTo: { string }?,
    required: boolean?,
    responsive: boolean?,
    resultCount: number?,
    ring: number?,
    role: string?,
    scope: string?,
    scroll: string?,
    selected: boolean?,
    shape: string?,
    signalIcon: string?,
    source: string?,
    status: string?,
    statusTone: string?,
    stroke: string?,
    strokeWidth: number?,
    successColor: string?,
    surface: string?,
    surfaceColor: string?,
    text: string?,
    textStyle: TextStyle?,
    textAlign: string?,
    textColor: string?,
    theme: Theme?,
    title: string?,
    tone: string?,
    totalCount: number?,
    value: string?,
    variant: string?,
    warningColor: string?,
    width: (string | number)?,
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
local buttonIcons: { [string]: boolean } = {
    activity = true,
    palette = true,
    pause = true,
}
table.freeze(buttonIcons)
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
    if string.sub(value, 1, 2) == "#/" then
        local route = string.sub(value, 3)
        if string.sub(route, 1, 1) == "/" or string.find(route, "//", 1, true) ~= nil or string.match(route, "^[%w_/%-%.%%~?&=]*$") == nil then return false end
        local cursor = 1
        while true do
            local escaped = string.find(route, "%", cursor, true)
            if escaped == nil then return true end
            if escaped + 2 > #route or string.match(string.sub(route, escaped + 1, escaped + 2), "^[0-9A-Fa-f][0-9A-Fa-f]$") == nil then return false end
            cursor = escaped + 3
        end
    end
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
    local count = 0
    for token in string.gmatch(value, "[^ ]+") do
        assert(string.match(token, "^[a-z][a-z0-9-]*$") ~= nil, "className contains an invalid token")
        count += 1
    end
    assert(count > 0 and not string.find(value, "  ", 1, true), "className contains an invalid token")
    appendClass(classes, value)
end

local function typography(classes: { string }, value: any, componentType: string)
    assert(componentType == "Text" or componentType == "Button" or componentType == "Link" or componentType == "TextInput" or componentType == "Code" or componentType == "CodeBlock", "textStyle requires a text component")
    assert(type(value) == "table", "textStyle must be a table")
    for key, item in pairs(value) do
        local token = nil
        if key == "font" then
            assert(type(item) == "table", "textStyle font must be an Assets.font reference")
            local fontId: any = (item :: any).id
            local fontKind: any = (item :: any).kind
            local fontUri: any = (item :: any).uri
            assert(fontKind == "font" and validIdentifier(fontId) and #fontId <= 128 and fontUri == "asset:" .. fontId, "textStyle font must be an Assets.font reference")
            local encoded = {}
            for index = 1, #fontId do table.insert(encoded, string.format("%02x", string.byte(fontId, index))) end
            token = "font-" .. table.concat(encoded)
        elseif key == "fallback" then
            assert(item == "sans" or item == "serif" or item == "mono", "invalid textStyle fallback")
            token = "fallback-" .. item
        elseif key == "size" then
            assert(type(item) == "number" and item % 1 == 0 and item >= 8 and item <= 128, "textStyle size must be an integer from 8 to 128")
            token = "size-" .. tostring(item)
        elseif key == "weight" then
            assert(type(item) == "number" and item % 100 == 0 and item >= 100 and item <= 900, "textStyle weight must be 100 through 900 in steps of 100")
            token = "weight-" .. tostring(item)
        elseif key == "lineHeight" then
            assert(type(item) == "number" and item >= 1 and item <= 3 and math.abs(item * 100 - math.round(item * 100)) < 0.000001, "textStyle lineHeight must be 1 through 3 in steps of 0.01")
            token = "leading-" .. tostring(math.round(item * 100))
        else error("unknown textStyle field: " .. tostring(key)) end
        table.insert(classes, "luastra-type-" .. (token :: string))
    end
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
        elseif key == "textStyle" then
            typography(classes, value, componentType)
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
        elseif key == "placeholder" then
            assert(componentType == "TextInput" and type(value) == "string" and #value <= 160, "TextInput placeholder must be a string of at most 160 bytes")
            properties.placeholder = value
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
    local normalized: any = table.clone(input)
    normalized.text = normalized.code
    normalized.code = nil
    local node = make(componentType, normalized)
    assert(#node.children == 0, componentType .. " does not accept children")
    return node
end

local UI = {}
UI.Screen = function(input: Input): Node
    assert(type(input) == "table", "Screen requires a table")
    if input.theme == nil then return make("Screen", input) end

    assert(type(input.theme) == "table", "Screen theme must be a UI.Theme table")
    local merged: any = table.clone(input)
    merged.theme = nil
    for key, value in pairs(input.theme :: any) do
        assert(type(key) == "string" and screenColorProperties[key] == true, "Screen theme contains an unsupported property")
        assert(validHexColor(value), "Screen theme " .. key .. " must be #RRGGBB")
        if merged[key] == nil then merged[key] = value end
    end
    return make("Screen", merged)
end
UI.Column = function(input: Input): Node return make("Column", input) end
UI.Row = function(input: Input): Node return make("Row", input) end
UI.Text = function(input: Input): Node return make("Text", input) end
UI.Button = function(input: Input): Node
    assert(type(input) == "table", "Button requires a table")
    if input.icon ~= nil then
        assert(type(input.icon) == "string" and buttonIcons[input.icon] == true, "Button icon must be activity, palette or pause")
        if input.text == nil or input.text == "" then
            assert(type(input.label) == "string" and #input.label >= 1 and #input.label <= 160, "An icon-only Button requires a label containing 1 to 160 bytes")
        end
    end
    return make("Button", input)
end
UI.Link = function(input: Input): Node
    assert(type(input) == "table", "Link requires a table")
    assert(type(input.text) == "string", "Link requires string text")
    assert(validLink(input.href), "Link href must be a safe node fragment, canonical hash route, or HTTPS URL without credentials")
    if input.external ~= nil then assert(type(input.external) == "boolean", "Link external must be a boolean") end
    local node = make("Link", input)
    assert(#node.children == 0, "Link does not accept children")
    return node
end
UI.Code = function(input: Input): Node return sourceNode("Code", input) end
UI.CodeBlock = function(input: Input): Node return sourceNode("CodeBlock", input) end
UI.Divider = function(input: Input): Node
    local node = make("Divider", input)
    assert(#node.children == 0, "Divider does not accept children")
    return node
end
UI.Image = function(input: Input): Node
    assert(type(input) == "table", "Image requires a table")
    assert(type(input.source) == "string" and string.match(input.source, "^asset:image/[a-z][a-z0-9_/%-]*$") ~= nil, "Image requires an admitted image source")
    assert(type(input.label) == "string", "Image requires a string label; use an empty label for decorative images")
    local node = make("Image", input)
    assert(#node.children == 0, "Image does not accept children")
    return node
end
UI.Shape = function(input: Input): Node
    assert(type(input) == "table", "Shape requires a table")
    assert(type(input.shape) == "string" and styleOptions.shape[input.shape] ~= nil, "Shape requires a supported shape")
    assert(type(input.width) == "number" and input.width >= 1 and input.width <= 4096, "Shape width must be between 1 and 4096")
    assert(type(input.height) == "number" and input.height >= 1 and input.height <= 4096, "Shape height must be between 1 and 4096")
    local node = make("Shape", input)
    assert(#node.children == 0, "Shape does not accept children")
    return node
end
UI.Layer = function(input: Input): Node return make("Layer", input) end
UI.FlipCard = function(input: Input): Node
    local node = make("FlipCard", input)
    assert(#node.children == 2, "FlipCard requires exactly two children: front and back")
    return node
end
UI.TextInput = function(input: Input): Node return make("TextInput", input) end
UI.List = function(input: Input): Node return make("List", input) end
UI.ListItem = function(input: Input): Node return make("ListItem", input) end
UI.Table = function(input: Input): Node
    local node = make("Table", input)
    for _, child in node.children do assert(child.type == "TableRow", "Table children must be TableRow nodes") end
    return node
end
UI.TableRow = function(input: Input): Node
    local node = make("TableRow", input)
    for _, child in node.children do assert(child.type == "TableCell", "TableRow children must be TableCell nodes") end
    return node
end
UI.TableCell = function(input: Input): Node
    assert(type(input) == "table", "TableCell requires a table")
    if input.header ~= nil then assert(type(input.header) == "boolean", "TableCell header must be a boolean") end
    if input.scope ~= nil then assert(input.header == true and (input.scope == "col" or input.scope == "row"), "TableCell scope requires a header cell and must be col or row") end
    return make("TableCell", input)
end
UI.Modal = function(input: Input): Node return make("Modal", input) end
local function addSemanticClass(input: any, semanticClass: string): any
    assert(type(input) == "table", "semantic UI component requires a table")
    local customClass = input.className
    assert(customClass == nil or type(customClass) == "string", "className must be a string")
    local normalized: any = table.clone(input)
    normalized.className = customClass == nil and semanticClass or (customClass :: string) .. " " .. semanticClass
    return normalized
end

local function hasClass(node: Node, className: string): boolean
    return string.find(" " .. node.properties.className .. " ", " " .. className .. " ", 1, true) ~= nil
end

local orbitThemes: { [string]: boolean } = {
    abyss = true, arcade = true, arctic = true, atlas = true, bauhaus = true, biolume = true,
    candy = true, copper = true, editorial = true, luastra = true, sakura = true,
}

local function orbitRelatedTargets(componentType: string, input: any): string?
    local relatedTo = input.relatedTo
    if relatedTo == nil then return nil end
    assert(type(relatedTo) == "table", componentType .. " relatedTo must be an array of node IDs")
    local count = 0
    for key, _ in pairs(relatedTo) do
        assert(type(key) == "number" and key % 1 == 0 and key >= 1 and key <= 8, componentType .. " relatedTo must contain at most 8 contiguous targets")
        count += 1
    end
    assert(count == #relatedTo and count <= 8, componentType .. " relatedTo must contain at most 8 contiguous targets")
    if count == 0 then return nil end
    local seen: { [string]: boolean } = {}
    local targets: { string } = {}
    for _, target in relatedTo do
        assert(validIdentifier(target), componentType .. " relatedTo contains an invalid node ID")
        assert(target ~= input.id, componentType .. " cannot relate to itself")
        assert(seen[target] ~= true, componentType .. " relatedTo contains a duplicate target")
        seen[target] = true
        table.insert(targets, target)
    end
    return table.concat(targets, ",")
end

UI.Orbit = function(input: Input): Node
    assert(type(input) == "table", "Orbit requires a table")
    local presentation = input.presentation == nil and "auto" or input.presentation
    local orbitTheme = input.orbitTheme == nil and "luastra" or input.orbitTheme
    local orbitMotion = input.orbitMotion == nil and "system" or input.orbitMotion
    local maxVisible = input.maxVisible == nil and 12 or input.maxVisible
    assert(presentation == "auto" or presentation == "spatial" or presentation == "list", "Orbit presentation must be auto, spatial or list")
    assert(type(orbitTheme) == "string" and orbitThemes[orbitTheme] == true, "Orbit orbitTheme is not supported")
    assert(orbitMotion == "system" or orbitMotion == "off", "Orbit orbitMotion must be system or off")
    assert(type(maxVisible) == "number" and maxVisible % 1 == 0 and maxVisible >= 4 and maxVisible <= 32, "Orbit maxVisible must be an integer between 4 and 32")
    local normalized: any = table.clone(input)
    normalized.presentation = nil
    normalized.orbitTheme = nil
    normalized.orbitMotion = nil
    normalized.maxVisible = nil
    normalized = addSemanticClass(normalized, "luastra-orbit luastra-orbit-presentation-" .. presentation .. " luastra-orbit-theme-" .. orbitTheme .. " luastra-orbit-motion-" .. orbitMotion .. " luastra-orbit-max-" .. tostring(maxVisible))
    local node = make("Column", normalized)
    local constellationCount = 0
    for _, child in node.children do
        assert(hasClass(child, "luastra-orbit-path") or hasClass(child, "luastra-orbit-search") or hasClass(child, "luastra-constellation") or hasClass(child, "luastra-focus-surface"), "Orbit children must be OrbitPath, OrbitSearch, Constellation or FocusSurface nodes")
        if hasClass(child, "luastra-constellation") then constellationCount += 1 end
    end
    assert(constellationCount > 0, "Orbit requires at least one Constellation")
    return node
end
UI.OrbitPath = function(input: Input): Node
    local normalized = addSemanticClass(input, "luastra-orbit-path")
    if normalized.role == nil then normalized.role = "navigation" end
    local node = make("Row", normalized)
    for _, child in node.children do assert(child.type == "Button" or child.type == "Text", "OrbitPath children must be Button or Text nodes") end
    return node
end
UI.OrbitSearch = function(input: Input): Node
    assert(type(input) == "table", "OrbitSearch requires a table")
    local query = input.query == nil and "" or input.query
    local resultCount = input.resultCount
    local totalCount = input.totalCount
    local label = input.label == nil and "Search this constellation" or input.label
    local placeholder = input.placeholder == nil and label or input.placeholder
    assert(type(query) == "string" and #query <= 160, "OrbitSearch query must be a string of at most 160 bytes")
    assert(type(resultCount) == "number" and resultCount % 1 == 0 and resultCount >= 0, "OrbitSearch resultCount must be a non-negative integer")
    assert(type(totalCount) == "number" and totalCount % 1 == 0 and totalCount >= resultCount, "OrbitSearch totalCount must be an integer at least as large as resultCount")
    assert(type(label) == "string" and #label >= 1 and #label <= 160, "OrbitSearch label must contain 1 to 160 bytes")
    assert(type(placeholder) == "string" and #placeholder <= 160, "OrbitSearch placeholder must be a string of at most 160 bytes")
    assert(validAction(input.onInput), "OrbitSearch onInput must be a valid action")
    local normalized: any = table.clone(input)
    normalized.query = nil
    normalized.resultCount = nil
    normalized.totalCount = nil
    normalized.label = nil
    normalized.placeholder = nil
    normalized.onInput = nil
    normalized = addSemanticClass(normalized, "luastra-orbit-search")
    if query ~= "" and resultCount == 0 then normalized = addSemanticClass(normalized, "luastra-orbit-search-empty") end
    local node = make("Column", normalized)
    assert(#node.children == 0, "OrbitSearch creates its children and does not accept explicit children")
    table.insert(node.children, make("TextInput", {
        id = node.id .. "/input",
        label = label,
        placeholder = placeholder,
        value = query,
        inputMode = "search",
        enterKeyHint = "search",
        autoComplete = "off",
        onInput = input.onInput,
    }))
    local status = query == "" and tostring(totalCount) .. (totalCount == 1 and " node available" or " nodes available")
        or (resultCount == 0 and "No matching nodes. Press Escape to clear." or tostring(resultCount) .. (resultCount == 1 and " matching node" or " matching nodes"))
    table.insert(node.children, make("Text", { id = node.id .. "/status", text = status, role = "status" }))
    return node
end
UI.Constellation = function(input: Input): Node
    assert(type(input) == "table", "Constellation requires a table")
    local layerState = input.layerState == nil and "active" or input.layerState
    local depth = input.depth == nil and 0 or input.depth
    assert(layerState == "active" or layerState == "behind" or layerState == "ahead", "Constellation layerState must be active, behind or ahead")
    assert(type(depth) == "number" and depth % 1 == 0 and depth >= 0 and depth <= 32, "Constellation depth must be an integer between 0 and 32")
    local normalized: any = table.clone(input)
    normalized.layerState = nil
    normalized.depth = nil
    normalized = addSemanticClass(normalized, "luastra-constellation luastra-constellation-state-" .. layerState .. " luastra-constellation-depth-" .. tostring(depth))
    local node = make("Layer", normalized)
    local centerCount = 0
    local orbitNodeCount = 0
    local orbitNodeIds: { [string]: boolean } = {}
    for _, child in node.children do
        assert(hasClass(child, "luastra-orbit-center") or hasClass(child, "luastra-orbit-node"), "Constellation children must be OrbitCenter or OrbitNode nodes")
        if hasClass(child, "luastra-orbit-center") then
            centerCount += 1
        else
            orbitNodeCount += 1
            orbitNodeIds[child.id] = true
        end
    end
    assert(centerCount == 1, "Constellation requires exactly one OrbitCenter")
    assert(orbitNodeCount > 0 and orbitNodeCount <= 64, "Constellation requires between 1 and 64 OrbitNode children")
    for _, child in node.children do
        local relatedTo = child.properties.orbitRelatedTo
        if hasClass(child, "luastra-orbit-node") and type(relatedTo) == "string" then
            for target in string.gmatch(relatedTo, "[^,]+") do
                assert(orbitNodeIds[target] == true, "Constellation relationship target must reference a node in the same constellation")
            end
        end
    end
    return node
end

local function orbitTextComponent(componentType: string, input: any): Node
    assert(type(input) == "table", componentType .. " requires a table")
    assert(type(input.title) == "string" and #input.title >= 1 and #input.title <= 160, componentType .. " title must contain 1 to 160 bytes")
    assert(input.description == nil or (type(input.description) == "string" and #input.description <= 320), componentType .. " description must be a string of at most 320 bytes")
    local normalized: any = table.clone(input)
    local title = normalized.title
    local description = normalized.description
    normalized.title = nil
    normalized.description = nil
    local primitiveType = componentType == "OrbitNode" and "Button" or "Column"
    normalized = addSemanticClass(normalized, componentType == "OrbitNode" and "luastra-orbit-node" or "luastra-orbit-center")
    local node = make(primitiveType, normalized)
    assert(#node.children == 0, componentType .. " creates its text children and does not accept explicit children")
    table.insert(node.children, make("Text", { id = node.id .. "/title", text = title, variant = componentType == "OrbitCenter" and "heading" or "subheading" }))
    if description ~= nil and #description > 0 then
        table.insert(node.children, make("Text", { id = node.id .. "/description", text = description }))
    end
    return node
end

UI.OrbitCenter = function(input: Input): Node return orbitTextComponent("OrbitCenter", input) end
local function orbitStatus(componentType: string, input: any): (string?, string?)
    local status = input.status
    local statusTone = input.statusTone
    if status == nil then
        assert(statusTone == nil, componentType .. " statusTone requires status")
        return nil, nil
    end
    if statusTone == nil then statusTone = "neutral" end
    assert(type(status) == "string" and #status >= 1 and #status <= 80 and string.match(status, "%c") == nil, componentType .. " status must contain 1 to 80 non-control bytes")
    assert(statusTone == "neutral" or statusTone == "active" or statusTone == "success" or statusTone == "warning" or statusTone == "error", componentType .. " statusTone must be neutral, active, success, warning or error")
    return status, statusTone
end
local orbitSignalIcons: { [string]: boolean } = {
    bolt = true,
    book = true,
    check = true,
    compass = true,
    gauge = true,
    grid = true,
    play = true,
    rocket = true,
    search = true,
    settings = true,
    spark = true,
    star = true,
}
table.freeze(orbitSignalIcons)
local function orbitSignalIcon(componentType: string, input: any): string?
    local icon = input.signalIcon
    assert(icon == nil or orbitSignalIcons[icon] == true, componentType .. " signalIcon must be bolt, book, check, compass, gauge, grid, play, rocket, search, settings, spark or star")
    return icon
end
UI.OrbitNode = function(input: Input): Node
    assert(type(input) == "table", "OrbitNode requires a table")
    local nodeKind = input.nodeKind == nil and "leaf" or input.nodeKind
    local priority = input.priority == nil and 2 or input.priority
    local ring = input.ring
    local relatedTo = orbitRelatedTargets("OrbitNode", input)
    local signalIcon = orbitSignalIcon("OrbitNode", input)
    local status, statusTone = orbitStatus("OrbitNode", input)
    assert(nodeKind == "constellation" or nodeKind == "leaf" or nodeKind == "action", "OrbitNode nodeKind must be constellation, leaf or action")
    assert(type(priority) == "number" and priority % 1 == 0 and priority >= 1 and priority <= 3, "OrbitNode priority must be an integer between 1 and 3")
    assert(ring == nil or (type(ring) == "number" and ring % 1 == 0 and ring >= 1 and ring <= 3), "OrbitNode ring must be an integer between 1 and 3")
    assert(input.selected == nil or type(input.selected) == "boolean", "OrbitNode selected must be a boolean")
    local normalized: any = table.clone(input)
    normalized.nodeKind = nil
    normalized.priority = nil
    normalized.ring = nil
    normalized.relatedTo = nil
    normalized.signalIcon = nil
    normalized.status = nil
    normalized.statusTone = nil
    normalized.orbitRelatedTo = relatedTo
    normalized.orbitSignalIcon = signalIcon
    normalized.selected = nil
    normalized = addSemanticClass(normalized, "luastra-orbit-kind-" .. nodeKind .. " luastra-orbit-priority-" .. tostring(priority))
    if statusTone ~= nil then normalized = addSemanticClass(normalized, "luastra-orbit-status-" .. statusTone) end
    if ring ~= nil then normalized = addSemanticClass(normalized, "luastra-orbit-ring-" .. tostring(ring)) end
    if input.selected == true then normalized = addSemanticClass(normalized, "luastra-orbit-selected") end
    local node = orbitTextComponent("OrbitNode", normalized)
    if status ~= nil then
        table.insert(node.children, make("Text", { id = node.id .. "/status", text = status, className = "luastra-orbit-node-status luastra-orbit-status-" .. (statusTone :: string) }))
    end
    return node
end
UI.OrbitCluster = function(input: Input): Node
    assert(type(input) == "table", "OrbitCluster requires a table")
    assert(type(input.title) == "string" and #input.title >= 1 and #input.title <= 160, "OrbitCluster title must contain 1 to 160 bytes")
    assert(type(input.count) == "number" and input.count % 1 == 0 and input.count >= 1 and input.count <= 9999, "OrbitCluster count must be an integer between 1 and 9999")
    local priority = input.priority == nil and 2 or input.priority
    local ring = input.ring
    local relatedTo = orbitRelatedTargets("OrbitCluster", input)
    local signalIcon = orbitSignalIcon("OrbitCluster", input)
    local status, statusTone = orbitStatus("OrbitCluster", input)
    assert(type(priority) == "number" and priority % 1 == 0 and priority >= 1 and priority <= 3, "OrbitCluster priority must be an integer between 1 and 3")
    assert(ring == nil or (type(ring) == "number" and ring % 1 == 0 and ring >= 1 and ring <= 3), "OrbitCluster ring must be an integer between 1 and 3")
    local normalized: any = table.clone(input)
    local title = normalized.title
    local count = normalized.count
    normalized.title = nil
    normalized.count = nil
    normalized.priority = nil
    normalized.ring = nil
    normalized.relatedTo = nil
    normalized.signalIcon = nil
    normalized.status = nil
    normalized.statusTone = nil
    normalized.orbitRelatedTo = relatedTo
    normalized.orbitSignalIcon = signalIcon
    normalized = addSemanticClass(normalized, "luastra-orbit-node luastra-orbit-cluster luastra-orbit-kind-cluster luastra-orbit-priority-" .. tostring(priority))
    if statusTone ~= nil then normalized = addSemanticClass(normalized, "luastra-orbit-status-" .. statusTone) end
    if ring ~= nil then normalized = addSemanticClass(normalized, "luastra-orbit-ring-" .. tostring(ring)) end
    local node = make("Button", normalized)
    assert(#node.children == 0, "OrbitCluster creates its text children and does not accept explicit children")
    table.insert(node.children, make("Text", { id = node.id .. "/title", text = title, variant = "subheading" }))
    table.insert(node.children, make("Text", {
        id = node.id .. "/count",
        text = tostring(count) .. (count == 1 and " item" or " items"),
        className = "luastra-orbit-cluster-count",
    }))
    if status ~= nil then
        table.insert(node.children, make("Text", { id = node.id .. "/status", text = status, className = "luastra-orbit-node-status luastra-orbit-status-" .. (statusTone :: string) }))
    end
    return node
end
UI.FocusSurface = function(input: Input): Node
    local normalized = addSemanticClass(input, "luastra-focus-surface")
    if normalized.open == nil then normalized.open = false end
    return make("Modal", normalized)
end
UI.FocusHeader = function(input: Input): Node
    local node = make("Row", addSemanticClass(input, "luastra-focus-header"))
    local textCount = 0
    local buttonCount = 0
    for _, child in node.children do
        assert(child.type == "Text" or child.type == "Button", "FocusHeader children must be Text or Button nodes")
        if child.type == "Text" then
            assert(child.properties.variant == "heading" and child.properties.hidden ~= true, "FocusHeader Text must be a visible heading")
            textCount += 1
        else
            assert(child.properties.hidden ~= true and child.properties.disabled ~= true, "FocusHeader Button must be available")
            buttonCount += 1
        end
    end
    assert(textCount == 1 and buttonCount == 1, "FocusHeader requires exactly one Text and one Button")
    return node
end
UI.OrbitReturn = function(input: Input): Node return make("Button", addSemanticClass(input, "luastra-orbit-return")) end
UI.Stack = function(input: Input): Node return make("Column", input, "luastra-stack") end
UI.Grid = function(input: Input): Node return make("Row", input, "luastra-grid") end
UI.Scroll = function(input: Input): Node return make("Column", input, "luastra-scroll") end
UI.Card = function(input: Input): Node return make("Column", input, "luastra-card") end
UI.Field = function(input: Input): Node return make("Column", input, "luastra-field") end
UI.Actions = function(input: Input): Node return make("Row", input, "luastra-actions") end

return table.freeze(UI)
