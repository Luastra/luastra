import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

const hostRoot = resolve(import.meta.dirname, "..");
const hostVersion = JSON.parse(readFileSync(join(hostRoot, "package.json"), "utf8")).version;
const manifestPath = join(hostRoot, "src-tauri", "Cargo.toml");
const outputRoot = join(hostRoot, "compliance");
const spdxRoot = join(outputRoot, "licenses", "spdx-v3.28.0");

const metadata = JSON.parse(execFileSync("cargo", [
  "metadata",
  "--locked",
  "--format-version",
  "1",
  "--manifest-path",
  manifestPath,
], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }));

const rootId = metadata.resolve?.root;
const packages = metadata.packages
  .filter((pkg) => pkg.id !== rootId)
  .sort((left, right) => `${left.name}@${left.version}`.localeCompare(`${right.name}@${right.version}`));

const licenseNamePattern = /^(licen[cs]e|copying|notice|copyright)([._-].*)?$/i;
const expressionTokens = (expression = "") => [...new Set(
  expression
    .replace(/[()]/g, " ")
    .replaceAll("/", " OR ")
    .split(/\s+/)
    .filter((token) => token && !["AND", "OR", "WITH"].includes(token)),
)];
const normalizeText = (text) => `${text.replace(/\r\n?/g, "\n").split("\n").map((line) => line.trimEnd()).join("\n").trimEnd()}\n`;

const securityBackport = (packageRoot, pkg) => {
  try {
    const evidence = JSON.parse(readFileSync(join(packageRoot, "LUASTRA_SECURITY_BACKPORT.json"), "utf8"));
    if (evidence.schemaVersion !== 1 || evidence.package !== pkg.name || evidence.version !== pkg.version) {
      throw new Error(`invalid security-backport identity for ${pkg.name}@${pkg.version}`);
    }
    if (typeof evidence.patchedFile !== "string" || evidence.patchedFile.split("/").some((part) => !part || part === "..")) {
      throw new Error(`unsafe security-backport path for ${pkg.name}@${pkg.version}`);
    }
    const patchedBytes = readFileSync(join(packageRoot, evidence.patchedFile));
    const patchedSha256 = createHash("sha256").update(patchedBytes).digest("hex");
    if (patchedSha256 !== evidence.patchedFileSha256) {
      throw new Error(`security-backport digest mismatch for ${pkg.name}@${pkg.version}`);
    }
    return evidence;
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
};

const canonicalText = (identifier) => {
  for (const extension of ["txt", "md", "html"]) {
    try {
      return normalizeText(readFileSync(join(spdxRoot, `${identifier}.${extension}`), "utf8"));
    } catch {
      // Try the next admitted canonical-text extension.
    }
  }
  return null;
};

const packageEvidence = packages.map((pkg) => {
  const packageRoot = dirname(pkg.manifest_path);
  const candidates = readdirSync(packageRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && licenseNamePattern.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  if (pkg.license_file) {
    const declared = basename(pkg.license_file);
    if (!candidates.includes(declared)) candidates.push(declared);
  }

  const files = candidates.flatMap((name) => {
    try {
      const text = normalizeText(readFileSync(join(packageRoot, name), "utf8"));
      return [{ name, text, sha256: createHash("sha256").update(text).digest("hex") }];
    } catch {
      return [];
    }
  });
  const fallback = files.length === 0
    ? expressionTokens(pkg.license).flatMap((identifier) => {
        const text = canonicalText(identifier);
        return text ? [{ name: `SPDX-${identifier}`, text, sha256: createHash("sha256").update(text).digest("hex") }] : [];
      })
    : [];

  return {
    name: pkg.name,
    version: pkg.version,
    license: pkg.license ?? null,
    licenseFile: pkg.license_file ?? null,
    repository: pkg.repository ?? null,
    source: pkg.source ?? null,
    texts: files.length > 0 ? files : fallback,
    noticeStatus: files.length > 0 ? "CRATE_TEXT" : fallback.length > 0 ? "SPDX_FALLBACK" : "MISSING_TEXT",
    securityBackport: securityBackport(packageRoot, pkg),
  };
});

const components = packageEvidence.map((pkg) => ({
  type: "library",
  "bom-ref": `pkg:cargo/${encodeURIComponent(pkg.name)}@${pkg.version}`,
  name: pkg.name,
  version: pkg.version,
  licenses: pkg.license ? [{ expression: pkg.license }] : [],
  purl: `pkg:cargo/${encodeURIComponent(pkg.name)}@${pkg.version}`,
  externalReferences: pkg.repository ? [{ type: "vcs", url: pkg.repository }] : [],
  properties: [
    { name: "luastra:cargo-source", value: pkg.source ?? (pkg.securityBackport ? "repository-path-security-backport" : "workspace") },
    { name: "luastra:notice-status", value: pkg.noticeStatus },
    ...(pkg.securityBackport ? [
      { name: "luastra:security-advisory", value: pkg.securityBackport.advisory },
      { name: "luastra:upstream-fix", value: pkg.securityBackport.upstreamFix },
      { name: "luastra:source-archive-sha256", value: pkg.securityBackport.sourceArchiveSha256 },
      { name: "luastra:patched-file-sha256", value: pkg.securityBackport.patchedFileSha256 },
    ] : []),
  ],
}));

const notices = [
  "# Luastra Tauri third-party notices",
  "",
  "Generated from the exact locked Cargo graph. Each section retains crate-provided text or an admitted canonical SPDX fallback.",
  "",
];
for (const pkg of packageEvidence) {
  notices.push(`## ${pkg.name} ${pkg.version}`, "", `License expression: ${pkg.license ?? "UNDECLARED"}`, `Notice source: ${pkg.noticeStatus}`, "");
  if (pkg.securityBackport) {
    notices.push(
      `Security backport: ${pkg.securityBackport.advisory}`,
      `Upstream fix: ${pkg.securityBackport.upstreamFix}`,
      `Canonical source archive SHA-256: ${pkg.securityBackport.sourceArchiveSha256}`,
      `Patched file SHA-256: ${pkg.securityBackport.patchedFileSha256}`,
      "",
    );
  }
  for (const text of pkg.texts) {
    notices.push(`### ${text.name}`, "", "```text", text.text.trimEnd(), "```", "");
  }
  if (pkg.texts.length === 0) notices.push("No admitted license or notice text was found.", "");
}

const missing = packageEvidence.filter((pkg) => pkg.noticeStatus === "MISSING_TEXT");
const report = {
  schemaVersion: 1,
  evidenceClass: "LOCAL_LOCKED_CARGO_COMPLIANCE",
  packageCount: packageEvidence.length,
  crateTextCount: packageEvidence.filter((pkg) => pkg.noticeStatus === "CRATE_TEXT").length,
  spdxFallbackCount: packageEvidence.filter((pkg) => pkg.noticeStatus === "SPDX_FALLBACK").length,
  missingTextCount: missing.length,
  missingPackages: missing.map(({ name, version, license }) => ({ name, version, license })),
  securityBackportCount: packageEvidence.filter((pkg) => pkg.securityBackport).length,
  securityBackports: packageEvidence.filter((pkg) => pkg.securityBackport).map((pkg) => ({
    package: pkg.name,
    version: pkg.version,
    advisory: pkg.securityBackport.advisory,
    upstreamFix: pkg.securityBackport.upstreamFix,
    patchedFileSha256: pkg.securityBackport.patchedFileSha256,
  })),
  admissionStatus: missing.length === 0 ? "ADMITTED" : "NOT_YET_ADMITTED",
};

mkdirSync(outputRoot, { recursive: true });
writeFileSync(join(outputRoot, "cargo-sbom.cdx.json"), `${JSON.stringify({
  bomFormat: "CycloneDX",
  specVersion: "1.6",
  version: 1,
  metadata: { component: { type: "application", name: "luastra-phase5-desktop-host", version: hostVersion } },
  components,
}, null, 2)}\n`);
writeFileSync(join(outputRoot, "THIRD_PARTY_NOTICES.generated.md"), `${notices.join("\n").trimEnd()}\n`);
writeFileSync(join(outputRoot, "cargo-compliance-report.v1.json"), `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
