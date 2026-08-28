#include <cctype>
#include <cstddef>
#include <algorithm>
#include <exception>
#include <cmath>
#include <iomanip>
#include <memory>
#include <sstream>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <vector>

#include "lua.h"
#include "lualib.h"
#include "protocol.hpp"

#include <emscripten/emscripten.h>
#include <emscripten/heap.h>

#define LUASTRA_EXPORT extern "C" EMSCRIPTEN_KEEPALIVE

namespace
{
constexpr const char* vmIdentity = "luau/0.731;commit/f8ca77acdcb50241e3da21af663f8ef97b4b5ce4";
constexpr size_t maximumSessions = 16;
constexpr size_t maximumModules = 256;
constexpr size_t maximumModuleBytes = 4 * 1024 * 1024;
constexpr size_t maximumTotalBytecodeBytes = 16 * 1024 * 1024;
constexpr size_t maximumRpcPayloadBytes = 16 * 1024;

struct PendingRequest
{
    size_t id = 0;
    std::string kind;
    std::string operation;
    std::string input;
    std::string traceId;
    int deadlineMs = 0;
    bool delivered = false;
};

struct Session
{
    lua_State* globalState = nullptr;
    lua_State* scriptState = nullptr;
    std::string entry;
    std::unordered_map<std::string, std::string> bytecode;
    std::unordered_map<std::string, int> moduleReferences;
    std::unordered_set<std::string> loadingModules;
    std::unordered_set<std::string> allowedCapabilities;
    std::unordered_map<size_t, PendingRequest> pendingRequests;
    std::vector<size_t> requestQueue;
    size_t totalBytecodeBytes = 0;
    std::string output;
    bool outputTruncated = false;
    std::string renderTreeJson;
    int applicationReference = LUA_NOREF;
    size_t renderSequence = 0;
    size_t nextRequestId = 1;
    bool started = false;

    ~Session()
    {
        if (globalState) lua_close(globalState);
    }
};

std::unordered_map<int, std::unique_ptr<Session>> sessions;
std::string resultBuffer;
int nextSessionHandle = 1;

std::string escapeJson(const std::string& value)
{
    std::string escaped;
    escaped.reserve(value.size() + 8);
    for (unsigned char character : value)
    {
        if (character == '"') escaped += "\\\"";
        else if (character == '\\') escaped += "\\\\";
        else if (character == '\n') escaped += "\\n";
        else if (character == '\r') escaped += "\\r";
        else if (character == '\t') escaped += "\\t";
        else if (character >= 0x20) escaped += static_cast<char>(character);
        else
        {
            constexpr char hex[] = "0123456789abcdef";
            escaped += "\\u00";
            escaped += hex[(character >> 4) & 0xf];
            escaped += hex[character & 0xf];
        }
    }
    return escaped;
}

const char* result(bool success, const std::string& error = {}, Session* session = nullptr)
{
    std::ostringstream json;
    json << "{\"protocolVersion\":1,\"success\":" << (success ? "true" : "false");
    if (session)
    {
        json << ",\"modules\":" << session->moduleReferences.size();
        json << ",\"output\":\"" << escapeJson(session->output) << "\"";
        if (!session->renderTreeJson.empty()) json << ",\"renderTree\":" << session->renderTreeJson;
        if (!session->renderTreeJson.empty()) json << ",\"renderSequence\":" << session->renderSequence;
        json << ",\"pendingRequests\":" << session->pendingRequests.size();
    }
    if (!error.empty()) json << ",\"error\":\"" << escapeJson(error) << "\"";
    json << '}';
    resultBuffer = json.str();
    if (session)
    {
        session->output.clear();
        session->outputTruncated = false;
    }
    return resultBuffer.c_str();
}

bool isModuleId(const std::string& value)
{
    if (value.empty() || value.size() > 256 || value.front() == '/' || value.back() == '/') return false;
    bool segmentStart = true;
    for (unsigned char character : value)
    {
        if (character == '/')
        {
            if (segmentStart) return false;
            segmentStart = true;
        }
        else if (segmentStart)
        {
            if (character < 'a' || character > 'z') return false;
            segmentStart = false;
        }
        else if (!std::islower(character) && !std::isdigit(character) && character != '_' && character != '-')
            return false;
    }
    return !segmentStart;
}

bool isCapabilityOperation(const std::string& value)
{
    if (value.empty() || value.size() > 128) return false;
    for (unsigned char character : value)
    {
        if (!std::islower(character) && !std::isdigit(character) && character != '.' && character != '_' && character != '-')
            return false;
    }
    return true;
}

bool isActionId(const std::string& value)
{
    if (value.empty() || value.size() > 64 || value.front() < 'a' || value.front() > 'z') return false;
    for (unsigned char character : value)
        if (!std::islower(character) && !std::isdigit(character) && character != '.' && character != '_' && character != '-') return false;
    return true;
}

bool serializeString(lua_State* state, int index, std::string& output, std::string& error)
{
    if (lua_type(state, index) != LUA_TSTRING)
    {
        error = "renderer value must be a string";
        return false;
    }
    size_t length = 0;
    const char* value = lua_tolstring(state, index, &length);
    if (!value || length > Luastra::ProtocolV1::stringBytes)
    {
        error = "renderer string limit exceeded";
        return false;
    }
    output += '\"';
    output += escapeJson(std::string(value, length));
    output += '\"';
    return true;
}

bool motionRange(const std::string& property, double& minimum, double& maximum)
{
    if (property == "opacity") { minimum = 0; maximum = 1; }
    else if (property == "translateX" || property == "translateY") { minimum = -100000; maximum = 100000; }
    else if (property == "scaleX" || property == "scaleY") { minimum = 0; maximum = 100; }
    else if (property == "rotationDeg" || property == "rotationYDeg") { minimum = -360000; maximum = 360000; }
    else return false;
    return true;
}

std::string serializeNumber(double value)
{
    std::string result = std::to_string(value);
    while (result.size() > 1 && result.back() == '0') result.pop_back();
    if (!result.empty() && result.back() == '.') result.pop_back();
    return result == "-0" ? "0" : result;
}

bool serializeTweenDescriptor(lua_State* state, int index, const std::string& property, std::string& output, std::string& error)
{
    if (!lua_istable(state, index)) { error = "motion descriptor must be a table"; return false; }
    const int absolute = lua_absindex(state, index);
    std::unordered_set<std::string> keys;
    lua_pushnil(state);
    while (lua_next(state, absolute) != 0)
    {
        if (lua_type(state, -2) != LUA_TSTRING) { lua_pop(state, 2); error = "motion descriptor keys must be strings"; return false; }
        const std::string key = lua_tostring(state, -2);
        if (key != "kind" && key != "from" && key != "to" && key != "durationMs" && key != "easing")
        { lua_pop(state, 2); error = "unknown motion descriptor field"; return false; }
        keys.insert(key);
        lua_pop(state, 1);
    }
    if (keys.size() != 5) { error = "motion descriptor requires kind, from, to, durationMs and easing"; return false; }

    lua_getfield(state, absolute, "kind");
    const bool validKind = lua_type(state, -1) == LUA_TSTRING && std::string(lua_tostring(state, -1)) == "tween";
    lua_pop(state, 1);
    if (!validKind) { error = "unsupported motion descriptor kind"; return false; }

    lua_getfield(state, absolute, "from");
    const bool fromNumber = lua_isnumber(state, -1);
    const double from = lua_tonumber(state, -1);
    lua_pop(state, 1);
    lua_getfield(state, absolute, "to");
    const bool toNumber = lua_isnumber(state, -1);
    const double to = lua_tonumber(state, -1);
    lua_pop(state, 1);
    lua_getfield(state, absolute, "durationMs");
    const bool durationNumber = lua_isnumber(state, -1);
    const double durationMs = lua_tonumber(state, -1);
    lua_pop(state, 1);
    double minimum = 0;
    double maximum = 0;
    if (!motionRange(property, minimum, maximum) || !fromNumber || !toNumber || !durationNumber ||
        !std::isfinite(from) || !std::isfinite(to) || !std::isfinite(durationMs) ||
        from < minimum || from > maximum || to < minimum || to > maximum || durationMs < 0 || durationMs > 60000)
    { error = "motion descriptor value is outside the supported range"; return false; }

    lua_getfield(state, absolute, "easing");
    const std::string easing = lua_type(state, -1) == LUA_TSTRING ? lua_tostring(state, -1) : "";
    lua_pop(state, 1);
    if (easing != "linear" && easing != "easeOutCubic" && easing != "easeInOutCubic")
    { error = "unsupported motion easing"; return false; }

    output += "{\"durationMs\":" + serializeNumber(durationMs) + ",\"easing\":\"" + easing +
        "\",\"from\":" + serializeNumber(from) + ",\"kind\":\"tween\",\"to\":" + serializeNumber(to) + "}";
    return true;
}

bool serializeWaitDescriptor(lua_State* state, int index, std::string& output, std::string& error)
{
    if (!lua_istable(state, index)) { error = "motion wait must be a table"; return false; }
    const int absolute = lua_absindex(state, index);
    std::unordered_set<std::string> keys;
    lua_pushnil(state);
    while (lua_next(state, absolute) != 0)
    {
        if (lua_type(state, -2) != LUA_TSTRING) { lua_pop(state, 2); error = "motion wait keys must be strings"; return false; }
        const std::string key = lua_tostring(state, -2);
        if (key != "kind" && key != "durationMs") { lua_pop(state, 2); error = "unknown motion wait field"; return false; }
        keys.insert(key); lua_pop(state, 1);
    }
    if (keys.size() != 2) { error = "motion wait requires kind and durationMs"; return false; }
    lua_getfield(state, absolute, "kind");
    const bool validKind = lua_type(state, -1) == LUA_TSTRING && std::string(lua_tostring(state, -1)) == "wait";
    lua_pop(state, 1);
    lua_getfield(state, absolute, "durationMs");
    const bool durationNumber = lua_isnumber(state, -1);
    const double durationMs = lua_tonumber(state, -1);
    lua_pop(state, 1);
    if (!validKind || !durationNumber || !std::isfinite(durationMs) || durationMs < 0 || durationMs > 60000)
    { error = "invalid motion wait descriptor"; return false; }
    output += "{\"durationMs\":" + serializeNumber(durationMs) + ",\"kind\":\"wait\"}";
    return true;
}

bool serializeMotionDescriptor(lua_State* state, int index, const std::string& property, std::string& output, std::string& error)
{
    if (!lua_istable(state, index)) { error = "motion descriptor must be a table"; return false; }
    const int absolute = lua_absindex(state, index);
    lua_getfield(state, absolute, "kind");
    const std::string kind = lua_type(state, -1) == LUA_TSTRING ? lua_tostring(state, -1) : "";
    lua_pop(state, 1);
    if (kind == "tween") return serializeTweenDescriptor(state, absolute, property, output, error);
    if (kind != "sequence") { error = "unsupported motion descriptor kind"; return false; }

    std::unordered_set<std::string> keys;
    lua_pushnil(state);
    while (lua_next(state, absolute) != 0)
    {
        if (lua_type(state, -2) != LUA_TSTRING) { lua_pop(state, 2); error = "motion sequence keys must be strings"; return false; }
        const std::string key = lua_tostring(state, -2);
        if (key != "kind" && key != "steps" && key != "iterations") { lua_pop(state, 2); error = "unknown motion sequence field"; return false; }
        keys.insert(key); lua_pop(state, 1);
    }
    if (keys.size() != 3) { error = "motion sequence requires kind, steps and iterations"; return false; }
    lua_getfield(state, absolute, "iterations");
    const bool iterationsNumber = lua_isnumber(state, -1);
    const double iterationsValue = lua_tonumber(state, -1);
    lua_pop(state, 1);
    if (!iterationsNumber || !std::isfinite(iterationsValue) || std::floor(iterationsValue) != iterationsValue || iterationsValue < 0 || iterationsValue > 1000)
    { error = "motion sequence iterations must be 0 to 1000"; return false; }

    lua_getfield(state, absolute, "steps");
    if (!lua_istable(state, -1)) { lua_pop(state, 1); error = "motion sequence steps must be a table"; return false; }
    const int steps = lua_absindex(state, -1);
    const int stepCount = lua_objlen(state, steps);
    if (stepCount < 1 || stepCount > 32) { lua_pop(state, 1); error = "motion sequence requires 1 to 32 steps"; return false; }
    size_t enumerated = 0;
    lua_pushnil(state);
    while (lua_next(state, steps) != 0)
    {
        const double key = lua_tonumber(state, -2);
        const int keyType = lua_type(state, -2);
        if ((keyType != LUA_TNUMBER && keyType != LUA_TINTEGER) || !std::isfinite(key) || key < 1 || key > stepCount || std::floor(key) != key)
        { lua_pop(state, 2); lua_pop(state, 1); error = "motion sequence steps must be a dense array"; return false; }
        ++enumerated; lua_pop(state, 1);
    }
    if (enumerated != static_cast<size_t>(stepCount)) { lua_pop(state, 1); error = "motion sequence steps array has holes"; return false; }

    std::vector<std::string> encodedSteps;
    bool hasTween = false;
    double totalDuration = 0;
    for (int step = 1; step <= stepCount; ++step)
    {
        lua_rawgeti(state, steps, step);
        if (!lua_istable(state, -1)) { lua_pop(state, 2); error = "motion sequence step must be a table"; return false; }
        lua_getfield(state, -1, "kind");
        const std::string stepKind = lua_type(state, -1) == LUA_TSTRING ? lua_tostring(state, -1) : "";
        lua_pop(state, 1);
        std::string encoded;
        const bool valid = stepKind == "tween" ? serializeTweenDescriptor(state, -1, property, encoded, error)
            : stepKind == "wait" ? serializeWaitDescriptor(state, -1, encoded, error) : false;
        if (!valid) { if (error.empty()) error = "unsupported motion sequence step"; lua_pop(state, 2); return false; }
        hasTween = hasTween || stepKind == "tween";
        lua_getfield(state, -1, "durationMs"); totalDuration += lua_tonumber(state, -1); lua_pop(state, 1);
        encodedSteps.push_back(std::move(encoded)); lua_pop(state, 1);
    }
    lua_pop(state, 1);
    if (!hasTween || (iterationsValue != 1 && totalDuration <= 0)) { error = "motion sequence requires a timed tween"; return false; }
    output += "{\"iterations\":" + serializeNumber(iterationsValue) + ",\"kind\":\"sequence\",\"steps\":[";
    for (size_t position = 0; position < encodedSteps.size(); ++position) { if (position) output += ','; output += encodedSteps[position]; }
    output += "]}";
    return true;
}

bool serializeMotion(lua_State* state, int index, std::string& output, std::string& error)
{
    if (!lua_istable(state, index)) { error = "motion property must be a table"; return false; }
    const int absolute = lua_absindex(state, index);
    std::vector<std::pair<std::string, std::string>> values;
    lua_pushnil(state);
    while (lua_next(state, absolute) != 0)
    {
        if (lua_type(state, -2) != LUA_TSTRING) { lua_pop(state, 2); error = "motion property names must be strings"; return false; }
        const std::string property = lua_tostring(state, -2);
        double minimum = 0;
        double maximum = 0;
        if (!motionRange(property, minimum, maximum)) { lua_pop(state, 2); error = "unsupported motion property"; return false; }
        std::string descriptor;
        if (!serializeMotionDescriptor(state, -1, property, descriptor, error)) { lua_pop(state, 2); return false; }
        values.emplace_back(property, std::move(descriptor));
        lua_pop(state, 1);
        if (values.size() > 7) { lua_pop(state, 1); error = "motion property count limit exceeded"; return false; }
    }
    if (values.empty()) { error = "motion property must not be empty"; return false; }
    std::sort(values.begin(), values.end());
    output += '{';
    for (size_t position = 0; position < values.size(); ++position)
    {
        if (position) output += ',';
        output += '\"' + escapeJson(values[position].first) + "\":" + values[position].second;
    }
    output += '}';
    return true;
}

bool serializeProperties(lua_State* state, int index, std::string& output, std::string& error)
{
    if (!lua_istable(state, index))
    {
        error = "renderer properties must be a table";
        return false;
    }
    const int absolute = lua_absindex(state, index);
    std::vector<std::pair<std::string, std::string>> values;
    lua_pushnil(state);
    while (lua_next(state, absolute) != 0)
    {
        if (lua_type(state, -2) != LUA_TSTRING)
        {
            lua_pop(state, 2);
            error = "renderer property names must be strings";
            return false;
        }
        size_t keyLength = 0;
        const char* keyValue = lua_tolstring(state, -2, &keyLength);
        const std::string key(keyValue, keyLength);
        if (keyLength > 128)
        {
            lua_pop(state, 2);
            error = "renderer property name limit exceeded";
            return false;
        }
        std::string encoded;
        if (key == "motion") {
            if (!serializeMotion(state, -1, encoded, error)) { lua_pop(state, 2); return false; }
        }
        else if (lua_isboolean(state, -1)) encoded = lua_toboolean(state, -1) ? "true" : "false";
        else if (lua_type(state, -1) == LUA_TNUMBER || lua_type(state, -1) == LUA_TINTEGER)
        {
            const double value = lua_tonumber(state, -1);
            if (!std::isfinite(value)) { lua_pop(state, 2); error = "renderer number must be finite"; return false; }
            encoded = serializeNumber(value);
        }
        else if (!serializeString(state, -1, encoded, error))
        {
            lua_pop(state, 2);
            return false;
        }
        values.emplace_back(key, std::move(encoded));
        lua_pop(state, 1);
        if (values.size() > Luastra::ProtocolV1::objectProperties)
        {
            lua_pop(state, 1);
            error = "renderer property count limit exceeded";
            return false;
        }
    }
    std::sort(values.begin(), values.end());
    output += '{';
    for (size_t position = 0; position < values.size(); ++position)
    {
        if (position) output += ',';
        output += '\"' + escapeJson(values[position].first) + "\":" + values[position].second;
    }
    output += '}';
    return true;
}

bool serializeRendererTree(
    lua_State* state,
    int index,
    size_t depth,
    size_t& nodes,
    std::unordered_set<const void*>& active,
    std::unordered_set<std::string>& ids,
    std::string& output,
    std::string& error)
{
    if (!lua_istable(state, index) || depth > Luastra::ProtocolV1::maximumTreeDepth || ++nodes > Luastra::ProtocolV1::maximumTreeNodes)
    {
        error = "renderer tree shape or limit invalid";
        return false;
    }
    const int absolute = lua_absindex(state, index);
    const void* identity = lua_topointer(state, absolute);
    if (!active.insert(identity).second)
    {
        error = "renderer tree cycle";
        return false;
    }

    std::unordered_set<std::string> keys;
    lua_pushnil(state);
    while (lua_next(state, absolute) != 0)
    {
        if (lua_type(state, -2) != LUA_TSTRING)
        {
            lua_pop(state, 2);
            active.erase(identity);
            error = "renderer tree keys must be strings";
            return false;
        }
        const std::string key = lua_tostring(state, -2);
        if (key != "type" && key != "id" && key != "properties" && key != "children")
        {
            lua_pop(state, 2);
            active.erase(identity);
            error = "unknown renderer tree field: " + key;
            return false;
        }
        keys.insert(key);
        lua_pop(state, 1);
    }
    if (keys.size() != 4)
    {
        active.erase(identity);
        error = "renderer tree requires type, id, properties and children";
        return false;
    }

    output += "{\"type\":";
    lua_getfield(state, absolute, "type");
    std::string typeJson;
    if (!serializeString(state, -1, typeJson, error)) { lua_pop(state, 1); active.erase(identity); return false; }
    const std::string type = lua_tostring(state, -1);
    lua_pop(state, 1);
    if (!Luastra::ProtocolV1::validComponentType(type)) { active.erase(identity); error = "unknown renderer component: " + type; return false; }
    output += typeJson;

    output += ",\"id\":";
    lua_getfield(state, absolute, "id");
    std::string idJson;
    if (!serializeString(state, -1, idJson, error)) { lua_pop(state, 1); active.erase(identity); return false; }
    const std::string id = lua_tostring(state, -1);
    lua_pop(state, 1);
    if (id.size() > 128 || !isModuleId(id)) { active.erase(identity); error = "invalid renderer component ID: " + id; return false; }
    if (!ids.insert(id).second) { active.erase(identity); error = "duplicate renderer component ID: " + id; return false; }
    output += idJson;

    output += ",\"properties\":";
    lua_getfield(state, absolute, "properties");
    if (!serializeProperties(state, -1, output, error)) { lua_pop(state, 1); active.erase(identity); return false; }
    lua_pop(state, 1);

    output += ",\"children\":[";
    lua_getfield(state, absolute, "children");
    if (!lua_istable(state, -1)) { lua_pop(state, 1); active.erase(identity); error = "renderer children must be a table"; return false; }
    const int children = lua_absindex(state, -1);
    const int childCount = lua_objlen(state, children);
    if (childCount < 0 || static_cast<size_t>(childCount) > Luastra::ProtocolV1::maximumTreeNodes)
    {
        lua_pop(state, 1); active.erase(identity); error = "renderer children limit exceeded"; return false;
    }
    size_t enumerated = 0;
    lua_pushnil(state);
    while (lua_next(state, children) != 0)
    {
        const double key = lua_tonumber(state, -2);
        const int keyType = lua_type(state, -2);
        if ((keyType != LUA_TNUMBER && keyType != LUA_TINTEGER) || !std::isfinite(key) || key < 1 || key > childCount || std::floor(key) != key)
        {
            lua_pop(state, 2); lua_pop(state, 1); active.erase(identity); error = "renderer children must be a dense array"; return false;
        }
        ++enumerated;
        lua_pop(state, 1);
    }
    if (enumerated != static_cast<size_t>(childCount)) { lua_pop(state, 1); active.erase(identity); error = "renderer children array has holes"; return false; }
    for (int child = 1; child <= childCount; ++child)
    {
        if (child > 1) output += ',';
        lua_rawgeti(state, children, child);
        if (!serializeRendererTree(state, -1, depth + 1, nodes, active, ids, output, error))
        {
            lua_pop(state, 2); active.erase(identity); return false;
        }
        lua_pop(state, 1);
    }
    lua_pop(state, 1);
    output += "]}";
    active.erase(identity);
    return true;
}

Session* findSession(int handle)
{
    const auto session = sessions.find(handle);
    return session == sessions.end() ? nullptr : session->second.get();
}

int capturePrint(lua_State* state)
{
    Session* session = static_cast<Session*>(lua_getthreaddata(state));
    if (!session)
    {
        luaL_error(state, "%s", "print has no VM session");
        return 0;
    }
    if (session->outputTruncated) return 0;
    std::string line;
    for (int index = 1; index <= lua_gettop(state); ++index)
    {
        size_t length = 0;
        const char* text = luaL_tolstring(state, index, &length);
        if (index > 1) line += '\t';
        if (text) line.append(text, length);
        lua_pop(state, 1);
    }
    line += '\n';
    if (line.size() > 4096) line = "[luastra:warn]\tdebug record exceeded 4096 bytes and was omitted\n";
    if (session->output.size() + line.size() > 65536)
    {
        session->output += "[luastra:warn]\tdebug output exceeded 65536 bytes and was truncated\n";
        session->outputTruncated = true;
        return 0;
    }
    session->output += line;
    return 0;
}

int loadModule(lua_State* state, Session& session, const std::string& id)
{
    const auto cached = session.moduleReferences.find(id);
    if (cached != session.moduleReferences.end())
    {
        lua_getref(state, cached->second);
        return 1;
    }
    const auto bytecode = session.bytecode.find(id);
    if (bytecode == session.bytecode.end())
    {
        luaL_error(state, "module is not registered: %s", id.c_str());
        return 0;
    }
    if (!session.loadingModules.insert(id).second)
    {
        luaL_error(state, "cyclic module load: %s", id.c_str());
        return 0;
    }

    const std::string chunkName = "@modules/" + id + ".luau";
    if (luau_load(state, chunkName.c_str(), bytecode->second.data(), bytecode->second.size(), 0) != LUA_OK)
    {
        const std::string message = lua_tostring(state, -1) ? lua_tostring(state, -1) : "failed to load bytecode";
        session.loadingModules.erase(id);
        luaL_error(state, "%s", message.c_str());
        return 0;
    }
    if (lua_pcall(state, 0, 1, 0) != LUA_OK)
    {
        const std::string message = lua_tostring(state, -1) ? lua_tostring(state, -1) : "module initialization failed";
        session.loadingModules.erase(id);
        luaL_error(state, "%s", message.c_str());
        return 0;
    }
    session.loadingModules.erase(id);
    if (lua_isnil(state, -1))
    {
        luaL_error(state, "module must return a value: %s", id.c_str());
        return 0;
    }
    const int reference = lua_ref(state, -1);
    session.moduleReferences.emplace(id, reference);
    return 1;
}

int requireModule(lua_State* state)
{
    Session* session = static_cast<Session*>(lua_getthreaddata(state));
    if (!session)
    {
        luaL_error(state, "%s", "require has no VM session");
        return 0;
    }
    const std::string id = luaL_checkstring(state, 1);
    if (!isModuleId(id))
    {
        luaL_error(state, "invalid module ID: %s", id.c_str());
        return 0;
    }
    return loadModule(state, *session, id);
}

int executeEntry(lua_State* state)
{
    Session* session = static_cast<Session*>(lua_getthreaddata(state));
    if (!session)
    {
        luaL_error(state, "%s", "entry has no VM session");
        return 0;
    }
    return loadModule(state, *session, session->entry);
}

int requestHostCapability(lua_State* state)
{
    Session* session = static_cast<Session*>(lua_getthreaddata(state));
    if (!session)
    {
        luaL_error(state, "%s", "host capability request has no VM session");
        return 0;
    }
    const std::string kind = luaL_checkstring(state, 1);
    const std::string operation = luaL_checkstring(state, 2);
    const int deadlineMs = static_cast<int>(luaL_checkinteger(state, 3));
    const std::string input = lua_gettop(state) >= 4 ? luaL_checkstring(state, 4) : "";
    if (!Luastra::ProtocolV1::validCapabilityKind(kind) || session->allowedCapabilities.count(kind) == 0)
    {
        luaL_error(state, "host capability is not declared: %s", kind.c_str());
        return 0;
    }
    if (kind == "timer.sleep")
    {
        luaL_error(state, "host capability is not implemented by this VM profile: %s", kind.c_str());
        return 0;
    }
    if (kind == "rpc.call" && !Luastra::ProtocolV1::validRpcOperation(operation))
    {
        luaL_error(state, "RPC operation is not declared: %s", operation.c_str());
        return 0;
    }
    if (kind == "timer.control" && !isModuleId(operation))
    {
        luaL_error(state, "invalid timer ID: %s", operation.c_str());
        return 0;
    }
    if (kind != "rpc.call" && kind != "timer.control" && !isCapabilityOperation(operation))
    {
        luaL_error(state, "invalid capability operation: %s", operation.c_str());
        return 0;
    }
    if (kind == "app.launchurl.get" && operation != "launch-url")
    {
        luaL_error(state, "unsupported app capability operation: %s", operation.c_str());
        return 0;
    }
    if (input.size() > Luastra::ProtocolV1::stringBytes)
    {
        luaL_error(state, "%s", "capability input exceeds protocol string limit");
        return 0;
    }
    if (!Luastra::ProtocolV1::validDeadline(deadlineMs))
    {
        luaL_error(state, "%s", "RPC deadline is outside protocol limits");
        return 0;
    }
    if (session->pendingRequests.size() >= Luastra::ProtocolV1::inFlightRequests)
    {
        luaL_error(state, "%s", "host capability in-flight limit exceeded");
        return 0;
    }
    const size_t requestId = session->nextRequestId++;
    const std::string traceId = "trace-" + std::to_string(requestId);
    session->pendingRequests.emplace(requestId, PendingRequest{requestId, kind, operation, input, traceId, deadlineMs, false});
    session->requestQueue.push_back(requestId);
    lua_pushinteger(state, static_cast<lua_Integer>(requestId));
    return 1;
}

bool configure(Session& session, std::string& error)
{
    session.globalState = luaL_newstate();
    if (!session.globalState)
    {
        error = "failed to allocate Luau state";
        return false;
    }
    luaL_openlibs(session.globalState);
    lua_pushcfunction(session.globalState, capturePrint, "print");
    lua_setglobal(session.globalState, "print");
    lua_pushcfunction(session.globalState, requireModule, "require");
    lua_setglobal(session.globalState, "require");
    lua_newtable(session.globalState);
    lua_pushcfunction(session.globalState, requestHostCapability, "HostCapability.request");
    lua_setfield(session.globalState, -2, "request");
    lua_setglobal(session.globalState, "HostCapability");
    luaL_sandbox(session.globalState);
    session.scriptState = lua_newthread(session.globalState);
    lua_setthreaddata(session.scriptState, &session);
    luaL_sandboxthread(session.scriptState);
    return true;
}

bool renderApplication(Session& session, std::string& error)
{
    lua_State* state = session.scriptState;
    lua_getref(state, session.applicationReference);
    lua_getfield(state, -1, "render");
    if (!lua_isfunction(state, -1))
    {
        lua_pop(state, 2);
        error = "application render must be a function";
        return false;
    }
    if (lua_pcall(state, 0, 1, 0) != LUA_OK)
    {
        error = lua_tostring(state, -1) ? lua_tostring(state, -1) : "application render failed";
        lua_pop(state, 2);
        return false;
    }
    size_t nodes = 0;
    std::unordered_set<const void*> active;
    std::unordered_set<std::string> ids;
    std::string tree;
    if (!serializeRendererTree(state, -1, 0, nodes, active, ids, tree, error))
    {
        lua_pop(state, 2);
        return false;
    }
    lua_pop(state, 2);
    session.renderTreeJson = std::move(tree);
    ++session.renderSequence;
    return true;
}
} // namespace

LUASTRA_EXPORT const char* luastra_vm_wasm_version()
{
    return vmIdentity;
}

LUASTRA_EXPORT size_t luastra_vm_wasm_memory_bytes()
{
    return emscripten_get_heap_size();
}

LUASTRA_EXPORT int luastra_vm_session_create()
{
    if (sessions.size() >= maximumSessions) return 0;
    auto session = std::make_unique<Session>();
    std::string error;
    if (!configure(*session, error)) return 0;
    const int handle = nextSessionHandle++;
    sessions.emplace(handle, std::move(session));
    return handle;
}

LUASTRA_EXPORT const char* luastra_vm_session_add_module(
    int handle,
    const char* idValue,
    const unsigned char* bytecodeValue,
    size_t bytecodeSize)
{
    Session* session = findSession(handle);
    if (!session) return result(false, "unknown session");
    if (session->started) return result(false, "session already started");
    const std::string id = idValue ? idValue : "";
    if (!isModuleId(id)) return result(false, "invalid module ID");
    if (!bytecodeValue || bytecodeSize == 0) return result(false, "bytecode must not be empty");
    if (bytecodeSize > maximumModuleBytes) return result(false, "module bytecode limit exceeded");
    if (session->bytecode.size() >= maximumModules) return result(false, "module count limit exceeded");
    if (bytecodeSize > maximumTotalBytecodeBytes - session->totalBytecodeBytes)
        return result(false, "total bytecode limit exceeded");
    if (session->bytecode.count(id) != 0) return result(false, "duplicate module ID");
    session->bytecode.emplace(id, std::string(reinterpret_cast<const char*>(bytecodeValue), bytecodeSize));
    session->totalBytecodeBytes += bytecodeSize;
    return result(true);
}

LUASTRA_EXPORT const char* luastra_vm_session_allow_capability(int handle, const char* kindValue)
{
    Session* session = findSession(handle);
    if (!session) return result(false, "unknown session");
    if (session->started) return result(false, "capabilities are sealed after session start");
    const std::string kind = kindValue ? kindValue : "";
    if (!Luastra::ProtocolV1::validCapabilityKind(kind)) return result(false, "unknown host capability");
    session->allowedCapabilities.insert(kind);
    return result(true);
}

const char* startSession(int handle, const char* entryValue, bool requireRendererTree)
{
    Session* session = findSession(handle);
    if (!session) return result(false, "unknown session");
    if (session->started) return result(false, "session already started");
    session->entry = entryValue ? entryValue : "";
    if (!isModuleId(session->entry)) return result(false, "invalid entry module ID");
    if (session->bytecode.count(session->entry) == 0) return result(false, "entry module is not registered");
    session->started = true;
    try
    {
        lua_pushcfunction(session->scriptState, executeEntry, "Luastra.entry");
        if (lua_pcall(session->scriptState, 0, 1, 0) != LUA_OK)
        {
            const std::string error = lua_tostring(session->scriptState, -1)
                ? lua_tostring(session->scriptState, -1)
                : "entry execution failed";
            return result(false, error, session);
        }
        if (requireRendererTree)
        {
            lua_getfield(session->scriptState, -1, "render");
            const bool application = lua_isfunction(session->scriptState, -1);
            lua_pop(session->scriptState, 1);
            std::string treeError;
            if (application)
            {
                session->applicationReference = lua_ref(session->scriptState, -1);
                if (!renderApplication(*session, treeError)) return result(false, treeError, session);
            }
            else
            {
                size_t nodes = 0;
                std::unordered_set<const void*> active;
                std::unordered_set<std::string> ids;
                std::string tree;
                if (!serializeRendererTree(session->scriptState, -1, 0, nodes, active, ids, tree, treeError))
                    return result(false, treeError, session);
                session->renderTreeJson = std::move(tree);
                session->renderSequence = 1;
            }
        }
        lua_pop(session->scriptState, 1);
        return result(true, {}, session);
    }
    catch (const std::exception& exception)
    {
        return result(false, std::string("VM exception: ") + exception.what(), session);
    }
    catch (...)
    {
        return result(false, "VM exception while starting session", session);
    }
}

LUASTRA_EXPORT const char* luastra_vm_session_start(int handle, const char* entryValue)
{
    return startSession(handle, entryValue, false);
}

LUASTRA_EXPORT const char* luastra_vm_session_start_ui(int handle, const char* entryValue)
{
    return startSession(handle, entryValue, true);
}

const char* dispatchSession(
    int handle,
    const char* actionValue,
    const char* targetValue,
    const char* valueValue)
{
    Session* session = findSession(handle);
    if (!session) return result(false, "unknown session");
    if (!session->started || session->applicationReference == LUA_NOREF) return result(false, "session has no interactive application");
    const std::string action = actionValue ? actionValue : "";
    const std::string target = targetValue ? targetValue : "";
    const std::string value = valueValue ? valueValue : "";
    if (!isActionId(action)) return result(false, "invalid action ID");
    if (!isModuleId(target)) return result(false, "invalid event target ID");
    if (value.size() > Luastra::ProtocolV1::stringBytes) return result(false, "event value limit exceeded");

    lua_State* state = session->scriptState;
    lua_getref(state, session->applicationReference);
    lua_getfield(state, -1, "handle");
    if (!lua_isfunction(state, -1))
    {
        lua_pop(state, 2);
        return result(false, "application handle must be a function", session);
    }
    lua_pushlstring(state, action.data(), action.size());
    lua_pushlstring(state, target.data(), target.size());
    lua_pushlstring(state, value.data(), value.size());
    if (lua_pcall(state, 3, 0, 0) != LUA_OK)
    {
        const std::string error = lua_tostring(state, -1) ? lua_tostring(state, -1) : "application handle failed";
        lua_pop(state, 2);
        return result(false, error, session);
    }
    lua_pop(state, 1);
    std::string renderError;
    if (!renderApplication(*session, renderError)) return result(false, renderError, session);
    return result(true, {}, session);
}

LUASTRA_EXPORT const char* luastra_vm_session_dispatch(
    int handle,
    const char* actionValue,
    const char* targetValue,
    const char* valueValue)
{
    try
    {
        return dispatchSession(handle, actionValue, targetValue, valueValue);
    }
    catch (const std::exception& exception)
    {
        return result(false, std::string("VM exception while dispatching event: ") + exception.what(), findSession(handle));
    }
    catch (...)
    {
        return result(false, "VM exception while dispatching event", findSession(handle));
    }
}

LUASTRA_EXPORT const char* luastra_vm_session_take_request(int handle)
{
    Session* session = findSession(handle);
    if (!session) return result(false, "unknown session");
    if (!session->started) return result(false, "session is not started");
    while (!session->requestQueue.empty())
    {
        const size_t requestId = session->requestQueue.front();
        session->requestQueue.erase(session->requestQueue.begin());
        const auto found = session->pendingRequests.find(requestId);
        if (found == session->pendingRequests.end()) continue;
        PendingRequest& request = found->second;
        if (request.delivered) continue;
        request.delivered = true;
        std::ostringstream json;
        json << "{\"protocolVersion\":1,\"success\":true,\"request\":{"
             << "\"version\":1,\"kind\":\"" << escapeJson(request.kind) << "\""
             << ",\"requestId\":" << request.id
             << ",\"traceId\":\"" << escapeJson(request.traceId) << "\""
             << ",\"deadlineMs\":" << request.deadlineMs
             << ",\"payload\":{\"version\":1,\"operation\":\"" << escapeJson(request.operation) << "\""
             << ",\"input\":\"" << escapeJson(request.input) << "\",\"traceId\":\"" << escapeJson(request.traceId) << "\""
             << ",\"deadlineMs\":" << request.deadlineMs << "}}}";
        resultBuffer = json.str();
        return resultBuffer.c_str();
    }
    resultBuffer = "{\"protocolVersion\":1,\"success\":true,\"request\":null}";
    return resultBuffer.c_str();
}

const char* resolveRpc(
    int handle,
    size_t requestId,
    int successValue,
    const char* payloadValue,
    const char* errorCodeValue,
    const char* errorMessageValue,
    const char* traceIdValue)
{
    Session* session = findSession(handle);
    if (!session) return result(false, "unknown session");
    if (!session->started || session->applicationReference == LUA_NOREF) return result(false, "session has no interactive application");
    const auto found = session->pendingRequests.find(requestId);
    if (found == session->pendingRequests.end()) return result(false, "stale or unknown capability request", session);
    const PendingRequest request = found->second;
    if (!request.delivered) return result(false, "capability request has not been delivered to the host", session);
    const std::string traceId = traceIdValue ? traceIdValue : "";
    const std::string payload = payloadValue ? payloadValue : "";
    const std::string errorCode = errorCodeValue ? errorCodeValue : "";
    const std::string errorMessage = errorMessageValue ? errorMessageValue : "";
    if (traceId != request.traceId) return result(false, "capability trace mismatch", session);
    const size_t payloadLimit = request.kind == "rpc.call" ? maximumRpcPayloadBytes : Luastra::ProtocolV1::stringBytes;
    if (payload.size() > payloadLimit) return result(false, "capability payload limit exceeded", session);
    const bool success = successValue != 0;
    if (success)
    {
        if (!errorCode.empty() || !errorMessage.empty()) return result(false, "successful capability response contains an error", session);
    }
    else if (!Luastra::ProtocolV1::validErrorCode(errorCode) || errorMessage.empty() || errorMessage.size() > 512 || !payload.empty())
        return result(false, "invalid public capability error", session);

    session->pendingRequests.erase(found);
    if (request.kind == "timer.control") return result(true, {}, session);
    lua_State* state = session->scriptState;
    lua_getref(state, session->applicationReference);
    lua_getfield(state, -1, "resolve");
    if (!lua_isfunction(state, -1))
    {
        lua_pop(state, 2);
        return result(false, "application resolve must be a function", session);
    }
    lua_pushinteger(state, static_cast<lua_Integer>(requestId));
    lua_pushboolean(state, success ? 1 : 0);
    lua_pushlstring(state, payload.data(), payload.size());
    lua_pushlstring(state, errorCode.data(), errorCode.size());
    lua_pushlstring(state, errorMessage.data(), errorMessage.size());
    if (lua_pcall(state, 5, 0, 0) != LUA_OK)
    {
        const std::string error = lua_tostring(state, -1) ? lua_tostring(state, -1) : "application resolve failed";
        lua_pop(state, 2);
        return result(false, error, session);
    }
    lua_pop(state, 1);
    std::string renderError;
    if (!renderApplication(*session, renderError)) return result(false, renderError, session);
    return result(true, {}, session);
}

LUASTRA_EXPORT const char* luastra_vm_session_resolve_rpc(
    int handle,
    size_t requestId,
    int successValue,
    const char* payloadValue,
    const char* errorCodeValue,
    const char* errorMessageValue,
    const char* traceIdValue)
{
    try
    {
        return resolveRpc(handle, requestId, successValue, payloadValue, errorCodeValue, errorMessageValue, traceIdValue);
    }
    catch (const std::exception& exception)
    {
        return result(false, std::string("VM exception while resolving RPC: ") + exception.what(), findSession(handle));
    }
    catch (...)
    {
        return result(false, "VM exception while resolving RPC", findSession(handle));
    }
}

LUASTRA_EXPORT const char* luastra_vm_session_destroy(int handle)
{
    const auto session = sessions.find(handle);
    if (session == sessions.end()) return result(false, "unknown session");
    sessions.erase(session);
    return result(true);
}
