# Release verification

This document defines the public-source alpha evidence boundary. Passing one
layer never implies another layer passed.

## Evidence layers

1. Source checks: analysis, unit/integration tests, documentation validation,
   generated-output checks, secret scanning, dependency/license closure, and
   deterministic packaging.
2. Browser checks: real Chromium plus the separately named Firefox and
   Safari/WebKit audits for the surfaces they exercise.
3. Host checks: independent macOS, Linux, Windows, Android, and iOS evidence.
   Web evidence does not admit Capacitor or Tauri behavior.
4. Security check: one full Daybreak repository scan bound to the exact frozen
   candidate SHA, validation of every plausible finding, and a delta scan after
   any later executable change.
5. Publication check: clean public export, public CI, reviewed merge SHA,
   immutable tag/assets/checksums/SBOM/notices, isolated HTTPS installation, and
   production Pages verification.

Manual VoiceOver and NVDA certification is deferred for this release. Automated
semantic DOM, accessibility-tree, keyboard, focus, live-region, forced-colors,
reduced-motion, text-scaling, and responsive checks remain required. Release
notes and compatibility claims must preserve that distinction.

## Local candidate commands

Run from the repository root with Node.js 24 or newer and the committed lockfiles:

```sh
npm ci
npm ci --prefix website
npm test
npm run docs:check
npm --prefix website run reference:build
npm run audit:windowed-list:chromium
npm run audit:dynamic-images:chromium
npm run audit:content-upload:chromium
npm run audit:library-blocks:chromium
npm run audit:luastra-dev:chromium
npm run alpha:audit
```

Firefox and Safari/WebKit commands are retained separately because their driver
and operating-system prerequisites differ. Native host evidence is produced by
the pinned multi-host workflows and physical-device procedures; it must not be
inferred from this local sequence.

## Exact candidate gate

Before a public branch or pull request exists:

1. Freeze one private candidate commit and record its SHA and tree.
2. Run the complete functional, documentation, browser, installation, rollback,
   migration, Supabase-policy, archive-integrity, and applicable host matrix.
3. Build the versioned SDK release into a new directory and verify every asset
   against `release/sdk-release-admission.v1.json`.
4. Regenerate `CLEAN_EXPORT_MANIFEST.json`, run
   `release/audit-public-candidate.mjs`, and compare the materialized public tree
   with the intended diff.
5. Run the full Daybreak scan against that exact SHA. Fix and verify validated
   findings privately; scan every later executable delta.
6. Require an explicit owner decision for retained lower-severity risk and
   explicit authorization before creating the public candidate branch.

Publication is blocked by any unresolved critical/high validated finding,
unvalidated plausible finding, unscanned executable delta, secret or private
path, incomplete license/SBOM closure, missing required RLS/storage test, or
unsupported host claim.

## Publication sequence

Private commit, private push, private CI, public branch, public pull request,
public merge, release publication, and production deployment are separate
states. After authorization, verify each boundary and exact SHA. Never replace
an existing release asset; corrections receive a new version.

Inline video is not part of 0.5.0-alpha and does not block this candidate. It
will require its own mixed-media performance, decoder, caption, lifecycle,
autoplay, memory, and per-host evidence before a later release.
