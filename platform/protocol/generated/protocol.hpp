// Generated from protocol/schema.v1.json. Do not edit.
#pragma once

#include <array>
#include <cstddef>
#include <string_view>

namespace Luastra::ProtocolV1
{
inline constexpr int version = 1;
inline constexpr std::size_t envelopeBytes = 65536;
inline constexpr std::size_t stringBytes = 4096;
inline constexpr std::size_t traceIdBytes = 64;
inline constexpr std::size_t nestingDepth = 16;
inline constexpr std::size_t collectionItems = 1024;
inline constexpr std::size_t objectProperties = 128;
inline constexpr std::size_t inFlightRequests = 16;
inline constexpr int minimumDeadlineMs = 1;
inline constexpr int maximumDeadlineMs = 30000;
inline constexpr std::size_t rendererBatchPatches = 4096;
inline constexpr std::size_t maximumTreeNodes = 10000;
inline constexpr std::size_t maximumTreeDepth = 64;

inline constexpr std::array capabilityKinds{"app.launchurl.get", "clipboard.write", "media.command", "navigation.history", "rpc.call", "storage.get", "storage.set", "timer.control", "timer.sleep"};
inline constexpr std::array resultStatuses{"ok", "error", "cancelled", "deadline"};
inline constexpr std::array publicErrorCodes{"CANCELLED", "DEADLINE", "FORBIDDEN", "INTERNAL", "NETWORK", "UNAUTHORIZED", "VALIDATION"};
inline constexpr std::array patchKinds{"append", "attribute", "create", "event", "focus", "modal", "place", "remove", "remove-attribute", "text"};
inline constexpr std::array semanticTags{"a", "button", "code", "dialog", "div", "h1", "h2", "h3", "hr", "img", "input", "label", "li", "main", "p", "pre", "section", "span", "table", "td", "th", "tr", "ul"};
inline constexpr std::array attributes{"alt", "aria-busy", "aria-controls", "aria-describedby", "aria-expanded", "aria-hidden", "aria-invalid", "aria-label", "aria-live", "autocomplete", "class", "data-language", "data-luastra-aspect-ratio", "data-luastra-background-color", "data-luastra-corner-radius", "data-luastra-document-description", "data-luastra-document-language", "data-luastra-document-title", "data-luastra-fill", "data-luastra-height", "data-luastra-stroke", "data-luastra-stroke-width", "data-luastra-text-color", "data-luastra-theme-accent", "data-luastra-theme-background", "data-luastra-theme-danger", "data-luastra-theme-muted", "data-luastra-theme-success", "data-luastra-theme-surface", "data-luastra-theme-text", "data-luastra-theme-warning", "data-luastra-width", "decoding", "disabled", "enterkeyhint", "hidden", "href", "inputmode", "loading", "placeholder", "rel", "required", "role", "scope", "src", "target", "type", "value"};
inline constexpr std::array rendererEvents{"click", "dismiss", "input"};
inline constexpr std::array componentTypes{"Button", "Code", "CodeBlock", "Column", "Divider", "FlipCard", "Image", "Layer", "Link", "List", "ListItem", "Modal", "Row", "Screen", "Shape", "Table", "TableCell", "TableRow", "Text", "TextInput"};
inline constexpr std::array motionProperties{"opacity", "rotationDeg", "rotationYDeg", "scaleX", "scaleY", "translateX", "translateY"};
inline constexpr std::array motionEasings{"linear", "easeOutCubic", "easeInOutCubic"};
inline constexpr std::array rpcOperations{"server.call.v1", "tasks.admin.v1", "tasks.fail.v1", "tasks.list.v1", "tasks.slow.v1"};

struct CapabilityRequestView
{
    int version;
    std::string_view kind;
    std::size_t requestId;
    std::string_view traceId;
    int deadlineMs;
};

struct RendererPatchView
{
    std::string_view kind;
    std::string_view target;
    std::string_view name;
    std::string_view value;
};

struct RpcRequestView
{
    int version;
    std::string_view operation;
    std::string_view traceId;
    int deadlineMs;
};

template<std::size_t Size>
inline bool contains(const std::array<const char*, Size>& values, std::string_view value)
{
    for (const char* candidate : values) if (value == candidate) return true;
    return false;
}

inline bool validDeadline(int value) { return value >= minimumDeadlineMs && value <= maximumDeadlineMs; }
inline bool boundedString(std::string_view value, std::size_t maximum = stringBytes) { return value.size() <= maximum; }
inline bool validTraceId(std::string_view value)
{
    if (value.empty() || !boundedString(value, traceIdBytes)) return false;
    for (unsigned char c : value)
        if (!((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '.' || c == '_' || c == ':' || c == '-')) return false;
    return true;
}
inline bool validCapabilityKind(std::string_view value) { return contains(capabilityKinds, value); }
inline bool validResultStatus(std::string_view value) { return contains(resultStatuses, value); }
inline bool validErrorCode(std::string_view value) { return contains(publicErrorCodes, value); }
inline bool validPatchKind(std::string_view value) { return contains(patchKinds, value); }
inline bool validSemanticTag(std::string_view value) { return contains(semanticTags, value); }
inline bool validAttribute(std::string_view value) { return contains(attributes, value); }
inline bool validRendererEvent(std::string_view value) { return contains(rendererEvents, value); }
inline bool validComponentType(std::string_view value) { return contains(componentTypes, value); }
inline bool validRpcOperation(std::string_view value) { return contains(rpcOperations, value); }
inline bool validCapabilityRequest(const CapabilityRequestView& value)
{
    return value.version == version && validCapabilityKind(value.kind) && value.requestId > 0 &&
        validTraceId(value.traceId) && validDeadline(value.deadlineMs);
}
inline bool validRendererPatch(const RendererPatchView& value)
{
    if (!validPatchKind(value.kind) || value.target.empty() || !boundedString(value.target, 128) ||
        !boundedString(value.name, 128) || !boundedString(value.value)) return false;
    if (value.kind == "create") return value.name.empty() && validSemanticTag(value.value);
    if (value.kind == "attribute") return validAttribute(value.name);
    if (value.kind == "remove-attribute") return validAttribute(value.name) && value.value.empty();
    if (value.kind == "event") return validRendererEvent(value.name) && boundedString(value.value, 64);
    if (value.kind == "append") return value.name.empty() && !value.value.empty() && boundedString(value.value, 128);
    if (value.kind == "place") return !value.name.empty() && boundedString(value.name, 128) && boundedString(value.value, 128);
    if (value.kind == "focus" || value.kind == "remove") return value.name.empty() && value.value.empty();
    if (value.kind == "modal") return value.name.empty() && (value.value == "open" || value.value == "closed");
    return value.kind == "text" && value.name.empty();
}
inline bool validRpcRequest(const RpcRequestView& value)
{
    return value.version == version && validRpcOperation(value.operation) && validTraceId(value.traceId) && validDeadline(value.deadlineMs);
}
} // namespace Luastra::ProtocolV1
