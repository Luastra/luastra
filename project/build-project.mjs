import { projectTypographyCss } from "../assets/typography.mjs";
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
import { withGeneratedOutput } from "./output-transaction.mjs";
import { loadProject } from "./load-project.mjs";
import { runStartupBundle } from "../platform/packaging/run-startup-bundle.mjs";
import { buildStartupFailure } from "../platform/packaging/build-startup-failure.mjs";
import { renderStartupHtml } from "../platform/packaging/startup-html.mjs";
import { packageLibraryCompliance } from "./library-packages.mjs";

function fail(message) { throw new Error(message); }
const prototype = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase5Host = resolve(prototype, "host");
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function webMetadata(value) {
  if (!value) return { head: "", fallback: "" };
  const title = escapeHtml(value.title);
  const description = escapeHtml(value.description);
  const canonicalUrl = escapeHtml(value.canonicalUrl);
  const robots = value.index ? "index,follow" : "noindex,nofollow";
  return {
    head: `    <meta name="description" content="${description}" />
    <meta name="robots" content="${robots}" />
    <link rel="canonical" href="${canonicalUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
`,
    fallback: `    <noscript>
      <main>
        <h1>${title}</h1>
        <p>${description}</p>
        <p><a href="${canonicalUrl}">Open ${title}</a></p>
      </main>
    </noscript>
`,
  };
}

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

async function stage(project, sourceSdk, { entry, roots, capabilities = project.capabilities }) {
  const { selected, order } = selectModules(project, sourceSdk, roots);
  const temporary = await mkdtemp(resolve(tmpdir(), "luastra-project-v2-"));
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
    capabilities: [...capabilities].sort(),
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
  let startupStage = null;
  try {
    if (target === "web" && project.startup) {
      if (staged.modules.some(module => module.id === project.startup.entry)) fail("application dependencies must not include the startup entry");
      startupStage = await stage(project, sourceSdk, { entry: project.startup.entry, roots: [project.startup.entry, "luastra/ui"], capabilities: ["ui.render"] });
    }
    return await withGeneratedOutput(outputDirectory, target, async (candidate) => {
      const output = target === "bundle" ? await prepareGeneratedOutput(candidate, "bundle") : candidate;
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
        const metadata = webMetadata(project.web);
        const title = escapeHtml(project.web?.title ?? "Luastra Application");
        const hostHtml = (await readFile(resolve(phase5Host, "index.html"), "utf8"))
          .replace("    <title>Luastra Preview</title>", `${metadata.head}    <title>${title}</title>`)
          .replace("  <body>\n", `  <body>\n${metadata.fallback}`)
          .replace(`      <header class="luastra-host-brand" aria-label="Luastra development host">
        <span class="luastra-host-lockup">
          <img src="./brand/luastra-lockup.svg" alt="Luastra" />
        </span>
        <span id="status" role="status" aria-live="polite">Starting…</span>
      </header>
`, `      <span id="status" role="status" aria-live="polite" hidden></span>
`);
        await writeFile(resolve(output, "index.html"), hostHtml.replace("  </head>", '    <link rel="stylesheet" href="./project-typography.css" />\n  </head>'));
        await copyFile(resolve(phase5Host, "phase5-ui.css"), resolve(output, "platform/phase5-ui.css"));
        if (project.web) {
          const sitemapUrl = new URL("sitemap.xml", project.web.canonicalUrl).href;
          const robots = project.web.index
            ? `User-agent: *\nAllow: /\nSitemap: ${sitemapUrl}\n`
            : "User-agent: *\nDisallow: /\n";
          await writeFile(resolve(output, "robots.txt"), robots);
          if (project.web.index) {
            const location = escapeHtml(project.web.canonicalUrl);
            await writeFile(resolve(output, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${location}</loc></url>\n</urlset>\n`);
          }
        }
      }
      const packagedAssets = await packageProjectAssets(project, output);
      const packagedLibraries = await packageLibraryCompliance(project, output);
      await writeFile(resolve(output, "project-typography.css"), projectTypographyCss(packagedAssets.entries));
      let startupContentSha256 = null;
      if (startupStage) {
        const startupOutput = resolve(startupStage.temporary, "compiled");
        const startupBundle = await buildBundle({ manifestPath: startupStage.manifestPath, outputDirectory: startupOutput,
          analyzerPath: binarySdk.artifacts.analyzer, compilerPath: binarySdk.artifacts.compiler });
        const startupTree = await runStartupBundle({ bundlePath: resolve(startupOutput, "luastra.bundle.json"),
          runtimeModulePath: binarySdk.artifacts.runtimeJavaScript });
        const failure = await buildStartupFailure(startupStage, binarySdk.artifacts);
        const rendered = renderStartupHtml(startupTree, packagedAssets.entries, { failureTree: failure.tree });
        const layout = '[data-luastra-startup-host="v1"]{position:fixed;inset:0;z-index:2147483000;overflow:auto;background:var(--luastra-color-bg)}\n[data-luastra-startup-host="v1"] > .luastra-screen,[data-startup-failure] > .luastra-screen{min-height:100vh}\n[data-startup-failure]{display:none}\n[data-luastra-startup-host="v1"][data-startup-state="failed"] > .luastra-screen{display:none}\n[data-luastra-startup-host="v1"][data-startup-state="failed"]{background:#f4efe3;color:#16342e}\n[data-startup-state="failed"] > [data-startup-failure]{display:block;min-height:100%}\n#host-root [data-startup-no-script]{margin:0;padding:1rem;background:#f4efe3;color:#16342e;border-bottom:1px solid #526a64}\n';
        await writeFile(resolve(output, "startup.css"), layout + rendered.css);
        const htmlPath = resolve(output, "index.html");
        const html = await readFile(htmlPath, "utf8");
        await writeFile(htmlPath, html.replace("  </head>", '    <link rel="stylesheet" href="./startup.css" />\n  </head>')
          .replace('<div id="host-root"></div>', () => `<div id="host-root">${rendered.html}</div>`));
        startupContentSha256 = sha256(canonicalJson({ entry: project.startup.entry, bundle: startupBundle.contentSha256, failureBundle: failure.contentSha256, html: rendered.html, css: layout + rendered.css }));
      }
      const projectContentSha256 = projectContentDigest(project, bundleContentSha256, packagedAssets.entries, startupContentSha256);
      let result = { ...base, bundleContentSha256, projectContentSha256, projectAssets: packagedAssets.entries.length, projectAssetLedgerSha256: packagedAssets.ledgerSha256, projectLibraries: packagedLibraries.libraries };
      if (packagedLibraries.libraries > 0) result = { ...result, libraryManifestSha256: packagedLibraries.manifestSha256, libraryNoticesSha256: packagedLibraries.noticesSha256, librarySbomSha256: packagedLibraries.sbomSha256 };
      if (startupContentSha256) result = { ...result, startupContentSha256 };
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
    });
  } finally {
    await rm(staged.temporary, { recursive: true, force: true });
    if (startupStage) await rm(startupStage.temporary, { recursive: true, force: true });
  }
}
