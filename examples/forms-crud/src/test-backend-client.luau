--!strict

local Api = require("app/server-functions")

local listed = Api.decodeListRecords("v=1&result.records.length=1&result.records.1.details=Typed&result.records.1.id=record-9&result.records.1.title=Generated")
assert(listed ~= nil and #listed.records == 1, "generated list decoder rejected a valid payload")
assert(listed.records[1].id == "record-9" and listed.records[1].title == "Generated", "generated list decoder changed fields")
assert(Api.decodeListRecords("v=1&result.records.length=1&result.records.1.id=record-9") == nil, "generated list decoder accepted missing fields")
assert(Api.decodeCreateRecord("v=1&result.record.details=Safe&result.record.id=record-3&result.record.title=Created") ~= nil, "generated object decoder failed")
assert(Api.decodeDeleteRecord("v=1&result.deletedId=record-3&unexpected=value") == nil, "generated decoder accepted unknown fields")

return true
