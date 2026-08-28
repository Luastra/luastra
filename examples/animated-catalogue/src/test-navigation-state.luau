--!strict

local Navigation = require("luastra/navigation")
local State = require("luastra/state")

local navigation = Navigation.create { routes = { "catalogue", "detail", "settings" }, initial = "catalogue", maximumDepth = 4 }
assert(navigation.current() == "catalogue" and not navigation.canBack(), "navigation initial state is invalid")
assert(navigation.push("detail") and navigation.current() == "detail", "navigation push failed")
assert(not navigation.push("detail"), "duplicate current route was pushed")
assert(navigation.replace("settings") and navigation.current() == "settings", "navigation replace failed")
local snapshot = navigation.snapshot()
assert(snapshot.version == 1 and #snapshot.routes == 2, "navigation snapshot is invalid")
assert(navigation.back() and navigation.current() == "catalogue", "navigation back failed")
assert(not navigation.back(), "navigation popped its root")
assert(navigation.restore(snapshot).success and navigation.current() == "settings", "navigation restore failed")
assert(not navigation.restore({ version = 1, routes = { "catalogue", "unknown" } }).success, "unknown route was restored")
local replacedRoot = Navigation.create { routes = { "catalogue", "settings" }, initial = "catalogue" }
assert(replacedRoot.replace("settings") and not replacedRoot.canBack(), "navigation root replace failed")
local restoredRoot = Navigation.create { routes = { "catalogue", "settings" }, initial = "catalogue" }
assert(restoredRoot.restore(replacedRoot.snapshot()).success and restoredRoot.current() == "settings", "replaced root did not restore")

local routes = Navigation.compile {
    { name = "home", path = "/" },
    {
        name = "organisation",
        path = "/organisations/:organisation_id",
        params = { organisation_id = { type = "integer", minimum = 1, maximum = 9999 } },
        query = { tab = { type = "enum", values = { "overview", "members" } } },
    },
    {
        name = "project",
        parent = "organisation",
        path = "projects/:project_slug",
        params = { project_slug = { type = "string", maximumLength = 48 } },
        query = {
            archived = { type = "boolean" },
            view = { type = "enum", values = { "board", "list" }, required = true },
        },
    },
}

local generatedRoute = routes.generate {
    name = "project",
    params = { organisation_id = 42, project_slug = "Luastra café" },
    query = { view = "board", archived = false },
}
assert(generatedRoute.success and generatedRoute.location == "/organisations/42/projects/Luastra%20caf%C3%A9?archived=false&view=board", "nested route generation is not canonical: " .. tostring(generatedRoute.location) .. "/" .. tostring((generatedRoute :: any).error and (generatedRoute :: any).error.code))
local matchedRoute = routes.match(generatedRoute.location :: string) :: any
local matchedEntry = matchedRoute.entry :: any
local matchedParams = matchedEntry.params :: any
local matchedQuery = matchedEntry.query :: any
assert(matchedRoute.success and matchedEntry.name == "project", "nested route did not match")
assert(matchedParams.organisation_id == 42 and matchedParams.project_slug == "Luastra café", "typed path parameters did not round-trip")
assert(matchedQuery.archived == false and matchedQuery.view == "board", "typed query did not round-trip")
local canonicalRoute = routes.canonicalize("/organisations/007/projects/demo?view=list&archived=true")
assert(canonicalRoute.success and canonicalRoute.location == "/organisations/7/projects/demo?archived=true&view=list", "route canonicalization failed")
assert((routes.match("/organisations/7/projects/demo?view=board&view=list") :: any).error.code == "route_not_found", "duplicate query was admitted")
assert((routes.match("/organisations/7/projects/%ZZ?view=board") :: any).error.code == "route_not_found", "malformed percent encoding was admitted")
assert((routes.match("https://foreign.test/organisations/7/projects/demo?view=board") :: any).error.code == "invalid_location", "absolute foreign location was admitted")
assert((routes.match("/organisations/7/projects/demo?unknown=true&view=board") :: any).error.code == "route_not_found", "unknown query was admitted")
assert((routes.match("/organisations/7/projects/demo") :: any).error.code == "route_not_found", "required query was omitted")
assert(not routes.generate { name = "project", params = { organisation_id = 0, project_slug = "demo" }, query = { view = "board" } }.success, "out-of-range route parameter was generated")
assert(not routes.generate { name = "missing", params = {}, query = {} }.success, "unknown route was generated")
local invalidDefinition = pcall(function()
    Navigation.compile { { name = "bad", path = "/bad/:missing" } }
end)
assert(not invalidDefinition, "undefined path parameter was compiled")
assert(Navigation.decideBack { modalOpen = true, canBack = true } == "dismiss-modal", "modal did not win Back arbitration")
assert(Navigation.decideBack { modalOpen = false, canBack = true } == "history", "route stack did not win after modal Back arbitration")
assert(Navigation.decideBack { modalOpen = false, canBack = false } == "exit", "root Back decision did not request exit")

local entryStack = Navigation.createRouter {
    compiler = routes,
    initial = { name = "home", params = {}, query = {} },
    maximumDepth = 4,
}
assert(entryStack.current().name == "home" and entryStack.currentLocation() == "/" and not entryStack.canBack(), "entry stack initial state is invalid")
local firstEntry = { name = "project", params = { organisation_id = 42, project_slug = "alpha" }, query = { view = "board" } }
local secondEntry = { name = "project", params = { organisation_id = 42, project_slug = "beta" }, query = { view = "board" } }
local firstPush = entryStack.push(firstEntry)
assert(firstPush.success and firstPush.changed and entryStack.canBack(), "entry stack push failed")
local duplicatePush = entryStack.push(firstEntry)
assert(duplicatePush.success and not duplicatePush.changed, "exact duplicate entry was not coalesced")
assert(entryStack.push(secondEntry).changed and entryStack.currentLocation() == "/organisations/42/projects/beta?view=board", "same route with different parameters was not distinct")
local entrySnapshot = entryStack.snapshot()
assert(entrySnapshot.version == 2 and #entrySnapshot.entries == 3 and entrySnapshot.entries[3].params.project_slug == "beta", "entry snapshot does not retain route values")
local encodedNavigation = entryStack.encode()
assert(encodedNavigation == "2:3:1:/43:/organisations/42/projects/alpha?view=board42:/organisations/42/projects/beta?view=board", "navigation snapshot encoding is not deterministic")
assert(entryStack.back() and entryStack.currentLocation() == "/organisations/42/projects/alpha?view=board", "entry stack Back failed")
assert(entryStack.restore(entrySnapshot).success and entryStack.currentLocation() == "/organisations/42/projects/beta?view=board", "entry snapshot restore failed")
local replacedEntry = entryStack.replace(firstEntry)
assert(replacedEntry.success and replacedEntry.changed and entryStack.currentLocation() == "/organisations/42/projects/alpha?view=board", "replace did not coalesce the previous exact entry")
local canonicalPush = entryStack.pushLocation("/organisations/007/projects/demo?view=list&archived=true")
assert(canonicalPush.success and canonicalPush.changed and entryStack.currentLocation() == "/organisations/7/projects/demo?archived=true&view=list", "location push was not canonicalized")
local beforeRejectedRestore = entryStack.currentLocation()
local rejectedRestore = entryStack.restore({ version = 2, entries = { { name = "missing", params = {}, query = {} } } })
assert(not rejectedRestore.success and (rejectedRestore :: any).error.code == "invalid_entry" and entryStack.currentLocation() == beforeRejectedRestore, "failed restore mutated the entry stack")
assert(not entryStack.restore({ version = 1, entries = {} }).success and entryStack.currentLocation() == beforeRejectedRestore, "legacy or empty snapshot mutated the entry stack")
assert(entryStack.restoreEncoded(encodedNavigation).success and entryStack.currentLocation() == "/organisations/42/projects/beta?view=board", "encoded navigation restore failed")
local beforeMalformedEncoding = entryStack.currentLocation()
assert(not entryStack.restoreEncoded(encodedNavigation .. "trailing").success and entryStack.currentLocation() == beforeMalformedEncoding, "trailing navigation data mutated the stack")
assert(not entryStack.restoreEncoded("2:1:99:/missing").success and entryStack.currentLocation() == beforeMalformedEncoding, "truncated navigation data mutated the stack")
local shallowStack = Navigation.createRouter { compiler = routes, initial = { name = "home", params = {}, query = {} }, maximumDepth = 2 }
assert(shallowStack.push(firstEntry).success, "bounded entry stack first push failed")
local depthFailure = shallowStack.push(secondEntry)
assert(not depthFailure.success and not depthFailure.changed and (depthFailure :: any).error.code == "stack_depth_exceeded" and shallowStack.currentLocation() == "/organisations/42/projects/alpha?view=board", "entry stack depth failure was not atomic")

local encoded = State.encode(3, { title = "Luastra & 日本語", route = "detail", symbol = "=%" })
local decoded = State.decode(encoded, 3)
assert(decoded.success and decoded.fields.title == "Luastra & 日本語", "Unicode state round-trip failed")
assert(decoded.fields.symbol == "=%" and decoded.fields.route == "detail", "escaped state fields failed")
assert(State.encode(3, { symbol = "=%", route = "detail", title = "Luastra & 日本語" }) == encoded, "state encoding is not deterministic")
local wrongVersion = State.decode(encoded, 2)
assert(not wrongVersion.success and wrongVersion.error.code == "unsupported_version", "state version mismatch did not fail")
assert(not State.decode("v=3&route=%ZZ", 3).success, "malformed percent encoding was accepted")
assert(not State.decode("v=3&route=detail&route=settings", 3).success, "duplicate state field was accepted")

local versionOne = State.encode(1, { name = "Luastra", route = "catalogue" })
local migrated = State.migrate(versionOne, 3, {
    [1] = function(fields)
        fields.name = nil
        return { title = "Luastra", route = fields.route }
    end,
    [2] = function(fields)
        return { title = fields.title, route = fields.route, theme = "calm" }
    end,
})
assert(migrated.success and migrated.version == 3 and migrated.fields.title == "Luastra" and migrated.fields.theme == "calm", "ordered state migration failed")
assert(migrated.encoded == "v=3&route=catalogue&theme=calm&title=Luastra", "migrated state encoding is not deterministic")
assert(versionOne == "v=1&name=Luastra&route=catalogue", "migration mutated its source value")
local alreadyCurrent = State.migrate(migrated.encoded, 3, {})
assert(alreadyCurrent.success and alreadyCurrent.encoded == migrated.encoded, "current state did not pass through migration")
local missingMigration = State.migrate(versionOne, 3, { [1] = function(fields) return { name = fields.name } end })
assert(not missingMigration.success and (missingMigration :: any).error.code == "missing_migration", "missing migration step was admitted")
local throwingMigration = State.migrate(versionOne, 2, { [1] = function(_fields) error("controlled migration failure") end })
assert(not throwingMigration.success and (throwingMigration :: any).error.code == "migration_failed", "throwing migration was admitted")
local reusedInput = State.migrate(versionOne, 2, { [1] = function(fields) return fields end })
assert(not reusedInput.success and (reusedInput :: any).error.code == "invalid_migration", "migration did not require a replacement field table")
local malformedMigration = State.migrate(versionOne, 2, { [1] = function(_fields) return ({ count = 2 } :: any) end })
assert(not malformedMigration.success and (malformedMigration :: any).error.code == "invalid_migration", "malformed migration output was admitted")
local oversizedMigration = State.migrate(versionOne, 2, { [1] = function(_fields) return { content = string.rep("x", State.limits.maximumBytes) } end })
assert(not oversizedMigration.success and (oversizedMigration :: any).error.code == "invalid_migration", "oversized migration output was admitted")
assert(not State.migrate("v=4&route=detail", 3, {}).success, "newer persisted state was admitted")

return true
