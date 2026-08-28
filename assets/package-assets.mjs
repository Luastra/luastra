import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";

function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
}
export function canonicalJson(value) { return `${JSON.stringify(stable(value), null, 2)}\n`; }

export async function packageProjectAssets(project, outputRoot) {
  const entries = [];
  for (const asset of project.assets) {
    const destination = resolve(outputRoot, asset.outputPath);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(asset.sourcePath, destination);
    const copied = await readFile(destination);
    if (copied.byteLength !== asset.bytes || sha256(copied) !== asset.sha256) throw new Error(`packaged asset integrity mismatch: ${asset.id}`);
    entries.push(Object.freeze({ id: asset.id, kind: asset.kind, path: asset.outputPath, mediaType: asset.mediaType, bytes: asset.bytes, sha256: asset.sha256 }));
  }
  const ledger = Object.freeze({ schemaVersion: 2, project: project.id, assets: Object.freeze(entries) });
  const ledgerText = canonicalJson(ledger);
  await writeFile(resolve(outputRoot, "project-assets.json"), ledgerText);
  return Object.freeze({ entries: Object.freeze(entries), ledgerSha256: sha256(ledgerText) });
}

export function projectContentDigest(project, bundleContentSha256, assets) {
  return sha256(canonicalJson({
    schemaVersion: 2,
    project: project.id,
    bundleContentSha256,
    backend: project.backend ? {
      declarationSha256: project.backend.declaration.sha256,
      handlerSha256: project.backend.handlerSha256,
      authentication: project.backend.authentication,
      database: project.backend.database.provider,
      identity: project.backend.identity.provider,
      content: project.backend.content.map(({ id, mediaType, bytes, sha256: digest }) => ({ id, mediaType, bytes, sha256: digest })),
    } : null,
    assets: assets.map(({ id, kind, path, mediaType, bytes, sha256: digest }) => ({ id, kind, path, mediaType, bytes, sha256: digest })),
  }));
}

export async function fileLedger(root, directory = root) {
  const files = [];
  for (const name of (await readdir(directory)).sort()) {
    const path = resolve(directory, name);
    const info = await stat(path);
    if (info.isDirectory()) files.push(...await fileLedger(root, path));
    else {
      const local = relative(root, path).split("\\").join("/");
      if (![".luastra-generated-web-dist", "asset-manifest.json"].includes(local)) {
        const bytes = await readFile(path);
        files.push(Object.freeze({ path: local, bytes: bytes.byteLength, sha256: sha256(bytes) }));
      }
    }
  }
  return files;
}
