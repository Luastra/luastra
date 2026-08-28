--!strict

local app = require("app/main")

assert(#app.snapshot().records == 0, "backend fixture must not invent client-side records")
app.handle("save-record", "crud/save", "")
assert(app.snapshot().titleError == "Title is required.", "invalid save did not expose the field error")

app.handle("lifecycle", "app", "offline")
app.handle("change-title", "crud/title-input", "  Write documentation  ")
app.handle("change-details", "crud/details-input", "  Explain the generated API.  ")
app.handle("save-record", "crud/save", "")
local offline = app.snapshot()
assert(offline.status == "Offline: changes were not sent" and offline.retry, "offline mutation was not retained for explicit retry")
assert(#offline.records == 0 and not offline.busy, "offline mutation changed server-owned records")
assert(app.render().type == "Screen", "CRUD fixture must render a semantic screen")

return true
