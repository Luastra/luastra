import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { canonicalJson } from "../../../assets/package-assets.mjs";

const hostRoot = resolve(import.meta.dirname, "..");
const outputRoot = resolve(import.meta.dirname, "sbom");

function fail(message) { throw new Error(message); }
function spdxId(prefix, name, version, index) { return `SPDXRef-${prefix}-${name}-${version}-${index}`.replace(/[^A-Za-z0-9.-]/g, "-"); }
function packageName(path) { const value = path.slice("node_modules/".length); const parts = value.split("/"); return value.startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0]; }
function checksum(entry) {
  return entry.integrity?.startsWith("sha512-") ? [{ algorithm: "SHA512", checksumValue: Buffer.from(entry.integrity.slice(7), "base64").toString("hex") }] : [];
}
function npmClosure(lock, roots) {
  const admitted = new Set();
  const visit = (name) => {
    const key = `node_modules/${name}`;
    if (admitted.has(key)) return;
    const entry = lock.packages[key];
    if (!entry) fail(`npm runtime dependency is absent from lock: ${name}`);
    admitted.add(key);
    for (const dependency of Object.keys(entry.dependencies ?? {}).sort()) visit(dependency);
  };
  for (const root of [...roots].sort()) visit(root);
  return [...admitted].sort().map((path) => [path, lock.packages[path]]);
}
function npmPackages(lock, roots, prefix) {
  return npmClosure(lock, roots).map(([path, entry], index) => ({
    SPDXID: spdxId(prefix, packageName(path), entry.version, index),
    name: packageName(path),
    versionInfo: entry.version,
    downloadLocation: entry.resolved ?? "NOASSERTION",
    filesAnalyzed: false,
    licenseConcluded: entry.license ?? "NOASSERTION",
    licenseDeclared: entry.license ?? "NOASSERTION",
    checksums: checksum(entry),
    primaryPackagePurpose: "LIBRARY",
    copyrightText: "NOASSERTION",
  }));
}
function document(name, namespace, packages) {
  return canonicalJson({
    spdxVersion: "SPDX-2.3",
    dataLicense: "CC0-1.0",
    SPDXID: "SPDXRef-DOCUMENT",
    name,
    documentNamespace: `https://luastra.dev/spdx/phase5/${namespace}/2026-08-16`,
    creationInfo: { created: "2026-08-16T00:00:00Z", creators: ["Tool: Luastra Phase 5 native SBOM generator v1"] },
    documentDescribes: packages.map((item) => item.SPDXID),
    packages,
  });
}

export async function generateNativeSboms() {
  const lock = JSON.parse(await readFile(resolve(hostRoot, "package-lock.json"), "utf8"));
  if (lock.lockfileVersion !== 3 || lock.packages?.[""]?.name !== "luastra-phase5-capacitor-host") fail("unexpected Capacitor host lock");
  const localMedia = {
    SPDXID: "SPDXRef-Luastra-Capacitor-Media",
    name: "@luastra/capacitor-media",
    versionInfo: "0.1.0",
    downloadLocation: "NOASSERTION",
    filesAnalyzed: false,
    licenseConcluded: "Apache-2.0",
    licenseDeclared: "Apache-2.0",
    primaryPackagePurpose: "LIBRARY",
    copyrightText: "Copyright 2026 Viacheslav Beliaev",
    comment: "Owner-approved under Apache-2.0 on 2026-08-16; publication remains separately unauthorized.",
  };
  const sharedRoots = ["@capacitor/core", "@capacitor/app", "@capacitor/preferences"];
  const swift = JSON.parse(await readFile(resolve(hostRoot, "ios/App/App.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved"), "utf8"));
  if (swift.version !== 3 || swift.pins.length !== 1 || swift.pins[0].identity !== "capacitor-swift-pm" || swift.pins[0].state.version !== "8.4.1" || swift.pins[0].state.revision !== "2231987d85b8b0b289320b1d0947b4ae8345cde4") fail("unexpected iOS Swift closure");
  const iosPackages = [
    ...npmPackages(lock, [...sharedRoots, "@capacitor/ios"], "NPM-IOS"),
    {
      SPDXID: "SPDXRef-Swift-capacitor-swift-pm-8.4.1",
      name: "capacitor-swift-pm",
      versionInfo: "8.4.1+2231987d85b8b0b289320b1d0947b4ae8345cde4",
      downloadLocation: swift.pins[0].location,
      filesAnalyzed: false,
      licenseConcluded: "MIT",
      licenseDeclared: "MIT",
      primaryPackagePurpose: "LIBRARY",
      copyrightText: "NOASSERTION",
    },
    localMedia,
  ];

  const inventory = JSON.parse(await readFile(resolve(hostRoot, "compliance/android/gradle-runtime.v1.json"), "utf8"));
  const licenses = JSON.parse(await readFile(resolve(hostRoot, "compliance/android/maven-license-evidence.v1.json"), "utf8"));
  if (inventory.schemaVersion !== 1 || inventory.configuration !== "debugRuntimeClasspath" || inventory.modules.length === 0) fail("unexpected Android runtime inventory");
  if (licenses.summary.total !== inventory.modules.length || licenses.summary.resolvedFromPom !== inventory.modules.length) fail("Android Maven license closure is incomplete");
  const licenseByCoordinate = new Map(licenses.modules.map((item) => [item.coordinate, item.licenseDeclared]));
  const mavenPackages = inventory.modules.map((item, index) => ({
    SPDXID: spdxId("Maven-Android", `${item.group}-${item.name}`, item.version, index),
    name: `${item.group}:${item.name}`,
    versionInfo: item.version,
    downloadLocation: "NOASSERTION",
    filesAnalyzed: false,
    licenseConcluded: licenseByCoordinate.get(item.coordinate) ?? "NOASSERTION",
    licenseDeclared: licenseByCoordinate.get(item.coordinate) ?? "NOASSERTION",
    checksums: item.artifacts.map((artifact) => ({ algorithm: "SHA256", checksumValue: artifact.sha256 })),
    primaryPackagePurpose: "LIBRARY",
    copyrightText: "NOASSERTION",
    externalRefs: [{ referenceCategory: "PACKAGE-MANAGER", referenceType: "purl", referenceLocator: `pkg:maven/${encodeURIComponent(item.group)}/${encodeURIComponent(item.name)}@${encodeURIComponent(item.version)}` }],
  }));
  if (mavenPackages.some((item) => item.licenseDeclared === "NOASSERTION")) fail("Android Maven package license is unresolved");
  const androidPackages = [...npmPackages(lock, [...sharedRoots, "@capacitor/android"], "NPM-ANDROID"), ...mavenPackages, localMedia];
  return Object.freeze({
    ios: document("Luastra Phase 5 Capacitor iOS runtime closure", "capacitor-ios-runtime", iosPackages),
    android: document("Luastra Phase 5 Capacitor Android runtime closure", "capacitor-android-runtime", androidPackages),
    counts: Object.freeze({ ios: iosPackages.length, android: androidPackages.length, androidMaven: mavenPackages.length }),
  });
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  if (process.argv.length !== 2 && !(process.argv.length === 3 && process.argv[2] === "--write")) throw new Error("usage: generate-native-sboms.mjs [--write]");
  const result = await generateNativeSboms();
  if (process.argv[2] === "--write") {
    await mkdir(outputRoot, { recursive: true });
    await writeFile(resolve(outputRoot, "capacitor-ios-runtime.spdx.json"), result.ios);
    await writeFile(resolve(outputRoot, "capacitor-android-runtime.spdx.json"), result.android);
    process.stdout.write(canonicalJson({ result: "PASS", ...result.counts }));
  } else process.stdout.write(canonicalJson({ counts: result.counts, ios: JSON.parse(result.ios), android: JSON.parse(result.android) }));
}
