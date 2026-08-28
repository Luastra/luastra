import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import { verifyReproducibleHostBuild } from "../platform/source-build/verify-reproducible-host-build.mjs";

function report(hash = "a".repeat(64)) {
  return {
    schemaVersion: 1,
    identity: "luastra-runtime-source-build/phase5-alpha-2",
    host: { platform: "linux", architecture: "x64" },
    source: { tag: "0.731", commit: "f".repeat(40), archiveBytes: 1, archiveSha256: "c".repeat(64) },
    sourceDateEpoch: 1784926285,
    toolchains: { native: "cmake version 4.1.0" },
    artifacts: {
      analyzer: { path: "linux-x64/luastra_analyze", bytes: 10, sha256: hash },
      compiler: { path: "linux-x64/luastra_compile", bytes: 20, sha256: "b".repeat(64) },
    },
  };
}

test("multi-host proof accepts two byte-identical clean native builds", async () => {
  const temporary = await mkdtemp(resolve(tmpdir(), "luastra-host-proof-"));
  try {
    const first = resolve(temporary, "a.json");
    const second = resolve(temporary, "b.json");
    const proofPath = resolve(temporary, "proof.json");
    await writeFile(first, JSON.stringify(report()));
    await writeFile(second, JSON.stringify(report()));
    const proof = await verifyReproducibleHostBuild(first, second, proofPath, "linux-x64");
    assert.equal(proof.reproducibility.byteIdentical, true);
    assert.equal(proof.target.id, "linux-x64");
    assert.deepEqual(JSON.parse(await readFile(proofPath, "utf8")), proof);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("multi-host proof rejects a changed artifact hash", async () => {
  const temporary = await mkdtemp(resolve(tmpdir(), "luastra-host-proof-"));
  try {
    const first = resolve(temporary, "a.json");
    const second = resolve(temporary, "b.json");
    await writeFile(first, JSON.stringify(report()));
    await writeFile(second, JSON.stringify(report("d".repeat(64))));
    await assert.rejects(() => verifyReproducibleHostBuild(first, second, resolve(temporary, "proof.json"), "linux-x64"), /not byte-reproducible/);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
