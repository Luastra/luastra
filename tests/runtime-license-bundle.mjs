import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const prototype = resolve(import.meta.dirname, "..");
const release = resolve(prototype, "release");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

test("runtime license bundle is exact and self-consistent", async () => {
  const manifest = JSON.parse(await readFile(resolve(release, "license-bundle.v1.json"), "utf8"));
  assert.equal(manifest.identity, "luastra-runtime-license-bundle/phase5-alpha-1");
  assert.equal(manifest.files.length, 7);
  for (const item of manifest.files) {
    const bytes = await readFile(resolve(release, item.path));
    assert.equal(bytes.byteLength, item.bytes, item.component);
    assert.equal(sha256(bytes), item.sha256, item.component);
  }
  const runtime = await readFile(resolve(prototype, "platform/artifacts/vm-wasm/luastra-vm.js"));
  assert.equal(runtime.byteLength, manifest.webRuntime.generatedJavaScriptLicenseHeader.artifactBytes);
  assert.equal(sha256(runtime), manifest.webRuntime.generatedJavaScriptLicenseHeader.artifactSha256);
  assert.match(runtime.toString("utf8", 0, 200), /SPDX-License-Identifier: MIT/);
});
