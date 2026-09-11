# Library package threat model

Status: `0.5.0-alpha` implementation boundary. This document covers local source
libraries, immutable `.luastra-library` archives, project lockfiles, installed
library files, and build attribution. It does not establish a marketplace,
publisher identity, signature authority, or remote package resolver.

## Assets and trust boundaries

Protected assets are application and SDK source integrity, the module graph,
declared host capabilities, packaged application assets, license attribution,
build reproducibility, and availability of the developer machine and build.
Library source directories, archives, manifests, lockfiles, Luau source, asset
bytes, license text, and notice text are untrusted inputs.

The CLI is the only installation boundary. Application execution never fetches
library code. A build reads only the exact local version named by the canonical
lockfile and verifies every byte before Luau analysis.

## Required controls

| Threat | Control and evidence |
| --- | --- |
| Path traversal or symlink escape | Require bounded relative paths, reject empty, dot, parent, and absolute segments, resolve every source file canonically, and prove it remains below the library root. |
| Corrupt, truncated, or substituted archive | Decode a bounded canonical package, verify base64 round trips, byte counts, every file hash, complete declared file closure, embedded manifest equality, and one content digest over the manifest and file ledger. |
| Lockfile tampering or unlocked code | Require canonical `luastra.lock.json`, exact version, content digest, and file ledger. Re-read and hash the installed source for every load. Missing or extra declared content fails closed. |
| Module or asset shadowing | Reserve `luastra/*` for the SDK and reject collisions with application content or any other installed library before changing the lock. |
| Hidden code loading | Admit literal `require` calls only and require their set to equal each module dependency list. Reject dynamic, malformed, undeclared, and unused dependency declarations. |
| Dependency confusion | Identify other libraries by DNS-style ID and bind dependencies to exact semantic version and content digest. No registry lookup, floating range, or network fallback exists. |
| Capability escalation | Require every library capability to be declared by the application before installation and again before each build. Runtime capability enforcement remains authoritative. |
| Dependency or module cycle | Validate the complete internal module graph and exact installed library dependencies before use. Module selection performs a second cycle check during build. |
| Partial install, failed update, or interrupted removal | Materialize into a unique staging directory, move only a verified tree, replace the lock atomically, delete the new tree if lock replacement fails, and quarantine removal until the new lock succeeds. |
| Resource exhaustion | Bound file count, decoded and encoded archive bytes, modules, assets, dependencies, tests, paths, and project-wide asset bytes before copying or compiling. |
| Missing attribution | Require SPDX license and notice files, run library conformance tests with the application, and emit deterministic closure, notice, and SPDX files in each build. |
| Sensitive path or input disclosure | Build metadata records IDs, versions, hashes, capabilities, and license metadata only. Diagnostics must not copy local source paths or arbitrary notice contents into public error strings. |

## Accepted risks and deferred gates

- SHA-256 integrity does not authenticate a publisher. Optional signatures need
  a separate key, revocation, and trust-decision design.
- The local filesystem and Git transport remain part of the developer's trust
  boundary. This slice does not sandbox library Luau more narrowly than other
  application modules; capability allowlists and the VM boundary remain the
  enforcement mechanism.
- There is no remote registry, dependency solver, install hook, native binary,
  or executable post-install surface.
- A process interruption after a successful lock replacement can leave an old,
  now-unlocked version on disk. Builds ignore it, and a later maintenance pass
  may remove it safely.
- Manual assistive-technology certification remains deferred by project choice.
- The final release candidate still requires the full exact-SHA Daybreak scan
  and clean-export review defined by the release plan.
