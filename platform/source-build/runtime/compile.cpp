#include <cstdlib>
#include <fstream>
#include <iostream>
#include <iterator>
#include <stdexcept>
#include <string>

#include "luacode.h"

namespace
{
constexpr const char* compilerIdentity = "luau/0.731;commit/f8ca77acdcb50241e3da21af663f8ef97b4b5ce4";

std::string readFile(const std::string& path)
{
    std::ifstream input(path, std::ios::binary);
    if (!input)
        throw std::runtime_error("cannot open input: " + path);
    return std::string(std::istreambuf_iterator<char>(input), std::istreambuf_iterator<char>());
}

void writeFile(const std::string& path, const char* bytes, size_t size)
{
    std::ofstream output(path, std::ios::binary | std::ios::trunc);
    if (!output)
        throw std::runtime_error("cannot open output: " + path);
    output.write(bytes, static_cast<std::streamsize>(size));
    if (!output)
        throw std::runtime_error("cannot write output: " + path);
}
} // namespace

int main(int argc, char** argv)
{
    if (argc == 2 && std::string(argv[1]) == "--version")
    {
        std::cout << compilerIdentity << '\n';
        return 0;
    }

    if (argc != 3)
    {
        std::cerr << "usage: luastra_compile <input.luau> <output.luauc>\n";
        return 2;
    }

    try
    {
        const std::string source = readFile(argv[1]);
        lua_CompileOptions options{};
        options.optimizationLevel = 1;
        options.debugLevel = 1;
        options.typeInfoLevel = 1;

        size_t bytecodeSize = 0;
        char* bytecode = luau_compile(source.data(), source.size(), &options, &bytecodeSize);
        if (!bytecode)
            throw std::runtime_error("Luau compiler returned no bytecode");

        if (bytecodeSize > 0 && bytecode[0] == 0)
        {
            const std::string diagnostic(bytecode + 1, bytecodeSize - 1);
            std::free(bytecode);
            std::cerr << argv[1] << ": " << diagnostic << '\n';
            return 1;
        }

        writeFile(argv[2], bytecode, bytecodeSize);
        std::free(bytecode);
        return 0;
    }
    catch (const std::exception& exception)
    {
        std::cerr << "luastra_compile: " << exception.what() << '\n';
        return 1;
    }
}

