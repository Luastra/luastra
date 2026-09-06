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

for _, name in { "Application.handle", "Application.resolve", "State.encode", "Navigation.compile" } do
    local page = pageByName[name]
    assert(page ~= nil, `{name} page is missing`)
    assert(page.callable == true, `{name} is not marked callable`)
    assert(type(page.parameters) == "table" and #page.parameters > 0, `{name} has no parameter documentation`)
end

local beginnerPages: {[string]: any} = {}
for _, page in ReferenceData.pages do
    if page.sectionId == "beginner-tutorial" then beginnerPages[page.name] = page end
end
for _, name in { "1. Create the project", "2. Replace luastra.json", "3. Replace src/main.luau", "4. Replace tests/smoke.luau", "5. Check before running", "6. Run and verify the interface", "7. Make one safe change" } do
    assert(beginnerPages[name] ~= nil, `{name} beginner tutorial page is missing`)
end
assert(string.find(beginnerPages["2. Replace luastra.json"].code, '"tests": ["app/tests/counter"]', 1, true) ~= nil)
assert(string.find(beginnerPages["3. Replace src/main.luau"].code, "function Application.handle", 1, true) ~= nil)
assert(string.find(beginnerPages["3. Replace src/main.luau"].code, "function Application.snapshot", 1, true) ~= nil)
assert(string.find(beginnerPages["4. Replace tests/smoke.luau"].code, "another/control", 1, true) ~= nil)
assert(type(beginnerPages["7. Make one safe change"].points) == "table" and #beginnerPages["7. Make one safe change"].points >= 4)

local advancedPages: {[string]: any} = {}
for _, page in ReferenceData.pages do
    if page.sectionId == "advanced-tutorial" then advancedPages[page.name] = page end
end
for _, name in { "1. Create the project", "2. Replace luastra.json", "3. Replace src/main.luau", "4. Replace tests/smoke.luau", "5. Check the deterministic model", "6. Run the storage round trip", "7. Understand the trust boundaries" } do
    assert(advancedPages[name] ~= nil, `{name} advanced tutorial page is missing`)
end
assert(string.find(advancedPages["2. Replace luastra.json"].code, '"storage.get"', 1, true) ~= nil)
assert(string.find(advancedPages["3. Replace src/main.luau"].code, "router.restoreEncoded", 1, true) ~= nil)
assert(string.find(advancedPages["3. Replace src/main.luau"].code, "Data.decode", 1, true) ~= nil)
assert(string.find(advancedPages["3. Replace src/main.luau"].code, "function Application.resolve", 1, true) ~= nil)
assert(string.find(advancedPages["4. Replace tests/smoke.luau"].code, "invalid restore changed the route", 1, true) ~= nil)

assert(pageByName["Type casts with ::"] ~= nil)
assert(string.find(pageByName["Type casts with ::"].code, "::", 1, true) ~= nil)
assert(pageByName["Runtime immutability with table.freeze"] ~= nil)
assert(string.find(pageByName["Runtime immutability with table.freeze"].code, "table.freeze", 1, true) ~= nil)
assert(pageByName["Read analyzer errors"] ~= nil)
assert(type(pageByName["Read analyzer errors"].points) == "table" and #pageByName["Read analyzer errors"].points >= 5)
for _, name in { "Annotations and inference", "Arrays", "Dictionaries and maps", "Record types", "Enum-like singleton unions", "Optional values", "Unions and type narrowing", "Tagged unions", "Generics", "Function types", "typeof", "Intersections", "any, unknown, and never", "Type casts with ::", "Runtime immutability with table.freeze", "Read analyzer errors" } do
    assert(string.sub(pageByName[name].code, 1, 10) == "--!strict\n", `{name} is not a standalone strict example`)
end
assert(string.find(pageByName["Exported module types"].code, "-- app/main.luau\n--!strict", 1, true) ~= nil)
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
