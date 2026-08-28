--!strict

local Data = require("luastra/data")
local Model = require("app/model")

local valid = Model.validateDraft("  Ship alpha  ", "  Keep claims honest.  ")
assert(valid.success, "valid draft was rejected")
assert(valid.value.title == "Ship alpha", "title was not normalized")
assert(valid.value.details == "Keep claims honest.", "details were not normalized")

local missing = Model.validateDraft("   ", "Optional")
assert(not missing.success and missing.error.path == "$.title" and missing.error.code == "too_short", "required title failure is not typed")

local extra = Model.decodeRecord({ id = "record-1", title = "A", details = "B", secret = true })
assert(not extra.success and extra.error.code == "unexpected_field", "exact record boundary admitted an unknown field")

local finiteValue = Data.decode(Data.number(), math.huge)
assert(not finiteValue.success and finiteValue.error.code == "expected_number", "number schema admitted an infinite value")

local cyclic: any = {}
cyclic.self = cyclic
local cyclicSchema: any = { kind = "object", fields = {}, options = { exact = true } }
cyclicSchema.fields.self = cyclicSchema
local cycleResult = Data.decode(cyclicSchema, cyclic)
assert(not cycleResult.success and cycleResult.error.code == "schema_cycle", "cyclic schema did not fail closed")

local records = Model.initialRecords()
records = Model.create(records, "record-3", valid.value)
assert(#records == 3 and records[3].title == "Ship alpha", "create failed")
records = Model.update(records, "record-1", valid.value)
assert(records[1].title == "Ship alpha", "update failed")
records = Model.delete(records, "record-2")
assert(#records == 2 and Model.find(records, "record-2") == nil, "delete failed")

return true
