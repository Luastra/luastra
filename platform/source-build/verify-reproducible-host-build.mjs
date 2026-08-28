import { readFile, writeFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";

function fail(message) { throw new Error(message); }
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
}
function json(value) { return `${JSON.stringify(stable(value), null, 2)}\n`; }
function exactKeys(value, keys) {
  return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("\n") === [...keys].sort().join("\n");
}

const targetMap = Object.freeze({
  "darwin-arm64": Object.freeze({ platform: "darwin", architecture: "arm64" }),
  "darwin-x64": Object.freeze({ platform: "darwin", architecture: "x64" }),
  "linux-x64": Object.freeze({ platform: "linux", architecture: "x64" }),
  "win32-x64": Object.freeze({ platform: "win32", architecture: "x64" }),
});

function validateReport(report, label, target) {
  if (!exactKeys(report, ["schemaVersion", "identity", "host", "source", "sourceDateEpoch", "toolchains", "artifacts"]) || report.schemaVersion !== 1) fail(`${label}: invalid report header`);
  if (report.host?.platform !== target.platform || report.host?.architecture !== target.architecture) fail(`${label}: unexpected host ${report.host?.platform}-${report.host?.architecture}`);
  for (const role of ["analyzer", "compiler"]) {
    const artifact = report.artifacts?.[role];
    if (!exactKeys(artifact, ["path", "bytes", "sha256"]) || typeof artifact.path !== "string" || isAbsolute(artifact.path) || artifact.path.includes("..") || !Number.isSafeInteger(artifact.bytes) || !/^[a-f0-9]{64}$/.test(artifact.sha256)) fail(`${label}: invalid ${role} artifact`);
  }
}

export async function verifyReproducibleHostBuild(reportAPath, reportBPath, outputPath, targetId) {
  const target = targetMap[targetId] ?? fail(`unsupported target: ${targetId}`);
  const reportA = JSON.parse(await readFile(resolve(reportAPath), "utf8"));
  const reportB = JSON.parse(await readFile(resolve(reportBPath), "utf8"));
  validateReport(reportA, "build A", target);
  validateReport(reportB, "build B", target);
  for (const field of ["identity", "sourceDateEpoch"]) if (reportA[field] !== reportB[field]) fail(`build reports disagree on ${field}`);
  if (json(reportA.source) !== json(reportB.source)) fail("build reports disagree on source identity");
  if (json(reportA.toolchains) !== json(reportB.toolchains)) fail("build reports disagree on toolchains");
  const artifacts = {};
  for (const role of ["analyzer", "compiler"]) {
    const first = reportA.artifacts[role];
    const second = reportB.artifacts[role];
    if (first.bytes !== second.bytes || first.sha256 !== second.sha256) fail(`${role} is not byte-reproducible across the two clean builds`);
    artifacts[role] = first;
  }
  const proof = {
    schemaVersion: 1,
    identity: reportA.identity,
    target: { id: targetId, ...target },
    source: reportA.source,
    sourceDateEpoch: reportA.sourceDateEpoch,
    toolchains: reportA.toolchains,
    artifacts,
    reproducibility: { cleanBuilds: 2, byteIdentical: true },
    provenance: {
      repository: process.env.GITHUB_REPOSITORY ?? null,
      commit: process.env.GITHUB_SHA ?? null,
      workflow: process.env.GITHUB_WORKFLOW ?? null,
      runId: process.env.GITHUB_RUN_ID ?? null,
      runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
      runnerImage: process.env.LUASTRA_RUNNER_IMAGE ?? null,
    },
  };
  await writeFile(resolve(outputPath), json(proof));
  return proof;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  if (process.argv.length !== 6) fail("usage: verify-reproducible-host-build.mjs <report-a> <report-b> <proof-output> <target-id>");
  const proof = await verifyReproducibleHostBuild(...process.argv.slice(2));
  process.stdout.write(json(proof));
}
