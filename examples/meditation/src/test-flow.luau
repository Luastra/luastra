--!strict

local Application = require("app/main")

local initial = Application.snapshot()
assert(initial.authenticated == false and initial.catalogueCount == 0 and initial.pendingCount == 0)
local tree = Application.render()
assert(tree.type == "Screen" and tree.id == "meditation")
Application.handle("lifecycle", "app", "offline")
assert(Application.snapshot().connectivity == "Offline")
Application.handle("lifecycle", "app", "dispose")
assert(Application.snapshot().disposed == true and Application.snapshot().pendingCount == 0)

return true
