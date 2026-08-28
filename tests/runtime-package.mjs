import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import { buildRuntimePackage, verifyRuntimePackage } from "../platform/packaging/package-runtime-sdk.mjs";

const targets = ["darwin-x64", "darwin-arm64", "linux-x64", "win32-x64"];

test("runtime packager materializes every admitted host with the shared portable runtime", async () => {
  const temporary = await mkdtemp(resolve(tmpdir(), "luastra-runtime-package-"));
  try {
    const wasmHashes = new Set();
    for (const targetId of targets) {
      const output = resolve(temporary, targetId);
      const built = await buildRuntimePackage({ targetId, output });
      const verified = await verifyRuntimePackage(output);
      assert.equal(built.contentSha256, verified.manifest.contentSha256);
      assert.equal(verified.manifest.target.id, targetId);
      assert.equal(verified.manifest.sdkIdentity, "luastra-runtime-sdk/phase5-alpha-8");
      wasmHashes.add(verified.manifest.artifacts.runtimeWasm.sha256);
      if (process.platform !== "win32" && targetId !== "win32-x64") assert.notEqual((await stat(verified.artifacts.analyzer)).mode & 0o111, 0);
    }
    assert.equal(wasmHashes.size, 1);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("runtime package manifest is deterministic and tampered artifact bytes fail verification", async () => {
  const temporary = await mkdtemp(resolve(tmpdir(), "luastra-runtime-package-"));
  try {
    const first = resolve(temporary, "first");
    const second = resolve(temporary, "second");
    const one = await buildRuntimePackage({ targetId: "linux-x64", output: first });
    const two = await buildRuntimePackage({ targetId: "linux-x64", output: second });
    assert.equal(one.contentSha256, two.contentSha256);
    assert.equal(await readFile(resolve(first, "runtime-package.v1.json"), "utf8"), await readFile(resolve(second, "runtime-package.v1.json"), "utf8"));
    await writeFile(resolve(second, "bin/luastra_analyze"), "tampered\n");
    await assert.rejects(() => verifyRuntimePackage(second), /artifact size mismatch/);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("runtime packager rejects unsupported targets and existing output", async () => {
  const temporary = await mkdtemp(resolve(tmpdir(), "luastra-runtime-package-"));
  try {
    await assert.rejects(() => buildRuntimePackage({ targetId: "linux-arm64", output: resolve(temporary, "unsupported") }), /unsupported runtime package target/);
    const output = resolve(temporary, "linux");
    await buildRuntimePackage({ targetId: "linux-x64", output });
    await assert.rejects(() => buildRuntimePackage({ targetId: "linux-x64", output }), /output already exists/);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
