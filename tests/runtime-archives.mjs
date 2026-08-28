import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import { buildRuntimeArchives, verifyRuntimeArchiveSet } from "../platform/packaging/build-runtime-archives.mjs";

test("runtime archive set is deterministic and verifies every admitted host", async () => {
  const temporary = await mkdtemp(resolve(tmpdir(), "luastra-runtime-archives-"));
  try {
    const first = resolve(temporary, "first");
    const second = resolve(temporary, "second");
    const one = await buildRuntimeArchives({ output: first });
    const two = await buildRuntimeArchives({ output: second });
    assert.equal(one.contentSha256, two.contentSha256);
    assert.equal(one.manifestSha256, two.manifestSha256);
    assert.equal(one.checksumsSha256, two.checksumsSha256);
    assert.deepEqual(one.targets, two.targets);
    for (const record of one.targets) assert.deepEqual(await readFile(resolve(first, record.filename)), await readFile(resolve(second, record.filename)));
    assert.equal(await readFile(resolve(first, "runtime-archives.v1.json"), "utf8"), await readFile(resolve(second, "runtime-archives.v1.json"), "utf8"));
    assert.equal(await readFile(resolve(first, "SHA256SUMS"), "utf8"), await readFile(resolve(second, "SHA256SUMS"), "utf8"));
    assert.equal((await verifyRuntimeArchiveSet(first)).manifest.targets.length, 4);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("runtime archive verifier rejects changed archive bytes", async () => {
  const temporary = await mkdtemp(resolve(tmpdir(), "luastra-runtime-archives-"));
  try {
    const output = resolve(temporary, "archives");
    const built = await buildRuntimeArchives({ output });
    const archive = resolve(output, built.targets[0].filename);
    const bytes = await readFile(archive);
    bytes[Math.floor(bytes.byteLength / 2)] ^= 0xff;
    await writeFile(archive, bytes);
    await assert.rejects(() => verifyRuntimeArchiveSet(output), /runtime archive checksum mismatch/);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("runtime archive verifier rejects rewritten external checksums and extra entries", async () => {
  const temporary = await mkdtemp(resolve(tmpdir(), "luastra-runtime-archives-"));
  try {
    const checksumsOutput = resolve(temporary, "checksums");
    await buildRuntimeArchives({ output: checksumsOutput });
    await writeFile(resolve(checksumsOutput, "SHA256SUMS"), "0".repeat(64) + "  runtime-archives.v1.json\n");
    await assert.rejects(() => verifyRuntimeArchiveSet(checksumsOutput), /external checksum file mismatch/);

    const extraOutput = resolve(temporary, "extra");
    await buildRuntimeArchives({ output: extraOutput });
    await writeFile(resolve(extraOutput, "unexpected.txt"), "not admitted\n");
    await assert.rejects(() => verifyRuntimeArchiveSet(extraOutput), /unexpected entries/);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("runtime archive builder rejects existing output", async () => {
  const temporary = await mkdtemp(resolve(tmpdir(), "luastra-runtime-archives-"));
  try {
    const output = resolve(temporary, "archives");
    await buildRuntimeArchives({ output });
    await assert.rejects(() => buildRuntimeArchives({ output }), /output already exists/);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
