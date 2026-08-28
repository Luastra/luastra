import { spawnSync } from "node:child_process";
import { access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

if (process.platform !== "darwin") {
  throw new Error("the SDK Reference application bundle is currently macOS-only");
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bundle = resolve(root, "src-tauri", "target", "release", "bundle", "macos", "Luastra SDK Reference.app");
await access(bundle);

function run(args) {
  const result = spawnSync("codesign", args, { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 });
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || "codesign failed").trim());
}

run(["--force", "--deep", "--sign", "-", bundle]);
run(["--verify", "--deep", "--strict", "--verbose=2", bundle]);
process.stdout.write(`${JSON.stringify({ result: "PASS", signing: "AD_HOC_LOCAL", bundle })}\n`);
