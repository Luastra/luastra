--!strict

local application = require("app/main")

local initial = application.snapshot()
assert(initial.authenticated == false and initial.catalogueCount == 0 and initial.pendingCount == 0)
local tree = application.render()
assert(tree.type == "Screen" and tree.id == "meditation")
application.handle("lifecycle", "app", "offline")
assert(application.snapshot().connectivity == "Offline")
application.handle("lifecycle", "app", "dispose")
assert(application.snapshot().disposed == true and application.snapshot().pendingCount == 0)

return true
