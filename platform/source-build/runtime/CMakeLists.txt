cmake_minimum_required(VERSION 3.20)
project(LuastraRuntimeSdk LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

set(LUAU_SOURCE_DIR "" CACHE PATH "Exact extracted Luau source tree")
set(LUASTRA_PROTOCOL_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../protocol/generated" CACHE PATH "Generated Luastra protocol headers")

if(NOT EXISTS "${LUAU_SOURCE_DIR}/CMakeLists.txt")
    message(FATAL_ERROR "LUAU_SOURCE_DIR must point to the admitted Luau source tree")
endif()
if(NOT EXISTS "${LUASTRA_PROTOCOL_DIR}/protocol.hpp")
    message(FATAL_ERROR "LUASTRA_PROTOCOL_DIR must contain protocol.hpp")
endif()

if(EMSCRIPTEN)
    set(LUAU_BUILD_CLI OFF CACHE BOOL "" FORCE)
else()
    set(LUAU_BUILD_CLI ON CACHE BOOL "" FORCE)
endif()
if(MSVC)
    # Luau 0.731 applies MSVC linker properties to Luau.UnitTest whenever its
    # CLI targets are enabled. Keep that upstream target configured on Windows;
    # the admitted Luastra build still selects only analyzer/compiler outputs.
    set(LUAU_BUILD_TESTS ON CACHE BOOL "" FORCE)
else()
    set(LUAU_BUILD_TESTS OFF CACHE BOOL "" FORCE)
endif()
set(LUAU_BUILD_WEB OFF CACHE BOOL "" FORCE)
set(LUAU_BUILD_SHARED OFF CACHE BOOL "" FORCE)
if(MSVC)
    get_filename_component(LUASTRA_REPRODUCIBLE_WORK_ROOT "${CMAKE_BINARY_DIR}" DIRECTORY)
    add_compile_options(
        /Brepro
        /Zf
        "/pathmap:${LUASTRA_REPRODUCIBLE_WORK_ROOT}=luastra-work"
    )
    add_link_options(/Brepro)
endif()
add_subdirectory("${LUAU_SOURCE_DIR}" "${CMAKE_BINARY_DIR}/luau")

function(luastra_reproducible_target target)
    if(MSVC)
        target_compile_options(${target} PRIVATE /W4 /Brepro)
        target_link_options(${target} PRIVATE /Brepro)
    else()
        target_compile_options(${target} PRIVATE
            -Wall -Wextra -Wpedantic
            "-ffile-prefix-map=${CMAKE_CURRENT_SOURCE_DIR}=luastra-runtime"
            "-ffile-prefix-map=${LUAU_SOURCE_DIR}=luau-0.731"
            "-ffile-prefix-map=${CMAKE_BINARY_DIR}=luastra-build"
        )
        if(APPLE)
            target_link_options(${target} PRIVATE -Wl,-no_uuid)
        elseif(NOT EMSCRIPTEN)
            target_link_options(${target} PRIVATE -Wl,--build-id=none)
        endif()
    endif()
endfunction()

if(NOT EMSCRIPTEN)
    add_executable(luastra_compile compile.cpp)
    target_link_libraries(luastra_compile PRIVATE Luau.Compiler)
    luastra_reproducible_target(luastra_compile)

    add_executable(luastra_analyze analyze.cpp)
    target_link_libraries(luastra_analyze PRIVATE Luau.Analysis Luau.Config)
    luastra_reproducible_target(luastra_analyze)
endif()

if(EMSCRIPTEN)
    # Luau protected calls use C++ exceptions. The VM library must retain catch
    # sites; enabling exceptions only on the final executable is insufficient.
    target_compile_options(Luau.VM PRIVATE -fexceptions)
    add_executable(luastra_vm_wasm vm_wasm.cpp)
    target_link_libraries(luastra_vm_wasm PRIVATE Luau.VM)
    target_include_directories(luastra_vm_wasm PRIVATE "${LUASTRA_PROTOCOL_DIR}")
    luastra_reproducible_target(luastra_vm_wasm)
    target_compile_options(luastra_vm_wasm PRIVATE -fexceptions)
    set_target_properties(luastra_vm_wasm PROPERTIES OUTPUT_NAME "luastra-vm" SUFFIX ".js")
    target_link_options(luastra_vm_wasm PRIVATE
        -O3
        -flto
        -fexceptions
        -sDISABLE_EXCEPTION_CATCHING=0
        -sEXPORT_ES6=1
        -sMODULARIZE=1
        -sEXPORT_NAME=createLuastraVm
        -sENVIRONMENT=web,worker,node
        -sFILESYSTEM=0
        -sALLOW_MEMORY_GROWTH=1
        -sINITIAL_MEMORY=16777216
        -sMAXIMUM_MEMORY=134217728
        -sSTACK_SIZE=1048576
        -sNO_EXIT_RUNTIME=1
        -sASSERTIONS=0
        -sEMIT_EMSCRIPTEN_LICENSE=1
        "-sEXPORTED_RUNTIME_METHODS=['cwrap','UTF8ToString','writeArrayToMemory']"
        "-sEXPORTED_FUNCTIONS=['_malloc','_free','_luastra_vm_wasm_version','_luastra_vm_wasm_memory_bytes','_luastra_vm_session_create','_luastra_vm_session_add_module','_luastra_vm_session_allow_capability','_luastra_vm_session_start','_luastra_vm_session_start_ui','_luastra_vm_session_dispatch','_luastra_vm_session_take_request','_luastra_vm_session_resolve_rpc','_luastra_vm_session_destroy']"
        -Wl,--gc-sections
    )
endif()
