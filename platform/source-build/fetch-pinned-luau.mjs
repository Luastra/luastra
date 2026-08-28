import { createHash } from "node:crypto";
import { open, rename, stat, unlink } from "node:fs/promises";
import { resolve } from "node:path";

import { verifySourceBuildContract } from "./verify-source-build-contract.mjs";

const { contract } = await verifySourceBuildContract();
const destination = process.argv[2] ? resolve(process.argv[2]) : null;
if (!destination || process.argv.length !== 3) throw new Error("usage: fetch-pinned-luau.mjs <new-destination.tar.gz>");
if (await stat(destination).catch(() => null)) throw new Error(`destination already exists: ${destination}`);

const response = await fetch(contract.luau.archiveUrl, { redirect: "follow" });
if (!response.ok) throw new Error(`Luau archive download failed: HTTP ${response.status}`);
const bytes = Buffer.from(await response.arrayBuffer());
const digest = createHash("sha256").update(bytes).digest("hex");
if (bytes.byteLength !== contract.luau.archiveBytes || digest !== contract.luau.archiveSha256) throw new Error("downloaded Luau archive does not match the admitted identity");

const temporary = `${destination}.partial`;
const handle = await open(temporary, "wx", 0o600);
try {
  await handle.writeFile(bytes);
  await handle.sync();
} finally {
  await handle.close();
}
try {
  await rename(temporary, destination);
} catch (error) {
  await unlink(temporary).catch(() => {});
  throw error;
}
process.stdout.write(`${destination}\n`);
