--!strict

local application = require("app/main")

assert(application.snapshot().location == "/", "routing fixture did not start at its root")
application.handle("open-workspace", "routing/workspace", "")
assert(application.snapshot().location == "/workspaces/7", "routing fixture workspace navigation failed")
application.handle("open-document", "routing/document", "")
local snapshot = application.snapshot()
assert(snapshot.name == "document", "routing fixture nested route name is invalid")
assert(snapshot.location == "/workspaces/7/documents/release-notes?mode=edit", "routing fixture nested location is invalid")
application.handle("back", "routing/back", "")
assert(application.snapshot().location == "/workspaces/7", "routing fixture Back failed")

return true
