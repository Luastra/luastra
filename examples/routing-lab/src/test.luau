--!strict

local Application = require("app/main")

assert(Application.snapshot().location == "/", "routing fixture did not start at its root")
Application.handle("open-workspace", "routing/workspace", "")
assert(Application.snapshot().location == "/workspaces/7", "routing fixture workspace navigation failed")
Application.handle("open-document", "routing/document", "")
local snapshot = Application.snapshot()
assert(snapshot.name == "document", "routing fixture nested route name is invalid")
assert(snapshot.location == "/workspaces/7/documents/release-notes?mode=edit", "routing fixture nested location is invalid")
Application.handle("back", "routing/back", "")
assert(Application.snapshot().location == "/workspaces/7", "routing fixture Back failed")

return true
