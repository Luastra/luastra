import { mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const markers = Object.freeze({
  bundle: ".luastra-generated-bundle",
});

function fail(message) { throw new Error(message); }

export async function prepareGeneratedOutput(outputValue, kind) {
  const marker = markers[kind];
  if (!marker) fail(`unknown generated output kind: ${kind}`);
  const output = resolve(outputValue);
  const info = await stat(output).catch(() => null);
  if (info) {
    if (!info.isDirectory()) fail(`${kind} output is not a directory: ${output}`);
    const entries = await readdir(output);
    if (entries.length > 0 && !entries.includes(marker)) fail(`refusing non-Luastra ${kind} output: ${output}`);
    if (entries.includes(marker)) await rm(output, { recursive: true, force: true });
  }
  await mkdir(output, { recursive: true });
  await writeFile(resolve(output, marker), `Luastra generated ${kind} v1\n`);
  return output;
}
