import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

const hostRoot = resolve(import.meta.dirname, "..");
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
    { name: "luastra:cargo-source", value: pkg.source ?? "workspace" },
    { name: "luastra:notice-status", value: pkg.noticeStatus },
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
  admissionStatus: missing.length === 0 ? "ADMITTED" : "NOT_YET_ADMITTED",
};

mkdirSync(outputRoot, { recursive: true });
writeFileSync(join(outputRoot, "cargo-sbom.cdx.json"), `${JSON.stringify({
  bomFormat: "CycloneDX",
  specVersion: "1.6",
  version: 1,
  metadata: { component: { type: "application", name: "luastra-phase5-desktop-host", version: "0.1.0-alpha" } },
  components,
}, null, 2)}\n`);
writeFileSync(join(outputRoot, "THIRD_PARTY_NOTICES.generated.md"), `${notices.join("\n").trimEnd()}\n`);
writeFileSync(join(outputRoot, "cargo-compliance-report.v1.json"), `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
