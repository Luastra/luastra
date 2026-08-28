#!/usr/bin/env node

import { resolve } from "node:path";

import { canonicalJson } from "../../assets/package-assets.mjs";
import { proposeRuntimeInstallationAdmission } from "./install-runtime-sdk.mjs";

const archiveSet = process.argv[2];
if (!archiveSet || process.argv.length !== 3) throw new Error("usage: propose-runtime-installation-admission.mjs <verified-archive-set>");
process.stdout.write(canonicalJson(await proposeRuntimeInstallationAdmission(resolve(archiveSet))));
