#include <algorithm>
#include <cctype>
#include <cstdio>
#include <fstream>
#include <iostream>
#include <iterator>
#include <optional>
#include <set>
#include <sstream>
#include <stdexcept>
#include <string>
#include <unordered_map>
#include <vector>

#include "Luau/Ast.h"
#include "Luau/BuiltinDefinitions.h"
#include "Luau/Config.h"
#include "Luau/Frontend.h"
#include "Luau/ModuleResolver.h"
#include "Luau/ToString.h"
#include "Luau/Type.h"

namespace
{
constexpr const char* analyzerIdentity = "luau-analysis/0.731;commit/f8ca77acdcb50241e3da21af663f8ef97b4b5ce4";

struct ModuleSource
{
    std::string path;
    std::string source;
};

struct Diagnostic
{
    std::string module;
    std::string file;
    std::string message;
    int startLine = 0;
    int startColumn = 0;
    int endLine = 0;
    int endColumn = 0;
};

std::string readFile(const std::string& path)
{
    std::ifstream input(path, std::ios::binary);
    if (!input)
        throw std::runtime_error("cannot open source: " + path);
    return std::string(std::istreambuf_iterator<char>(input), std::istreambuf_iterator<char>());
}

bool isModuleId(const std::string& value)
{
    if (value.empty() || value.size() > 256 || value.front() == '/' || value.back() == '/')
        return false;
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
        else if (character < 0x20)
        {
            char buffer[7];
            std::snprintf(buffer, sizeof(buffer), "\\u%04x", character);
            escaped += buffer;
        }
        else escaped += static_cast<char>(character);
    }
    return escaped;
}

class ProjectFileResolver final : public Luau::FileResolver
{
public:
    explicit ProjectFileResolver(std::unordered_map<std::string, ModuleSource> modules)
        : modules(std::move(modules))
    {
    }

    std::optional<Luau::SourceCode> readSource(const Luau::ModuleName& name) override
    {
        const auto module = modules.find(name);
        if (module == modules.end()) return std::nullopt;
        return Luau::SourceCode{module->second.source, Luau::SourceCode::Module};
    }

    std::optional<Luau::ModuleInfo> resolveModule(
        const Luau::ModuleInfo*,
        Luau::AstExpr* expression,
        const Luau::TypeCheckLimits&) override
    {
        const Luau::AstExprConstantString* literal = expression->as<Luau::AstExprConstantString>();
        if (!literal) return std::nullopt;
        const std::string requested(literal->value.data, literal->value.size);
        if (!isModuleId(requested) || modules.count(requested) == 0) return std::nullopt;
        return Luau::ModuleInfo{requested};
    }

    std::string getHumanReadableModuleName(const Luau::ModuleName& name) const override
    {
        const auto module = modules.find(name);
        return module == modules.end() ? name : module->second.path;
    }

    const ModuleSource* find(const std::string& name) const
    {
        const auto module = modules.find(name);
        return module == modules.end() ? nullptr : &module->second;
    }

private:
    std::unordered_map<std::string, ModuleSource> modules;
};

class StrictConfigResolver final : public Luau::ConfigResolver
{
public:
    StrictConfigResolver()
    {
        config.mode = Luau::Mode::Strict;
    }

    const Luau::Config& getConfig(const Luau::ModuleName&, const Luau::TypeCheckLimits&) const override
    {
        return config;
    }

private:
    Luau::Config config;
};

void printResult(const std::vector<Diagnostic>& diagnostics)
{
    std::cout << "{\"success\":" << (diagnostics.empty() ? "true" : "false")
              << ",\"analyzer\":\"" << analyzerIdentity << "\",\"diagnostics\":[";
    for (size_t index = 0; index < diagnostics.size(); ++index)
    {
        if (index > 0) std::cout << ',';
        const Diagnostic& item = diagnostics[index];
        std::cout << "{\"severity\":\"error\",\"module\":\"" << escapeJson(item.module)
                  << "\",\"file\":\"" << escapeJson(item.file)
                  << "\",\"message\":\"" << escapeJson(item.message)
                  << "\",\"startLine\":" << item.startLine
                  << ",\"startColumn\":" << item.startColumn
                  << ",\"endLine\":" << item.endLine
                  << ",\"endColumn\":" << item.endColumn << '}';
    }
    std::cout << "]}\n";
}
} // namespace

int main(int argc, char** argv)
{
    if (argc == 2 && std::string(argv[1]) == "--version")
    {
        std::cout << analyzerIdentity << '\n';
        return 0;
    }
    if (argc < 3 || std::string(argv[1]).rfind("--entry=", 0) != 0)
    {
        std::cerr << "usage: luastra_analyze --entry=<module-id> <module-id>=<source> ...\n";
        return 2;
    }

    try
    {
        const std::string entry = std::string(argv[1]).substr(8);
        if (!isModuleId(entry)) throw std::runtime_error("invalid entry module ID: " + entry);

        std::unordered_map<std::string, ModuleSource> modules;
        for (int index = 2; index < argc; ++index)
        {
            const std::string argument = argv[index];
            const size_t separator = argument.find('=');
            if (separator == std::string::npos) throw std::runtime_error("invalid module argument: " + argument);
            const std::string id = argument.substr(0, separator);
            const std::string path = argument.substr(separator + 1);
            if (!isModuleId(id)) throw std::runtime_error("invalid module ID: " + id);
            if (!modules.emplace(id, ModuleSource{path, readFile(path)}).second)
                throw std::runtime_error("duplicate module ID: " + id);
        }
        if (modules.count(entry) == 0) throw std::runtime_error("entry module is not registered: " + entry);

        std::vector<std::string> moduleIds;
        moduleIds.reserve(modules.size());
        for (const auto& [id, _] : modules)
            if (id != entry) moduleIds.push_back(id);
        std::sort(moduleIds.begin(), moduleIds.end());
        moduleIds.insert(moduleIds.begin(), entry);

        ProjectFileResolver fileResolver(std::move(modules));
        StrictConfigResolver configResolver;
        Luau::FrontendOptions options;
        options.runLintChecks = true;
        Luau::Frontend frontend(&fileResolver, &configResolver, options);
        frontend.useNewLuauSolver.store(Luau::SolverMode::New);
        Luau::registerBuiltinGlobals(frontend, frontend.globals, false);
        Luau::freeze(frontend.globals.globalTypes);

        std::vector<Diagnostic> diagnostics;
        std::set<std::string> seenDiagnostics;

        for (const std::string& id : moduleIds)
        {
            const Luau::CheckResult result = frontend.check(id);
            for (const Luau::TypeError& error : result.errors)
            {
                const std::string message = Luau::toString(error);
                const std::string key = error.moduleName + ":" + std::to_string(error.location.begin.line) + ":" +
                    std::to_string(error.location.begin.column) + ":" + message;
                if (!seenDiagnostics.insert(key).second) continue;
                const ModuleSource* source = fileResolver.find(error.moduleName);
                diagnostics.push_back(Diagnostic{
                    error.moduleName,
                    source ? source->path : error.moduleName,
                    message,
                    static_cast<int>(error.location.begin.line + 1),
                    static_cast<int>(error.location.begin.column + 1),
                    static_cast<int>(error.location.end.line + 1),
                    static_cast<int>(error.location.end.column + 1),
                });
            }
        }

        printResult(diagnostics);
        return diagnostics.empty() ? 0 : 1;
    }
    catch (const std::exception& exception)
    {
        std::cerr << "luastra_analyze: " << exception.what() << '\n';
        return 2;
    }
}
