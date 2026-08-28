--!strict

local ReferenceData = require("app/reference-data")

assert(type(ReferenceData.release.version) == "string")
assert(ReferenceData.release.version == "0.1.0-alpha")
assert(ReferenceData.release.sourceSdk == "Source SDK contract 10")
assert(ReferenceData.release.runtimeSdk == "Runtime SDK alpha 8")
assert(#ReferenceData.sections >= 28)
assert(#ReferenceData.navigationGroups >= 5)

local ids: {[string]: boolean} = {}
for _, section in ReferenceData.sections do
    assert(type(section.id) == "string" and not ids[section.id])
    ids[section.id] = true
end
for _, required in { "installation", "quickstart", "learning-path", "beginner-tutorial", "advanced-tutorial", "events-errors", "policies" } do
    assert(ids[required] == true, `{required} section is missing`)
end

local pageById: {[string]: any} = {}
local pageByName: {[string]: any} = {}
for _, page in ReferenceData.pages do
    assert(type(page.id) == "string" and pageById[page.id] == nil)
    pageById[page.id] = page
    pageByName[page.name] = page
end

for _, name in { "3. Handle the action", "Compile typed routes", "Encode a versioned snapshot", "Validate restored values", "Application.handle", "Application.resolve", "State.encode", "Navigation.compile" } do
    local page = pageByName[name]
    assert(page ~= nil, `{name} page is missing`)
    assert(page.callable == true, `{name} is not marked callable`)
    assert(type(page.parameters) == "table" and #page.parameters > 0, `{name} has no parameter documentation`)
end

assert(pageByName["Type casts with ::"] ~= nil)
assert(string.find(pageByName["Type casts with ::"].code, "::", 1, true) ~= nil)
assert(pageByName["Runtime immutability with table.freeze"] ~= nil)
assert(string.find(pageByName["Runtime immutability with table.freeze"].code, "table.freeze", 1, true) ~= nil)
for _, name in { "Security policy", "Support policy", "Licensing boundary", "Trademark policy", "Releases" } do
    local page = pageByName[name]
    assert(page ~= nil and page.kind == "guide")
    assert(type(page.points) == "table" and #page.points >= 3)
end

local inventoryCount = 0
for moduleName, items in ReferenceData.inventoryPages do
    for itemName, pageId in items do
        inventoryCount += 1
        local page = pageById[pageId]
        assert(page ~= nil, `{moduleName}.{itemName} has no detail page`)
        assert(type(page.description) == "string" and #page.description > 0)
        assert(type(page.signature) == "string" and #page.signature > 0)
        assert(type(page.code) == "string" and #page.code > 0)
        if moduleName == "luastra/ui" then
            assert(type(page.parameters) == "table" and #page.parameters > 0)
            assert(type(page.mentalModel) == "string" and #page.mentalModel > 0)
            assert(type(page.childRules) == "string" and #page.childRules > 0)
            assert(type(page.accessibility) == "string" and #page.accessibility > 0)
            assert(type(page.commonMistakes) == "table" and #page.commonMistakes > 0)
        end
    end
end
assert(inventoryCount == 85)

local typeInventoryCount = 0
for moduleName, items in ReferenceData.typeInventoryPages do
    for typeName, pageId in items do
        typeInventoryCount += 1
        local page = pageById[pageId]
        assert(page ~= nil, `{moduleName}.{typeName} has no type detail page`)
        assert(page.kind == "type")
        assert(type(page.description) == "string" and #page.description > 0)
        assert(type(page.signature) == "string" and string.find(page.signature, "export type", 1, true) == 1)
        assert(page.code == page.signature)
        assert(type(page.parameters) == "table" and #page.parameters > 0)
    end
end
assert(typeInventoryCount == 60)

return true
