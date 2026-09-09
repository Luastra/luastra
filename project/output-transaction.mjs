import { lstat, mkdir, mkdtemp, readdir, rename, rm } from "node:fs/promises";
import { basename, dirname, relative, resolve } from "node:path";

const markers = { bundle: ".luastra-generated-bundle", web: ".luastra-generated-web-dist" };

async function inspect(output, kind) {
  const info = await lstat(output).catch((error) => { if (error.code === "ENOENT") return null; throw error; });
  if (!info) return null;
  if (!info.isDirectory() || info.isSymbolicLink()) throw new Error(`${kind} output is not a directory: ${output}`);
  const entries = await readdir(output);
  const marker = await lstat(resolve(output, markers[kind])).catch((error) => { if (error.code === "ENOENT") return null; throw error; });
  if (entries.length && (!marker?.isFile() || marker.isSymbolicLink())) throw new Error(`refusing non-Luastra ${kind} output: ${output}`);
  return info;
}

// Build and post-process off to the side before replacing successful output.
// Retain the backup for manual recovery if restoration ever fails.
export async function withGeneratedOutput(outputValue, kind, build) {
  if (!markers[kind]) throw new Error(`unknown generated output kind: ${kind}`);
  const output = resolve(outputValue);
  await mkdir(dirname(output), { recursive: true });
  const lock = resolve(dirname(output), `.${basename(output)}.luastra-build-lock`);
  await mkdir(lock).catch((error) => {
    if (error.code === "EEXIST") throw new Error(`output is locked by another build; inspect ${lock} before removing a stale lock`);
    throw error;
  });
  let workspace;
  let backup;
  try {
    const before = await inspect(output, kind);
    workspace = await mkdtemp(resolve(dirname(output), `.${basename(output)}.luastra-build-`));
    const staging = resolve(workspace, "candidate");
    await mkdir(staging);
    const result = await build(staging);
    const after = await inspect(output, kind);
    if (before?.ino !== after?.ino || before?.dev !== after?.dev) throw new Error(`output changed during build: ${output}`);
    if (after) {
      backup = resolve(workspace, "previous");
      await rename(output, backup);
    }
    try {
      await rename(staging, output);
    } catch (error) {
      if (backup) {
        await rename(backup, output).catch((restoreError) => {
          throw new AggregateError([error, restoreError], `output replacement failed; previous output retained at ${backup}`);
        });
        backup = null;
      }
      throw error;
    }
    backup = null;
    return Object.freeze({ ...result,
      ...(result.output ? { output } : {}),
      ...(result.bundlePath ? { bundlePath: resolve(output, relative(staging, result.bundlePath)) } : {}),
    });
  } finally {
    if (workspace && !backup) await rm(workspace, { recursive: true, force: true });
    await rm(lock, { recursive: true, force: true });
  }
}
