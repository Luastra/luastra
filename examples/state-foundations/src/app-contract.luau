--!strict

local App = require("luastra/app")
local UI = require("luastra/ui")

local deliveries = 0
local purpose = "none"
local duplicateRejected = false
local disposedFeatures = 0

local feature: App.Feature<UI.Node> = {
    id = "first",
    handle = function(context: App.Context, action: string, target: string, _value: string)
        if action == "claim" and target == "first/start" then
            context.claim(42, "load")
            duplicateRejected = not pcall(function() context.claim(42, "duplicate") end)
        elseif action == "cancel" and target == "first/cancel" then
            context.claim(43, "cancelled")
            assert(context.cancel(43))
        elseif action == "pending" and target == "first/pending" then
            context.claim(44, "pending")
        end
    end,
    resolve = function(_context: App.Context, _requestId: number, _success: boolean, _payload: string, _errorCode: string, _errorMessage: string, deliveredPurpose: string, _generation: number)
        deliveries += 1
        purpose = deliveredPurpose
    end,
    dispose = function(_context: App.Context) disposedFeatures += 1 end,
}

local second: App.Feature<UI.Node> = { id = "second" }
type StateSnapshot = {
    deliveries: number,
    purpose: string,
}
local application: App.Instance<UI.Node, StateSnapshot>

application = App.compose {
    features = { feature, second },
    render = function(_outputs: { [string]: UI.Node }): UI.Node
        local snapshot = application.snapshot()
        local diagnostics = application.inspect()
        return UI.Screen {
            id = "app-contract",
            UI.Text { id = "deliveries", text = tostring(snapshot.deliveries) },
            UI.Text { id = "purpose", text = snapshot.purpose },
            UI.Text { id = "duplicate", text = tostring(duplicateRejected) },
            UI.Text { id = "active", text = tostring(diagnostics.activeRequests) },
            UI.Text { id = "suppressed", text = tostring(diagnostics.suppressedResults) },
            UI.Text { id = "features", text = table.concat(diagnostics.featureIds, ",") },
            UI.Text { id = "disposed", text = tostring(diagnostics.disposed) },
            UI.Text { id = "disposed-features", text = tostring(disposedFeatures) },
        }
    end,
    snapshot = function(): StateSnapshot
        return table.freeze({ deliveries = deliveries, purpose = purpose }) :: StateSnapshot
    end,
}

application.handle("claim", "first/start", "")
application.resolve(42, true, "accepted", "", "")
application.resolve(42, true, "late", "", "")
application.handle("cancel", "first/cancel", "")
application.resolve(43, true, "cancelled-late", "", "")
application.handle("pending", "first/pending", "")
application.handle("lifecycle", "app", "dispose")
application.resolve(44, true, "disposed-late", "", "")
application.handle("claim", "first/start", "")

return application
