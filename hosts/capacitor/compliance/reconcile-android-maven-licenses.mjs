#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const prototype = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const compliance = resolve(prototype, "compliance");
const inventory = JSON.parse(await readFile(resolve(compliance, "android/gradle-runtime.v1.json"), "utf8"));
const cache = resolve(prototype, "android/.gradle-user-home/caches/modules-2/files-2.1");
const output = resolve(compliance, "android/maven-license-evidence.v1.json");

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
}
function json(value) { return `${JSON.stringify(stable(value), null, 2)}\n`; }
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function decodeXml(value) {
  return value.replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"').trim();
}
function tag(xml, name) {
  const match = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return match ? decodeXml(match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")) : null;
}
function spdx(name, url) {
  const value = `${name ?? ""} ${url ?? ""}`.toLowerCase();
  if (value.includes("apache") && (value.includes("2.0") || value.includes("license-2.0"))) return "Apache-2.0";
  if (value.includes("eclipse public license") && value.includes("2.0")) return "EPL-2.0";
  if (value.includes("mit license") || value.includes("opensource.org/license/mit")) return "MIT";
  if (value.includes("bsd") && value.includes("3")) return "BSD-3-Clause";
  return null;
}
function licenseMetadata(xml) {
  const licensesBlock = xml.match(/<licenses(?:\s[^>]*)?>([\s\S]*?)<\/licenses>/i)?.[1] ?? "";
  return [...licensesBlock.matchAll(/<license(?:\s[^>]*)?>([\s\S]*?)<\/license>/gi)].map((match) => {
    const name = tag(match[1], "name");
    const url = tag(match[1], "url");
    return { name, url, spdx: spdx(name, url) };
  });
}
function parentCoordinate(xml) {
  const parent = xml.match(/<parent(?:\s[^>]*)?>([\s\S]*?)<\/parent>/i)?.[1];
  if (!parent) return null;
  const group = tag(parent, "groupId");
  const name = tag(parent, "artifactId");
  const version = tag(parent, "version");
  return group && name && version ? { group, name, version } : null;
}
async function findPom(directory, expectedName) {
  const directoryInfo = await stat(directory).catch(() => null);
  if (!directoryInfo?.isDirectory()) return null;
  for (const hashDirectory of (await readdir(directory)).sort()) {
    const candidate = resolve(directory, hashDirectory, expectedName);
    if ((await stat(candidate).catch(() => null))?.isFile()) return candidate;
  }
  return null;
}

const modules = [];
for (const module of inventory.modules) {
  const coordinateRoot = resolve(cache, module.group, module.name, module.version);
  const pom = await findPom(coordinateRoot, `${module.name}-${module.version}.pom`);
  if (!pom) {
    modules.push({ coordinate: `${module.group}:${module.name}:${module.version}`, status: "NO_POM", licenseDeclared: "NOASSERTION", pom: null, licenses: [] });
    continue;
  }
  const bytes = await readFile(pom);
  const xml = bytes.toString("utf8");
  let licenses = licenseMetadata(xml);
  let inheritedFrom = null;
  if (licenses.length === 0) {
    const parent = parentCoordinate(xml);
    if (parent) {
      const parentPom = await findPom(resolve(cache, parent.group, parent.name, parent.version), `${parent.name}-${parent.version}.pom`);
      if (parentPom) {
        const parentBytes = await readFile(parentPom);
        licenses = licenseMetadata(parentBytes.toString("utf8"));
        if (licenses.length > 0) {
          inheritedFrom = {
            coordinate: `${parent.group}:${parent.name}:${parent.version}`,
            pom: { bytes: parentBytes.byteLength, sha256: sha256(parentBytes) },
          };
        }
      }
    }
  }
  const expressions = [...new Set(licenses.map((item) => item.spdx).filter(Boolean))].sort();
  const fullyMapped = licenses.length > 0 && licenses.every((item) => item.spdx);
  modules.push({
    coordinate: `${module.group}:${module.name}:${module.version}`,
    status: fullyMapped ? "RESOLVED_FROM_POM" : licenses.length ? "UNMAPPED_LICENSE" : "NO_LICENSE_IN_POM",
    licenseDeclared: fullyMapped ? expressions.join(" AND ") : "NOASSERTION",
    pom: { bytes: bytes.byteLength, sha256: sha256(bytes) },
    inheritedFrom,
    licenses,
  });
}

const result = {
  schemaVersion: 1,
  generatedBy: "Luastra Phase 5 final Capacitor host Maven POM reconciler v1",
  evidenceBoundary: "Exact locally cached POM metadata only; not a legal conclusion and not proof that NOTICE/source obligations are complete.",
  modules,
  summary: {
    total: modules.length,
    resolvedFromPom: modules.filter((item) => item.status === "RESOLVED_FROM_POM").length,
    noPom: modules.filter((item) => item.status === "NO_POM").length,
    noLicenseInPom: modules.filter((item) => item.status === "NO_LICENSE_IN_POM").length,
    unmappedLicense: modules.filter((item) => item.status === "UNMAPPED_LICENSE").length,
  },
};

await mkdir(dirname(output), { recursive: true });
await writeFile(output, json(result));
console.log(json({ result: result.summary.total === result.summary.resolvedFromPom ? "PASS" : "PARTIAL", ...result.summary }));
