#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { readFile, stat, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import process from "node:process";

const options = Object.fromEntries(process.argv.slice(2).map((entry) => {
  const separator = entry.indexOf("=");
  if (!entry.startsWith("--") || separator < 3) throw new Error(`Invalid argument: ${entry}`);
  return [entry.slice(2, separator), entry.slice(separator + 1)];
}));
const binaryOption = options.binary;
const outputOption = options.out;
const expectedTarget = options.target;
const evidenceClass = options["evidence-class"] ?? "CI_NATIVE_DESKTOP_RUNTIME_LAUNCH";
const actualTarget = `${process.platform}-${process.arch}`;
if (!binaryOption || !outputOption || !expectedTarget) throw new Error("--binary, --out and --target are required");
if (actualTarget !== expectedTarget) throw new Error(`Expected target ${expectedTarget}, received ${actualTarget}`);
if (!["CI_NATIVE_DESKTOP_RUNTIME_LAUNCH", "LOCAL_NATIVE_DESKTOP_RUNTIME_LAUNCH"].includes(evidenceClass)) throw new Error(`Unsupported evidence class: ${evidenceClass}`);
const binary = resolve(binaryOption);
const output = resolve(outputOption);
const durationMs = 8_000;
const child = spawn(binary, [], { stdio: ["ignore", "pipe", "pipe"] });
let stdout = "";
let stderr = "";
child.stdout.on("data", (chunk) => { if (stdout.length < 8192) stdout += chunk; });
child.stderr.on("data", (chunk) => { if (stderr.length < 8192) stderr += chunk; });
await new Promise((resolveWait) => setTimeout(resolveWait, durationMs));
const survived = child.exitCode === null && child.signalCode === null;
if (survived) child.kill("SIGTERM");
await Promise.race([
  new Promise((resolveExit) => child.once("exit", resolveExit)),
  new Promise((resolveWait) => setTimeout(resolveWait, 3_000)),
]);
if (!survived) throw new Error(`Desktop host exited early (${child.exitCode ?? child.signalCode}): ${stderr.slice(0, 512)}`);
const bytes = await readFile(binary);
const metadata = await stat(binary);
const proof = {
  schemaVersion: 1,
  evidenceClass,
  target: actualTarget,
  binary: basename(binary),
  binaryBytes: metadata.size,
  binarySha256: createHash("sha256").update(bytes).digest("hex"),
  processSurvivedMs: durationMs,
  stdoutBytes: Buffer.byteLength(stdout),
  stderrBytes: Buffer.byteLength(stderr),
  result: "PASS",
};
await writeFile(output, `${JSON.stringify(proof, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(proof, null, 2)}\n`);
