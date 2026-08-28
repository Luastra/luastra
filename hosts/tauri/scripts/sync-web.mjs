#!/usr/bin/env node

import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

const host = resolve(import.meta.dirname, "..");
const source = resolve(host, "../../examples/media-player/dist/web");
const target = resolve(host, "www");
const manifest = JSON.parse(await readFile(resolve(source, "asset-manifest.json"), "utf8"));
const index = await readFile(resolve(source, "index.html"));

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true, force: true });
await writeFile(resolve(target, "luastra-tauri-host.v1.json"), `${JSON.stringify({
  schemaVersion: 1,
  fixture: "dev.luastra.media-player",
  assetManifestSha256: createHash("sha256").update(JSON.stringify(manifest)).digest("hex"),
  indexSha256: createHash("sha256").update(index).digest("hex"),
}, null, 2)}\n`);

process.stdout.write(`${target}\n`);
