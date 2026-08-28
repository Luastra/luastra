import { stat } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { verifyInstalledRuntimeSdk } from "./packaging/install-runtime-sdk.mjs";
import { verifyRuntimeSdk } from "./resolve-runtime-sdk.mjs";

const environmentName = "LUASTRA_RUNTIME_SDK_ROOT";
const candidateMarker = resolve(dirname(fileURLToPath(import.meta.url)), "../PRIVATE_MVP_MANIFEST.json");

function fail(message) { throw new Error(message); }

export async function resolveRuntime({ installationRoot = undefined, expectedHost = { platform: process.platform, architecture: process.arch }, environment = process.env } = {}) {
  if (!environment || typeof environment !== "object" || Array.isArray(environment)) fail("runtime environment must be an object");
  const configured = installationRoot === undefined ? environment[environmentName] : installationRoot;
  if (configured === undefined) {
    const sdk = await verifyRuntimeSdk(undefined, expectedHost);
    const origin = (await stat(candidateMarker).catch(() => null))?.isFile() ? "candidate" : "repository";
    return Object.freeze({ ...sdk, origin });
  }
  if (typeof configured !== "string" || configured.trim() !== configured || configured.length === 0 || !isAbsolute(configured)) {
    fail(`${environmentName} must be a non-empty absolute path without surrounding whitespace`);
  }
  return verifyInstalledRuntimeSdk(resolve(configured), expectedHost);
}

export const runtimeInstallationEnvironmentName = environmentName;
