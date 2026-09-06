--!strict

local ReferenceData = require("app/reference-data")

assert(type(ReferenceData.release.version) == "string")
assert(ReferenceData.release.version == "0.1.0-alpha")
assert(ReferenceData.release.sourceSdk == "Source SDK contract 13")
assert(ReferenceData.release.runtimeSdk == "Runtime SDK alpha 8")
assert(#ReferenceData.sections > 32, "documentation routing must scale beyond an enum")
assert(#ReferenceData.navigationGroups >= 5)

local ids: {[string]: boolean} = {}
for _, section in ReferenceData.sections do
    assert(
        type(section.id) == "string"
            and #section.id <= 64
            and string.match(section.id, "^[a-z][a-z0-9%-]*$") ~= nil
            and not ids[section.id]
    )
    ids[section.id] = true
end
for _, required in { "installation", "quickstart", "learning-path", "beginner-tutorial", "advanced-tutorial", "recipes", "recipe-timer", "recipe-navigation", "recipe-storage", "recipe-history", "recipe-form-modal", "recipe-assets-visuals", "recipe-motion", "recipe-server", "recipe-media", "recipe-orbit", "events-errors", "policies" } do
    assert(ids[required] == true, `{required} section is missing`)
end

local pageById: {[string]: any} = {}
local pageByName: {[string]: any} = {}
for _, page in ReferenceData.pages do
    assert(type(page.id) == "string" and pageById[page.id] == nil)
    pageById[page.id] = page
    pageByName[page.name] = page
end

for _, page in ReferenceData.pages do
    local relatedIds: {[string]: boolean} = {}
    assert(type(page.relatedPageIds) == "table" and #page.relatedPageIds <= 4)
    for _, relatedId in page.relatedPageIds do
        assert(pageById[relatedId] ~= nil, `{page.id} links to a missing related page`)
        assert(relatedId ~= page.id, `{page.id} links to itself`)
        assert(relatedId ~= page.previousPageId and relatedId ~= page.nextPageId, `{page.id} duplicates sequential navigation`)
        assert(relatedIds[relatedId] == nil, `{page.id} repeats a related page`)
        relatedIds[relatedId] = true
    end
    if page.previousPageId ~= nil then
        local previousId = page.previousPageId :: string
        assert(pageById[previousId] ~= nil)
        assert(pageById[previousId].sectionId == page.sectionId)
    end
    if page.nextPageId ~= nil then
        local nextId = page.nextPageId :: string
        assert(pageById[nextId] ~= nil)
        assert(pageById[nextId].sectionId == page.sectionId)
    end
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
for _, name in { "Contact routes", "Security policy", "Support policy", "Privacy notice", "Licensing boundary", "Trademark policy", "Releases" } do
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
        assert(type(page.beforeYouUse) == "string" and #page.beforeYouUse > 0)
        assert(type(page.lifecycle) == "string" and #page.lifecycle > 0)
        assert(type(page.expectedOutcome) == "string" and #page.expectedOutcome > 0)
        assert(type(page.failureGuidance) == "string" and #page.failureGuidance > 0)
        assert(type(page.availability) == "string" and #page.availability > 0)
        if moduleName == "luastra/ui" then
            assert(type(page.parameters) == "table" and #page.parameters > 0)
            assert(type(page.mentalModel) == "string" and #page.mentalModel > 0)
            assert(type(page.childRules) == "string" and #page.childRules > 0)
            assert(type(page.accessibility) == "string" and #page.accessibility > 0)
            assert(type(page.commonMistakes) == "table" and #page.commonMistakes > 0)
        end
    end
end
assert(inventoryCount == 95)

local linkedRecipes: {[string]: boolean} = {}
for _, page in ReferenceData.pages do
    if page.completeRecipe ~= nil then
        local description = page.completeRecipe.description
        local pageName = page.name
        assert(ids[page.completeRecipe.sectionId] == true)
        assert(string.match(page.completeRecipe.sectionId, "^recipe%-") ~= nil)
        assert(type(page.completeRecipe.title) == "string" and #page.completeRecipe.title > 0)
        assert(type(description) == "string" and type(pageName) == "string")
        assert(string.find(description, pageName, 1, true) ~= nil)
        linkedRecipes[page.completeRecipe.sectionId] = true
    end
end
for _, recipeId in { "recipe-timer", "recipe-navigation", "recipe-storage", "recipe-history", "recipe-form-modal", "recipe-assets-visuals", "recipe-motion", "recipe-server", "recipe-media", "recipe-orbit" } do
    assert(linkedRecipes[recipeId] == true, `{recipeId} has no API entry point`)
end
assert(pageByName["Timer.start"].completeRecipe.sectionId == "recipe-timer")
assert(pageByName["Data.decode"].completeRecipe.sectionId == "recipe-form-modal")
assert(pageByName["Media.play"].completeRecipe.sectionId == "recipe-media")
assert(pageByName["UI.Orbit"].completeRecipe.sectionId == "recipe-orbit")

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
        assert(type(page.beforeYouUse) == "string" and #page.beforeYouUse > 0)
        assert(type(page.lifecycle) == "string" and #page.lifecycle > 0)
        assert(type(page.expectedOutcome) == "string" and #page.expectedOutcome > 0)
        assert(type(page.failureGuidance) == "string" and #page.failureGuidance > 0)
        assert(type(page.availability) == "string" and #page.availability > 0)
    end
end
assert(typeInventoryCount == 60)

return true
