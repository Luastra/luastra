import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const prototype = resolve(import.meta.dirname, "..");
const host = resolve(prototype, "hosts/tauri");
const read = (path) => readFile(resolve(host, path), "utf8");

test("Tauri desktop host is exact, private and capability-minimal", async () => {
  const packageJson = JSON.parse(await read("package.json"));
  const packageLock = JSON.parse(await read("package-lock.json"));
  const cargo = await read("src-tauri/Cargo.toml");
  const cargoLock = await read("src-tauri/Cargo.lock");
  const config = JSON.parse(await read("src-tauri/tauri.conf.json"));
  const capability = JSON.parse(await read("src-tauri/capabilities/default.json"));
  assert.equal(packageJson.private, true);
  assert.equal(packageJson.devDependencies["@tauri-apps/cli"], "2.11.4");
  assert.equal(packageLock.packages["node_modules/@tauri-apps/cli"].version, "2.11.4");
  assert.match(cargo, /tauri-build = \{ version = "=2\.6\.3"/);
  assert.match(cargo, /tauri = \{ version = "=2\.11\.5"/);
  assert.match(cargoLock, /name = "tauri"\nversion = "2\.11\.5"/);
  assert.equal(config.identifier, "dev.luastra.alpha.desktop");
  assert.equal(config.bundle.active, false);
  assert.match(config.app.security.csp, /default-src 'self'/);
  assert.doesNotMatch(config.app.security.csp.replace("http://ipc.localhost", ""), /https?:/);
  assert.deepEqual(capability.permissions, ["core:default"]);
});

test("Tauri host is wired to the exact general media web artifact", async () => {
  const sync = await read("scripts/sync-web.mjs");
  assert.match(sync, /examples\/media-player\/dist\/web/);
  assert.match(sync, /fixture: "dev\.luastra\.media-player"/);
  assert.match(sync, /assetManifestSha256/);
  assert.match(sync, /indexSha256/);
  assert.match(sync, /await rm\(target, \{ recursive: true, force: true \}\)/);
});

test("Tauri locked Cargo graph has complete admitted notices and SBOM", async () => {
  const report = JSON.parse(await read("compliance/cargo-compliance-report.v1.json"));
  const sbom = JSON.parse(await read("compliance/cargo-sbom.cdx.json"));
  const notices = await read("compliance/THIRD_PARTY_NOTICES.generated.md");
  assert.equal(report.admissionStatus, "ADMITTED");
  assert.equal(report.missingTextCount, 0);
  assert.equal(report.packageCount, 428);
  assert.equal(report.crateTextCount + report.spdxFallbackCount, report.packageCount);
  assert.equal(sbom.bomFormat, "CycloneDX");
  assert.equal(sbom.specVersion, "1.6");
  assert.equal(sbom.components.length, report.packageCount);
  assert.match(notices, /# Luastra Tauri third-party notices/);
  assert.doesNotMatch(notices, /No admitted license or notice text was found/);
});
