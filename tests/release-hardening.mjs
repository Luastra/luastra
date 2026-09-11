import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFile(resolve(root, path), "utf8");
const json = async (path) => JSON.parse(await read(path));

test("release candidate documentation is version-bound and preserves prior admissions", async () => {
  const version = (await json("package.json")).version;
  const published = await json("release/published-release.v1.json");
  assert.equal(version, "0.5.0-alpha");
  assert.deepEqual(published, { schemaVersion: 1, version, tag: `v${version}` });

  for (const path of ["README.md", "COMPATIBILITY.md", "SECURITY.md", "SUPPORT.md", "docs/installation.md", "docs/development.md"]) {
    assert.match(await read(path), new RegExp(version.replaceAll(".", "\\.")), path);
  }

  for (const path of ["docs/diagnostics.md", "docs/migration-0.5.0-alpha.md", "docs/release-verification.md", "release/notes/0.5.0-alpha.md"]) {
    assert.ok((await read(path)).length > 500, `${path} is incomplete`);
  }

  const previous = await json("release/admissions/0.4.0-alpha.v1.json");
  assert.equal(previous.version, "0.4.0-alpha");
  assert.equal(previous.manifestSha256, "85f18805fcb94ff8a6ba4036487ce913ea7ae0c80d303d0822e5d888fc419e6f");
  assert.equal(previous.checksumsSha256, "cad7e5376634ff6a5376c75a24feab6b9ff78990b230c0c2d903d86be31f1e47");
});

test("0.5.0-alpha defers inline video and states evidence boundaries", async () => {
  const compatibility = await read("COMPATIBILITY.md");
  const verification = await read("docs/release-verification.md");
  const notes = await read("release/notes/0.5.0-alpha.md");
  for (const value of [compatibility, verification, notes]) assert.match(value, /inline video/iu);
  assert.match(verification, /Manual VoiceOver and NVDA certification is deferred/u);
  assert.match(verification, /Web evidence does not admit Capacitor or Tauri behavior/u);
  assert.match(verification, /full Daybreak repository scan bound to the exact frozen/u);
  assert.match(verification, /explicit authorization before creating the public candidate branch/u);
});

test("diagnostic documentation keeps structured codes separate from sensitive values", async () => {
  const diagnostics = await read("docs/diagnostics.md");
  for (const code of ["STALE_RESULT", "CURSOR_CYCLE", "DUPLICATE_ITEM_KEY", "UNAUTHORIZED", "QUALITY_BUDGET_EXCEEDED"]) {
    assert.match(diagnostics, new RegExp(`\\b${code}\\b`, "u"), code);
  }
  for (const boundary of ["access or refresh tokens", "signed URLs", "idempotency keys", "filesystem paths"]) {
    assert.ok(diagnostics.includes(boundary), boundary);
  }
});
