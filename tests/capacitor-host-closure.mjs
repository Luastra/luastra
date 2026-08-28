import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { createHash } from "node:crypto";

import { generateNativeSboms } from "../hosts/capacitor/compliance/generate-native-sboms.mjs";

const prototype = resolve(import.meta.dirname, "..");
const host = resolve(prototype, "hosts/capacitor");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

test("Capacitor host closure proof binds retained inputs and compliance outputs", async () => {
  const proof = JSON.parse(await readFile(resolve(host, "compliance/host-closure-proof.v1.json"), "utf8"));
  assert.equal(proof.identity, "luastra-capacitor-host-closure/phase5-alpha-3");
  assert.equal(proof.builds.iosSimulator.result, "PASS");
  assert.equal(proof.builds.androidDebug.result, "PASS");
  assert.equal(proof.builds.androidNavigationEmulator.result, "PASS");
  assert.equal(proof.builds.androidNavigationPhysical.result, "PASS");
  assert.equal(proof.builds.androidNavigationPhysical.detailToCatalogueBack, "PASS");
  assert.equal(proof.builds.androidNavigationPhysical.rootExit, "PASS");
  for (const item of [...proof.inputs, ...proof.compliance]) {
    const bytes = await readFile(resolve(host, item.path));
    assert.equal(bytes.byteLength, item.bytes, item.path);
    assert.equal(sha256(bytes), item.sha256, item.path);
  }
});

test("Phase 5 owns exact relative Capacitor host locks", async () => {
  const packageJson = JSON.parse(await readFile(resolve(host, "package.json"), "utf8"));
  const lockText = await readFile(resolve(host, "package-lock.json"), "utf8");
  const lock = JSON.parse(lockText);
  assert.equal(packageJson.dependencies["@capacitor/core"], "8.4.1");
  assert.equal(packageJson.dependencies["@capacitor/android"], "8.4.1");
  assert.equal(packageJson.dependencies["@capacitor/ios"], "8.4.1");
  assert.equal(packageJson.dependencies["@luastra/capacitor-media"], "file:../../native/capacitor-media");
  assert.equal(lock.packages["node_modules/@luastra/capacitor-media"].resolved, "../../native/capacitor-media");
  assert.equal(lockText.includes("Phase " + "4 - Architecture Hardening"), false);
  assert.equal(lockText.includes("/Users/"), false);
});

test("native host never mutates application UI unless interaction self-test is explicit", async () => {
  const main = await readFile(resolve(prototype, "platform/host/main.js"), "utf8");
  assert.match(main, /const shouldSelfTest = new URLSearchParams\(location\.search\)\.get\("luastraSelfTest"\) === "interaction";/);
  assert.doesNotMatch(main, /shouldSelfTest[^;]*\|\|[^;]*isNativePlatform/);
});

test("iOS closure pins Swift package and required Luastra host declarations", async () => {
  const resolved = JSON.parse(await readFile(resolve(host, "ios/App/App.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved"), "utf8"));
  assert.equal(resolved.pins.length, 1);
  assert.deepEqual(resolved.pins[0].state, { revision: "2231987d85b8b0b289320b1d0947b4ae8345cde4", version: "8.4.1" });
  const packageSwift = await readFile(resolve(host, "ios/App/CapApp-SPM/Package.swift"), "utf8");
  assert.match(packageSwift, /capacitor-swift-pm\.git", exact: "8\.4\.1"/);
  assert.match(packageSwift, /path: "\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/native\/capacitor-media"/);
  const plist = await readFile(resolve(host, "ios/App/App/Info.plist"), "utf8");
  assert.match(plist, /<key>UIBackgroundModes<\/key>[\s\S]*?<string>audio<\/string>/);
  assert.match(plist, /<key>CFBundleURLSchemes<\/key>[\s\S]*?<string>luastra<\/string>/);
});

test("iOS host masks Capacitor prompt-before-first-paint with an accessible native startup boundary", async () => {
  const appDelegate = await readFile(resolve(host, "ios/App/App/AppDelegate.swift"), "utf8");
  const storyboard = await readFile(resolve(host, "ios/App/App/Base.lproj/Main.storyboard"), "utf8");
  const main = await readFile(resolve(prototype, "platform/host/main.js"), "utf8");
  assert.match(storyboard, /customClass="LuastraBridgeViewController"/);
  assert.match(appDelegate, /class LuastraBridgeViewController: CAPBridgeViewController/);
  assert.match(appDelegate, /override func capacitorDidLoad\(\)/);
  assert.match(appDelegate, /installStartupOverlay\(\)[\s\S]*?beginReadinessChecks\(\)/);
  assert.match(appDelegate, /globalThis\.__luastraPreview\?\.result \?\? 'STARTING'/);
  assert.match(appDelegate, /startupOverlay\.accessibilityViewIsModal = true/);
  assert.match(appDelegate, /webView\?\.accessibilityElementsHidden = true/);
  assert.match(appDelegate, /if UIAccessibility\.isReduceMotionEnabled/);
  assert.match(appDelegate, /globalThis\.__luastraHostDidBecomeVisible\?\.\(\)/);
  assert.match(appDelegate, /UIAccessibility\.post\(notification: \.screenChanged/);
  assert.match(main, /getPlatform\?\.\(\) === "ios"/);
  assert.match(main, /deferMotion: deferInitialMotion/);
  assert.match(main, /activateDeferredMotion\(\)/);
});

test("Android closure admits the same Luastra deep-link scheme", async () => {
  const manifest = await readFile(resolve(host, "android/app/src/main/AndroidManifest.xml"), "utf8");
  const strings = await readFile(resolve(host, "android/app/src/main/res/values/strings.xml"), "utf8");
  assert.match(manifest, /<action android:name="android\.intent\.action\.VIEW"\s*\/>[\s\S]*?<category android:name="android\.intent\.category\.BROWSABLE"\s*\/>[\s\S]*?<data android:scheme="@string\/custom_url_scheme"\s*\/>/);
  assert.match(strings, /<string name="custom_url_scheme">luastra<\/string>/);
});

test("Android Media3 runtime closure resolves every exact Maven module license", async () => {
  const inventory = JSON.parse(await readFile(resolve(host, "compliance/android/gradle-runtime.v1.json"), "utf8"));
  const licenses = JSON.parse(await readFile(resolve(host, "compliance/android/maven-license-evidence.v1.json"), "utf8"));
  assert.equal(inventory.modules.length, 64);
  assert.equal(licenses.summary.total, 64);
  assert.equal(licenses.summary.resolvedFromPom, 64);
  assert.equal(licenses.modules.every((item) => item.licenseDeclared === "Apache-2.0"), true);
  const media3 = inventory.modules.filter((item) => item.group === "androidx.media3");
  assert.deepEqual(media3.map((item) => item.name).sort(), ["media3-common", "media3-container", "media3-database", "media3-datasource", "media3-decoder", "media3-exoplayer", "media3-extractor", "media3-session"]);
  assert.equal(media3.every((item) => item.version === "1.10.1" && item.artifacts.length === 1), true);
});

test("native host notice catalog binds every exact runtime surface", async () => {
  const notices = JSON.parse(await readFile(resolve(host, "compliance/notices/native-runtime-notices.v1.json"), "utf8"));
  const inventory = JSON.parse(await readFile(resolve(host, "compliance/android/gradle-runtime.v1.json"), "utf8"));
  const expectedArtifacts = inventory.modules.flatMap((item) => item.artifacts).length;
  assert.equal(notices.summary.androidModules, 64);
  assert.equal(notices.summary.androidArtifacts, expectedArtifacts);
  assert.equal(notices.summary.npmPackages, 6);
  assert.equal(notices.summary.swiftPackages, 1);
  assert.equal(notices.documents.length, notices.summary.uniqueNoticeDocuments);
  assert.equal(notices.documents.every((item) => item.sha256.length === 64 && item.text.length > 0), true);
  const exactArtifacts = notices.androidModules.flatMap((item) => item.artifacts);
  assert.equal(exactArtifacts.length, expectedArtifacts);
  assert.equal(exactArtifacts.every((item) => item.sha256.length === 64), true);
});

test("native SPDX documents are deterministic and exact-host bound", async () => {
  const generated = await generateNativeSboms();
  assert.equal(generated.ios, await readFile(resolve(host, "compliance/sbom/capacitor-ios-runtime.spdx.json"), "utf8"));
  assert.equal(generated.android, await readFile(resolve(host, "compliance/sbom/capacitor-android-runtime.spdx.json"), "utf8"));
  assert.equal(generated.counts.androidMaven, 64);
  const ios = JSON.parse(generated.ios);
  const android = JSON.parse(generated.android);
  assert.equal(ios.packages.some((item) => item.name === "@luastra/capacitor-media" && item.licenseDeclared === "Apache-2.0"), true);
  assert.equal(android.packages.some((item) => item.name === "@luastra/capacitor-media" && item.licenseDeclared === "Apache-2.0"), true);
  assert.equal(ios.packages.some((item) => item.name === "capacitor-swift-pm" && item.versionInfo.startsWith("8.4.1+")), true);
  assert.equal(android.packages.some((item) => item.name === "androidx.media3:media3-session" && item.versionInfo === "1.10.1"), true);
  assert.equal(android.packages.filter((item) => item.name.startsWith("androidx.media3:")).every((item) => item.licenseDeclared === "Apache-2.0"), true);
});
