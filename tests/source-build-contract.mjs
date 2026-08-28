import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import { verifySourceBuildContract } from "../platform/source-build/verify-source-build-contract.mjs";

test("source-build contract admits exact sources, toolchains and multi-host matrix", async () => {
  const result = await verifySourceBuildContract();
  assert.equal(result.contract.identity, "luastra-runtime-source-build/phase5-alpha-8");
  assert.equal(result.contract.luau.commit, "f8ca77acdcb50241e3da21af663f8ef97b4b5ce4");
  assert.equal(result.contract.emscripten.version, "6.0.6");
  assert.equal(result.sourceFiles.length, 4);
  assert.equal(result.protocolFiles.length, 1);
  assert.equal(result.contract.protocolFiles[0].path, "protocol.hpp");
  assert.deepEqual(result.contract.targets.map((item) => item.id).sort(), ["darwin-arm64", "darwin-x64", "linux-x64", "wasm32-emscripten", "win32-x64"]);
  assert.equal(result.contract.targets.filter((item) => item.status === "LOCALLY_REPRODUCIBLE").length, 2);
  assert.deepEqual(result.contract.targets.filter((item) => item.status === "CI_REPRODUCIBLE").map((item) => item.id).sort(), ["darwin-arm64", "linux-x64", "win32-x64"]);
});

test("source-build contract rejects modified admitted source bytes", async () => {
  const result = await verifySourceBuildContract();
  const temporary = await mkdtemp(resolve(tmpdir(), "luastra-source-contract-"));
  try {
    const contract = structuredClone(result.contract);
    const source = result.sourceFiles[0];
    await cp(source, resolve(temporary, "CMakeLists.txt"));
    await writeFile(resolve(temporary, "CMakeLists.txt"), `${await readFile(source, "utf8")}\n`);
    contract.sourceFiles = [{ ...contract.sourceFiles[0], path: "CMakeLists.txt" }];
    await writeFile(resolve(temporary, "source-build-contract.v1.json"), JSON.stringify(contract));
    await assert.rejects(() => verifySourceBuildContract(resolve(temporary, "source-build-contract.v1.json")), /source file size mismatch/);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
