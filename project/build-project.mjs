import { createHash } from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildBundle } from "../platform/packaging/build-bundle.mjs";
import { packageWeb } from "../platform/packaging/package-web.mjs";
import { resolveRuntime } from "../platform/resolve-runtime.mjs";
import { canonicalJson, fileLedger, packageProjectAssets, projectContentDigest } from "../assets/package-assets.mjs";
import { verifyGeneratedClient } from "../backend/generate-client.mjs";
import { resolveSourceSdk } from "../sdk/resolve-source-sdk.mjs";
import { prepareGeneratedOutput } from "./generated-output.mjs";
import { loadProject } from "./load-project.mjs";

function fail(message) { throw new Error(message); }
const prototype = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase5Host = resolve(prototype, "host");
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }

function selectModules(project, sourceSdk, roots) {
  const selected = new Map();
  const visit = (id, path = []) => {
    if (selected.has(id)) return;
    const module = project.modules.get(id) ?? sourceSdk.modules.get(id);
    if (!module) fail(`module dependency is not declared by the project or SDK: ${[...path, id].join(" -> ")}`);
    selected.set(id, module);
    for (const dependency of module.dependencies) visit(dependency, [...path, id]);
  };
  for (const root of roots) visit(root);
  const state = new Map();
  const order = [];
  const orderVisit = (id, path) => {
    if (state.get(id) === "done") return;
    if (state.get(id) === "visiting") fail(`module cycle: ${[...path, id].join(" -> ")}`);
    const module = selected.get(id);
    if (!module) fail(`module dependency is missing: ${id}`);
    state.set(id, "visiting");
    for (const dependency of [...module.dependencies].sort()) {
      if (!selected.has(dependency)) visit(dependency, [...path, id]);
      orderVisit(dependency, [...path, id]);
    }
    state.set(id, "done");
    order.push(id);
  };
  for (const id of [...selected.keys()].sort()) orderVisit(id, []);
  return { selected, order };
}

async function stage(project, sourceSdk, { entry, roots }) {
  const temporary = await mkdtemp(resolve(tmpdir(), "luastra-project-v2-"));
  const { selected, order } = selectModules(project, sourceSdk, roots);
  const modules = [];
  for (const id of order) {
    const module = selected.get(id);
    const source = `sources/${id}.luau`;
    const destination = resolve(temporary, source);
    await mkdir(resolve(destination, ".."), { recursive: true });
    await copyFile(module.sourcePath, destination);
    modules.push({ id, source, dependencies: [...module.dependencies].sort() });
  }
  const manifest = {
    schemaVersion: 1,
    project: { id: project.id, entry },
    compatibility: sourceSdk.compatibility,
    capabilities: [...project.capabilities].sort(),
    modules,
  };
  const manifestPath = resolve(temporary, "luastra.json");
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return { temporary, manifestPath, modules };
}

export async function buildProject({ manifestPath, outputDirectory, target = "bundle", entry = null, roots = null }) {
  if (!new Set(["bundle", "web"]).has(target)) fail(`unsupported build target: ${target}`);
  const [project, sourceSdk, binarySdk] = await Promise.all([
    loadProject(manifestPath),
    resolveSourceSdk(),
    resolveRuntime(),
  ]);
  if (project.sdkContract !== 1) fail(`unsupported project SDK contract: ${project.sdkContract}`);
  const generatedBackend = project.backend ? await verifyGeneratedClient(project.backend.declaration, project.backend.generatedClientPath) : null;
  const selectedEntry = entry ?? project.entry;
  if (!project.modules.has(selectedEntry)) fail(`build entry is not a project module: ${selectedEntry}`);
  const selectedRoots = roots ?? [selectedEntry];
  if (!Array.isArray(selectedRoots) || selectedRoots.length === 0 || selectedRoots.some((id) => !project.modules.has(id))) fail("build roots must be declared project modules");
  const staged = await stage(project, sourceSdk, { entry: selectedEntry, roots: selectedRoots });
  try {
    const output = target === "bundle" ? await prepareGeneratedOutput(outputDirectory, "bundle") : outputDirectory;
    const base = target === "web"
      ? await packageWeb({ manifestPath: staged.manifestPath, outputDirectory: output })
      : await buildBundle({
        manifestPath: staged.manifestPath,
        outputDirectory: output,
        analyzerPath: binarySdk.artifacts.analyzer,
        compilerPath: binarySdk.artifacts.compiler,
      });
    const bundleContentSha256 = base.contentSha256;
    if (target === "web") {
      const hostHtml = (await readFile(resolve(phase5Host, "index.html"), "utf8"))
        .replace("<title>Luastra Preview</title>", "<title>Luastra Application</title>")
        .replace(`      <header class="luastra-host-brand" aria-label="Luastra development host">
        <img src="./brand/luastra-mark.svg" alt="" />
        <span>Luastra</span>
        <span id="status" role="status" aria-live="polite">Starting…</span>
      </header>
`, `      <span id="status" role="status" aria-live="polite" hidden></span>
`);
      await writeFile(resolve(output, "index.html"), hostHtml);
      await copyFile(resolve(phase5Host, "phase5-ui.css"), resolve(output, "platform/phase5-ui.css"));
    }
    const packagedAssets = await packageProjectAssets(project, output);
    const projectContentSha256 = projectContentDigest(project, bundleContentSha256, packagedAssets.entries);
    let result = { ...base, bundleContentSha256, projectContentSha256, projectAssets: packagedAssets.entries.length, projectAssetLedgerSha256: packagedAssets.ledgerSha256 };
    if (target === "web") {
      const assets = await fileLedger(output);
      const webLedger = {
        schemaVersion: 2,
        profile: "luastra-phase5-web",
        project: project.id,
        sourceSdkIdentity: sourceSdk.identity,
        binarySdkIdentity: binarySdk.identity,
        bundleContentSha256,
        projectContentSha256,
        assets,
      };
      const ledgerText = canonicalJson(webLedger);
      await writeFile(resolve(output, "asset-manifest.json"), ledgerText);
      result = { ...result, assets: assets.length, assetManifestSha256: sha256(ledgerText) };
    }
    return Object.freeze({
      target,
      project: project.id,
      modules: staged.modules.length,
      sourceSdkIdentity: sourceSdk.identity,
      binarySdkIdentity: binarySdk.identity,
      binarySdkOrigin: binarySdk.origin,
      ...(generatedBackend ? { backendContractSha256: project.backend.declaration.sha256, generatedBackendClientSha256: generatedBackend.sha256 } : {}),
      ...result,
    });
  } finally {
    await rm(staged.temporary, { recursive: true, force: true });
  }
}
