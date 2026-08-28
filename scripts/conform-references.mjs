import { createHash } from "node:crypto";
import { resolve } from "node:path";

import { canonicalJson } from "../assets/package-assets.mjs";
import { conformProject } from "../project/conform-project.mjs";

const prototype = resolve(import.meta.dirname, "..");
export const referenceProjects = Object.freeze([
  Object.freeze({ role: "deep-reference", path: "examples/meditation/luastra.json" }),
  Object.freeze({ role: "anti-overfitting-data", path: "examples/forms-crud/luastra.json" }),
  Object.freeze({ role: "anti-overfitting-visual", path: "examples/animated-catalogue/luastra.json" }),
  Object.freeze({ role: "capability-fixture-media", path: "examples/media-player/luastra.json" }),
]);

function sha256(value) { return createHash("sha256").update(value).digest("hex"); }

export async function conformReferenceProjects() {
  const projects = [];
  for (const reference of referenceProjects) {
    const result = await conformProject(resolve(prototype, reference.path));
    projects.push(Object.freeze({ role: reference.role, ...result }));
  }
  const requiredRoles = new Set(["deep-reference", "anti-overfitting-data", "anti-overfitting-visual"]);
  if ([...requiredRoles].some((role) => !projects.some((project) => project.role === role && project.result === "PASS"))) throw new Error("required reference role did not pass conformance");
  const capabilityProfiles = new Set(projects.map((project) => project.capabilities.join(",")));
  if (capabilityProfiles.size < 3) throw new Error("reference suite does not demonstrate three independent capability profiles");
  const stable = canonicalJson({ schemaVersion: 1, profile: "public-alpha-v1", projects });
  return Object.freeze({
    schemaVersion: 1,
    command: "conformance:references",
    profile: "public-alpha-v1",
    result: "PASS",
    projects: Object.freeze(projects),
    requiredRolesPassed: requiredRoles.size,
    independentCapabilityProfiles: capabilityProfiles.size,
    reportSha256: sha256(stable),
  });
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  conformReferenceProjects()
    .then((result) => process.stdout.write(canonicalJson(result)))
    .catch((error) => { process.stderr.write(`Luastra: ${String(error?.message ?? error)}\n`); process.exitCode = 1; });
}
