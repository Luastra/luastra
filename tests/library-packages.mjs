import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, rm, symlink, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { buildProject } from "../project/build-project.mjs";
import { checkLibrary, installLibrary, packLibrary, removeLibrary } from "../project/library-packages.mjs";
import { loadProject } from "../project/load-project.mjs";

const prototype = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceLibrary = resolve(prototype, "libraries/universal-blocks");
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

async function createProject(root, { asset = false } = {}) {
  await mkdir(resolve(root, "src"), { recursive: true });
  const manifest = {
    schemaVersion: 2,
    project: { id: "dev.luastra.library-test", entry: "app/main" },
    sdk: { contract: 1 },
    capabilities: ["ui.render"],
    modules: [{ id: "app/main", source: "src/main.luau", dependencies: ["luastra/app", "luastra/ui", "universal-blocks"] }],
    ...(asset ? { assets: [{ id: "images/logo", source: "assets/logo.png", mediaType: "image/png" }] } : {}),
  };
  await writeFile(resolve(root, "luastra.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(resolve(root, "src/main.luau"), '--!strict\nlocal App = require("luastra/app")\nlocal UI = require("luastra/ui")\nlocal Blocks = require("universal-blocks")\nreturn App.compose { features = {}, render = function() return UI.Screen { id = "app", Blocks.EmptyState { id = "app/empty", title = "Empty", message = "Empty" } } end, snapshot = function() return {} end }\n');
  if (asset) {
    await mkdir(resolve(root, "assets"), { recursive: true });
    await writeFile(resolve(root, "assets/logo.png"), png);
  }
}

async function libraryVariant(root, mutate) {
  await cp(sourceLibrary, root, { recursive: true });
  const path = resolve(root, "luastra-library.json");
  const manifest = JSON.parse(await readFile(path, "utf8"));
  await mutate(manifest, root);
  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`);
  return root;
}

test("library archive install, update rollback, remove and offline reinstall are deterministic", { timeout: 30_000 }, async () => {
  const workspace = await mkdtemp(resolve(tmpdir(), "luastra-library-lifecycle-"));
  try {
    const project = resolve(workspace, "project");
    await createProject(project);
    const v1Package = resolve(workspace, "v1.luastra-library");
    const packedV1 = await packLibrary(sourceLibrary, v1Package);
    await assert.rejects(packLibrary(sourceLibrary, v1Package), /output already exists/);
    assert.equal((await checkLibrary(v1Package)).contentSha256, packedV1.contentSha256);
    await installLibrary({ project, source: v1Package });
    let loaded = await loadProject(resolve(project, "luastra.json"));
    assert.equal(loaded.libraries.length, 1);
    assert.equal(loaded.modules.get("universal-blocks").library, "dev.luastra.universal-blocks");
    assert.ok(loaded.tests.includes("universal-blocks/test"));

    const dependentSource = await libraryVariant(resolve(workspace, "dependent"), async (manifest, root) => {
      manifest.library.id = "dev.luastra.composed-blocks";
      manifest.dependencies = [{ id: "dev.luastra.universal-blocks", version: "1.0.0", contentSha256: packedV1.contentSha256 }];
      manifest.exports = ["composed-blocks"];
      manifest.modules = [
        { id: "composed-blocks", source: "source/init.luau", dependencies: ["universal-blocks"] },
        { id: "composed-blocks/test", source: "source/test.luau", dependencies: ["composed-blocks"] },
      ];
      manifest.tests = ["composed-blocks/test"];
      await writeFile(resolve(root, "source/init.luau"), '--!strict\nlocal Blocks = require("universal-blocks")\nreturn table.freeze({ EmptyState = Blocks.EmptyState })\n');
      await writeFile(resolve(root, "source/test.luau"), '--!strict\nlocal Blocks = require("composed-blocks")\nreturn function() assert(Blocks.EmptyState ~= nil) end\n');
    });
    const dependentPackage = resolve(workspace, "dependent.luastra-library");
    const dependentPacked = await packLibrary(dependentSource, dependentPackage);
    await installLibrary({ project, source: dependentPackage });
    loaded = await loadProject(resolve(project, "luastra.json"));
    assert.equal(loaded.libraries.length, 2);
    assert.equal(loaded.modules.get("composed-blocks").library, "dev.luastra.composed-blocks");
    await assert.rejects(removeLibrary({ project, id: "dev.luastra.universal-blocks" }), /required by dev\.luastra\.composed-blocks/);
    const cyclicSource = await libraryVariant(resolve(workspace, "cyclic-library"), async (manifest, root) => {
      manifest.library.version = "1.0.1";
      manifest.dependencies = [{ id: "dev.luastra.composed-blocks", version: "1.0.0", contentSha256: dependentPacked.contentSha256 }];
      manifest.modules[0].dependencies.push("composed-blocks");
      const modulePath = resolve(root, "source/init.luau");
      await writeFile(modulePath, `${await readFile(modulePath, "utf8")}\nlocal _Composed = require("composed-blocks")\n`);
    });
    const cyclicPackage = resolve(workspace, "cyclic.luastra-library");
    await packLibrary(cyclicSource, cyclicPackage);
    await assert.rejects(installLibrary({ project, source: cyclicPackage, expectedVersion: "1.0.1", update: true }), /library dependency cycle/);
    await removeLibrary({ project, id: "dev.luastra.composed-blocks" });

    const v11Source = await libraryVariant(resolve(workspace, "v11"), async (manifest, root) => {
      manifest.library.version = "1.1.0";
      const modulePath = resolve(root, "source/init.luau");
      await writeFile(modulePath, `${await readFile(modulePath, "utf8")}\n-- Compatible update fixture.\n`);
    });
    const v11Package = resolve(workspace, "v11.luastra-library");
    await packLibrary(v11Source, v11Package);
    await installLibrary({ project, source: v11Package, expectedVersion: "1.1.0", update: true });
    loaded = await loadProject(resolve(project, "luastra.json"));
    assert.equal(loaded.libraries[0].version, "1.1.0");

    const lockPath = resolve(project, "luastra.lock.json");
    const beforeFailure = await readFile(lockPath, "utf8");
    const corruptPath = resolve(workspace, "corrupt.luastra-library");
    const corrupt = JSON.parse(await readFile(v11Package, "utf8"));
    corrupt.files.find((file) => file.path === "source/init.luau").content = Buffer.from("tampered").toString("base64");
    await writeFile(corruptPath, JSON.stringify(corrupt));
    await assert.rejects(installLibrary({ project, source: corruptPath, expectedVersion: "1.1.0", update: true }), /integrity mismatch/);
    assert.equal(await readFile(lockPath, "utf8"), beforeFailure, "failed update changed the lockfile");
    assert.equal((await loadProject(resolve(project, "luastra.json"))).libraries[0].version, "1.1.0");

    await removeLibrary({ project, id: "dev.luastra.universal-blocks" });
    assert.equal((await loadProject(resolve(project, "luastra.json"))).libraries.length, 0);
    await installLibrary({ project, source: v1Package });
    assert.equal((await loadProject(resolve(project, "luastra.json"))).libraries[0].contentSha256, packedV1.contentSha256);

    const output = resolve(workspace, "web");
    const built = await buildProject({ manifestPath: resolve(project, "luastra.json"), outputDirectory: output, target: "web" });
    assert.equal(built.projectLibraries, 1);
    const closure = JSON.parse(await readFile(resolve(output, "project-libraries.json"), "utf8"));
    assert.equal(closure.libraries[0].contentSha256, packedV1.contentSha256);
    assert.match(await readFile(resolve(output, "PROJECT_LIBRARY_NOTICES.md"), "utf8"), /Luastra Universal Blocks/);
    assert.equal(JSON.parse(await readFile(resolve(output, "project-library-sbom.spdx.json"), "utf8")).packages[0].name, "dev.luastra.universal-blocks");
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("library admission fails closed for incompatible, colliding and incomplete inputs", async () => {
  const workspace = await mkdtemp(resolve(tmpdir(), "luastra-library-negative-"));
  try {
    const project = resolve(workspace, "project");
    await createProject(project, { asset: true });

    if (process.platform !== "win32") {
      const outside = resolve(workspace, "outside-libraries");
      await mkdir(outside);
      await mkdir(resolve(project, ".luastra"));
      const linkedLibraries = resolve(project, ".luastra/libraries");
      await symlink(outside, linkedLibraries);
      await assert.rejects(installLibrary({ project, source: sourceLibrary }), /resolves outside its library/);
      await unlink(linkedLibraries);
    }

    const incompatible = await libraryVariant(resolve(workspace, "incompatible"), async (manifest) => {
      manifest.library.version = "2.0.0";
      manifest.compatibility.sdkContract = { minimum: 2, maximum: 2 };
    });
    await assert.rejects(installLibrary({ project, source: incompatible }), /incompatible with SDK contract/);

    const capability = await libraryVariant(resolve(workspace, "capability"), async (manifest) => {
      manifest.library.version = "2.0.1";
      manifest.capabilities = ["clipboard.write"];
    });
    await assert.rejects(installLibrary({ project, source: capability }), /undeclared application capabilities/);

    const unavailableModule = await libraryVariant(resolve(workspace, "unavailable-module"), async (manifest, root) => {
      manifest.library.version = "2.0.6";
      manifest.modules[0].dependencies.push("missing-blocks");
      const modulePath = resolve(root, "source/init.luau");
      await writeFile(modulePath, `${await readFile(modulePath, "utf8")}\nlocal _Missing = require("missing-blocks")\n`);
    });
    await assert.rejects(installLibrary({ project, source: unavailableModule }), /requires unavailable module/);

    const moduleCollision = await libraryVariant(resolve(workspace, "module-collision"), async (manifest, root) => {
      manifest.library.version = "2.0.2";
      manifest.exports = ["app/main"];
      manifest.modules[0].id = "app/main";
      manifest.modules[1].dependencies = ["app/main", "luastra/ui"];
      const testPath = resolve(root, "source/test.luau");
      await writeFile(testPath, (await readFile(testPath, "utf8")).replace('require("universal-blocks")', 'require("app/main")'));
    });
    await assert.rejects(installLibrary({ project, source: moduleCollision }), /module collision/);

    const assetCollision = await libraryVariant(resolve(workspace, "asset-collision"), async (manifest, root) => {
      manifest.library.version = "2.0.3";
      await mkdir(resolve(root, "assets"), { recursive: true });
      await writeFile(resolve(root, "assets/logo.png"), png);
      manifest.assets = [{ id: "images/logo", source: "assets/logo.png", mediaType: "image/png", sha256: sha256(png) }];
    });
    await assert.rejects(installLibrary({ project, source: assetCollision }), /asset collision/);

    const cycle = await libraryVariant(resolve(workspace, "cycle"), async (manifest) => {
      manifest.library.version = "2.0.4";
      manifest.modules[0].dependencies.push("universal-blocks/test");
    });
    await assert.rejects(checkLibrary(cycle), /dependency cycle/);

    const missingLicense = await libraryVariant(resolve(workspace, "missing-license"), async (_manifest, root) => {
      await rm(resolve(root, "LICENSE"));
    });
    await assert.rejects(checkLibrary(missingLicense), /declared file not found/);

    const hashMismatch = await libraryVariant(resolve(workspace, "hash-mismatch"), async (manifest, root) => {
      manifest.library.version = "2.0.5";
      await mkdir(resolve(root, "assets"), { recursive: true });
      await writeFile(resolve(root, "assets/logo.png"), png);
      manifest.assets = [{ id: "images/other", source: "assets/logo.png", mediaType: "image/png", sha256: "0".repeat(64) }];
    });
    await assert.rejects(checkLibrary(hashMismatch), /asset integrity mismatch/);

    await writeFile(resolve(workspace, "broken.luastra-library"), "not-json");
    await assert.rejects(checkLibrary(resolve(workspace, "broken.luastra-library")), /Unexpected token|JSON/);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
