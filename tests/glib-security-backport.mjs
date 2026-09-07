import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const vendorRoot = resolve(root, "third_party/rust/glib-0.18.5");
const read = (path) => readFile(resolve(root, path), "utf8");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

const exactProvenance = Object.freeze({
  schemaVersion: 1,
  package: "glib",
  version: "0.18.5",
  license: "MIT",
  sourceArchive: "https://crates.io/api/v1/crates/glib/0.18.5/download",
  sourceArchiveSha256: "233daaf6e83ae6a12a52055f568f9d7cf4671dabb78ff9560ab6da230ce00ee5",
  sourceRepository: "https://github.com/gtk-rs/gtk-rs-core",
  sourceCommit: "42b9caf98e03ded086362d9653ca58fe94dc8658",
  advisory: "RUSTSEC-2024-0429",
  upstreamFix: "https://github.com/gtk-rs/gtk-rs-core/commit/05dff0ee696f9bcd8617cd48c4b812d046d440cb",
  upstreamPullRequest: "https://github.com/gtk-rs/gtk-rs-core/pull/1343",
  patchedFile: "src/variant_iter.rs",
  unpatchedFileSha256: "1fd02859333761c45321b32f28b24233446b97d0022a90d3a937ed162585b90e",
  patchedFileSha256: "a0f5ee8acb8faa089bcdfbc9a57372609fce7654026ccef7d9a224d05a654ccc",
  summary: "Pass the GLib variadic out-pointer as a mutable reference, exactly matching the upstream two-line fix.",
});

test("the vendored GLib source carries the exact admitted security backport", async () => {
  const provenance = JSON.parse(await readFile(resolve(vendorRoot, "LUASTRA_SECURITY_BACKPORT.json"), "utf8"));
  const source = await readFile(resolve(vendorRoot, provenance.patchedFile));
  assert.deepEqual(provenance, exactProvenance);
  assert.equal(sha256(source), provenance.patchedFileSha256);

  const text = source.toString("utf8");
  assert.match(text, /let mut p: \*mut libc::c_char = std::ptr::null_mut\(\);/);
  assert.match(text, /ffi::g_variant_get_child\([\s\S]*?&mut p,/);
  assert.doesNotMatch(text, /\n\s+&p,/);
});

test("both Tauri applications resolve GLib through the admitted local patch", async () => {
  const expectations = [
    ["hosts/tauri/src-tauri/Cargo.toml", "hosts/tauri/src-tauri/Cargo.lock", "../../../third_party/rust/glib-0.18.5"],
    ["website/src-tauri/Cargo.toml", "website/src-tauri/Cargo.lock", "../../third_party/rust/glib-0.18.5"],
  ];

  for (const [manifestPath, lockPath, relativePatch] of expectations) {
    const manifest = await read(manifestPath);
    assert.match(manifest, new RegExp(`\\[patch\\.crates-io\\][\\s\\S]*glib = \\{ path = "${relativePatch.replaceAll(".", "\\.")}" \\}`));

    const lock = await read(lockPath);
    const glibEntry = lock.match(/\[\[package\]\]\nname = "glib"\nversion = "0\.18\.5"[\s\S]*?(?=\n\[\[package\]\])/u)?.[0];
    assert.ok(glibEntry, `${lockPath} must contain glib 0.18.5`);
    assert.doesNotMatch(glibEntry, /^source = /mu);
    assert.doesNotMatch(glibEntry, /^checksum = /mu);
  }
});
