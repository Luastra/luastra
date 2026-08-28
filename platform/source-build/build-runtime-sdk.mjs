import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { chmod, copyFile, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { delimiter, relative, resolve, sep } from "node:path";

import { verifySourceBuildContract } from "./verify-source-build-contract.mjs";

const sourceBuildRoot = import.meta.dirname;
const runtimeSource = resolve(sourceBuildRoot, "runtime");
const protocolSource = resolve(sourceBuildRoot, "../protocol/generated");

function fail(message) { throw new Error(message); }
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
}
function json(value) { return `${JSON.stringify(stable(value), null, 2)}\n`; }

function parseArguments(values) {
  const result = { archive: null, emsdk: null, generator: null, output: null, work: null, native: true, wasm: true };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--native-only") result.wasm = false;
    else if (value === "--wasm-only") result.native = false;
    else if (["--archive", "--emsdk", "--generator", "--output", "--work"].includes(value)) result[value.slice(2)] = values[++index] ?? fail(`missing value for ${value}`);
    else fail(`unknown argument: ${value}`);
  }
  if (!result.archive || !result.output || !result.work) fail("usage: build-runtime-sdk.mjs --archive <luau.tar.gz> --work <empty-dir> --output <empty-dir> [--emsdk <root>] [--generator <cmake-generator>] [--native-only|--wasm-only]");
  if (result.native === false && result.wasm === false) fail("at least one build surface is required");
  if (result.wasm && !result.emsdk) fail("--emsdk is required for Wasm build");
  return result;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024, ...options });
  if (result.status !== 0) fail(`${command} failed (${result.status}): ${result.stderr || result.stdout}`);
  return result.stdout.trim();
}

async function requireEmptyDirectory(path, label) {
  const info = await stat(path).catch(() => null);
  if (info) fail(`${label} must not exist: ${path}`);
  await mkdir(path, { recursive: false });
}

function emsdkEnvironment(root) {
  if (process.platform === "win32") {
    const output = run("cmd.exe", ["/d", "/s", "/c", `\"${resolve(root, "emsdk_env.bat")}\" >nul && set`]);
    return Object.fromEntries(output.split(/\r?\n/).filter((line) => line.includes("=")).map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]));
  }
  const result = spawnSync("bash", ["-c", "source \"$1/emsdk_env.sh\" >/dev/null && env -0", "bash", resolve(root)], { encoding: "buffer", maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) fail(`cannot activate Emscripten SDK: ${result.stderr.toString("utf8")}`);
  return Object.fromEntries(result.stdout.toString("utf8").split("\0").filter(Boolean).map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]));
}

async function artifact(path, output) {
  const bytes = await readFile(path);
  return { path: relative(output, path).split(sep).join("/"), bytes: bytes.byteLength, sha256: sha256(bytes) };
}

async function nativeBuildConfiguration(nativeBuild, requestedGenerator) {
  const cache = await readFile(resolve(nativeBuild, "CMakeCache.txt"), "utf8");
  const generator = cache.match(/^CMAKE_GENERATOR(?::[^=]+)?=(.+)$/m)?.[1]?.trim() ?? fail("CMake did not record a native generator");
  if (requestedGenerator && generator !== requestedGenerator) fail(`unexpected native generator: ${generator}`);
  const cmakeFiles = resolve(nativeBuild, "CMakeFiles");
  let compilerMetadata = null;
  for (const entry of (await readdir(cmakeFiles, { withFileTypes: true })).filter((item) => item.isDirectory()).sort((left, right) => left.name.localeCompare(right.name))) {
    const candidate = resolve(cmakeFiles, entry.name, "CMakeCXXCompiler.cmake");
    if ((await stat(candidate).catch(() => null))?.isFile()) { compilerMetadata = await readFile(candidate, "utf8"); break; }
  }
  if (!compilerMetadata) fail("CMake did not record native C++ compiler metadata");
  const compiler = compilerMetadata.match(/^set\(CMAKE_CXX_COMPILER "([^"]+)"\)$/m)?.[1] ?? fail("CMake did not record a native C++ compiler");
  const compilerId = compilerMetadata.match(/^set\(CMAKE_CXX_COMPILER_ID "([^"]+)"\)$/m)?.[1] ?? fail("CMake did not record a native C++ compiler ID");
  const compilerVersion = compilerMetadata.match(/^set\(CMAKE_CXX_COMPILER_VERSION "([^"]+)"\)$/m)?.[1] ?? fail("CMake did not record a native C++ compiler version");
  if (process.platform === "win32" && (compilerId !== "MSVC" || !/(^|[\\/])cl\.exe$/i.test(compiler))) fail(`Windows runtime must be built with MSVC cl.exe, received: ${compilerId} ${compiler}`);
  return { compiler: compiler.replaceAll("\\", "/"), compilerId, compilerVersion, generator };
}

async function nativeArtifactPath(nativeBuild, name) {
  for (const candidate of [resolve(nativeBuild, name), resolve(nativeBuild, "Release", name)]) {
    if ((await stat(candidate).catch(() => null))?.isFile()) return candidate;
  }
  fail(`native build did not produce ${name}`);
}

export async function buildRuntimeSdk(argumentsValue) {
  const options = parseArguments(argumentsValue);
  const { contract } = await verifySourceBuildContract();
  const archive = await readFile(resolve(options.archive));
  if (archive.byteLength !== contract.luau.archiveBytes || sha256(archive) !== contract.luau.archiveSha256) fail("Luau source archive does not match the admitted byte identity");
  const work = resolve(options.work);
  const output = resolve(options.output);
  await requireEmptyDirectory(work, "work directory");
  await requireEmptyDirectory(output, "output directory");
  run("tar", ["-xzf", resolve(options.archive), "-C", work]);
  const luauSource = resolve(work, contract.luau.extractedDirectory);
  if (!(await stat(resolve(luauSource, "CMakeLists.txt")).catch(() => null))?.isFile()) fail("admitted Luau archive layout is invalid");
  const environment = { ...process.env, SOURCE_DATE_EPOCH: String(contract.sourceDateEpoch) };
  const artifacts = {};
  const toolchains = {};

  if (options.native) {
    const nativeBuild = resolve(work, "build-native");
    const generator = options.generator ? ["-G", options.generator] : [];
    run("cmake", ["-S", runtimeSource, "-B", nativeBuild, ...generator, "-DCMAKE_BUILD_TYPE=Release", `-DLUAU_SOURCE_DIR=${luauSource}`, `-DLUASTRA_PROTOCOL_DIR=${protocolSource}`], { env: environment });
    const nativeConfiguration = await nativeBuildConfiguration(nativeBuild, options.generator);
    run("cmake", ["--build", nativeBuild, "--config", "Release", "--target", "luastra_analyze", "luastra_compile", "--parallel"], { env: environment });
    const extension = process.platform === "win32" ? ".exe" : "";
    const host = `${process.platform}-${process.arch}`;
    const hostOutput = resolve(output, host);
    await mkdir(hostOutput, { recursive: true });
    for (const [role, name] of [["analyzer", `luastra_analyze${extension}`], ["compiler", `luastra_compile${extension}`]]) {
      const source = await nativeArtifactPath(nativeBuild, name);
      const destination = resolve(hostOutput, name);
      await copyFile(source, destination);
      if (process.platform !== "win32") await chmod(destination, 0o755);
      artifacts[role] = await artifact(destination, output);
    }
    toolchains.native = run("cmake", ["--version"]).split("\n")[0];
    toolchains.nativeCompiler = nativeConfiguration.compiler;
    toolchains.nativeCompilerId = nativeConfiguration.compilerId;
    toolchains.nativeCompilerVersion = nativeConfiguration.compilerVersion;
    toolchains.nativeGenerator = nativeConfiguration.generator;
  }

  if (options.wasm) {
    const wasmBuild = resolve(work, "build-wasm");
    const emsdk = emsdkEnvironment(options.emsdk);
    const wasmEnvironment = { ...environment, ...emsdk, PATH: [emsdk.PATH, environment.PATH].filter(Boolean).join(delimiter) };
    const emccVersion = run(resolve(options.emsdk, "upstream/emscripten/emcc"), ["--version"], { env: wasmEnvironment }).split("\n")[0];
    if (!emccVersion.includes(` ${contract.emscripten.version} `) || !emccVersion.includes(`(${contract.emscripten.commit})`)) fail(`unexpected Emscripten toolchain: ${emccVersion}`);
    const emcmake = process.platform === "win32" ? resolve(options.emsdk, "upstream/emscripten/emcmake.bat") : resolve(options.emsdk, "upstream/emscripten/emcmake");
    run(emcmake, ["cmake", "-S", runtimeSource, "-B", wasmBuild, "-DCMAKE_BUILD_TYPE=Release", `-DLUAU_SOURCE_DIR=${luauSource}`, `-DLUASTRA_PROTOCOL_DIR=${protocolSource}`], { env: wasmEnvironment });
    run("cmake", ["--build", wasmBuild, "--target", "luastra_vm_wasm", "--parallel"], { env: wasmEnvironment });
    const wasmOutput = resolve(output, "wasm32-emscripten");
    await mkdir(wasmOutput, { recursive: true });
    for (const [role, name] of [["runtimeJavaScript", "luastra-vm.js"], ["runtimeWasm", "luastra-vm.wasm"]]) {
      const destination = resolve(wasmOutput, name);
      await copyFile(resolve(wasmBuild, name), destination);
      artifacts[role] = await artifact(destination, output);
    }
    toolchains.emscripten = emccVersion;
  }

  const report = {
    schemaVersion: 1,
    identity: contract.identity,
    host: { platform: process.platform, architecture: process.arch },
    source: { tag: contract.luau.tag, commit: contract.luau.commit, archiveBytes: archive.byteLength, archiveSha256: sha256(archive) },
    sourceDateEpoch: contract.sourceDateEpoch,
    toolchains,
    artifacts,
  };
  await writeFile(resolve(output, "build-report.v1.json"), json(report));
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  const report = await buildRuntimeSdk(process.argv.slice(2));
  process.stdout.write(json(report));
}
