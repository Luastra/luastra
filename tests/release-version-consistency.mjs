import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFile(resolve(root, path), "utf8");
const json = async (path) => JSON.parse(await read(path));

test("release-facing package, host, documentation, and artifact versions agree", async () => {
  const packageManifest = await json("package.json");
  const version = packageManifest.version;
  assert.match(version, /^[0-9]+\.[0-9]+\.[0-9]+-alpha$/u);

  for (const path of [
    "website/package.json",
    "website/package-lock.json",
    "hosts/capacitor/package.json",
    "hosts/capacitor/package-lock.json",
    "hosts/tauri/package.json",
    "hosts/tauri/package-lock.json",
  ]) {
    assert.equal((await json(path)).version, version, path);
  }

  assert.equal((await json("release/sdk-release-admission.v1.json")).version, version);
  assert.equal((await json(`release-artifacts/${version}/luastra-release.v1.json`)).version, version);
  assert.equal((await json("hosts/tauri/src-tauri/tauri.conf.json")).version, version);
  assert.match(await read("platform/product-version.mjs"), new RegExp(`productVersion = "${version.replaceAll(".", "\\.")}"`));
  assert.match(await read("hosts/tauri/src-tauri/Cargo.toml"), new RegExp(`^version = "${version.replaceAll(".", "\\.")}"$`, "mu"));
  assert.match(await read("hosts/tauri/src-tauri/Cargo.lock"), new RegExp(`name = "luastra-phase5-desktop-host"\\nversion = "${version.replaceAll(".", "\\.")}"`, "u"));
});
