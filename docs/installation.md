# Trusted SDK installation and release contract

Date: 2026-09-11

Status: `0.5.0-alpha release contract`

## Scope

Luastra `0.5.0-alpha` is distributed as four deterministic SDK archives:

| Host | Release asset |
| --- | --- |
| macOS Apple Silicon | `luastra-sdk-0.5.0-alpha-darwin-arm64.tar.gz` |
| macOS Intel | `luastra-sdk-0.5.0-alpha-darwin-x64.tar.gz` |
| Linux x64 | `luastra-sdk-0.5.0-alpha-linux-x64.tar.gz` |
| Windows x64 | `luastra-sdk-0.5.0-alpha-win32-x64.tar.gz` |

Node.js 24 or newer is required. The packaged CLI workflows do not require an
npm install, Rust, Xcode, Android Studio, or a source checkout.

Unsigned GUI installers, Apple notarization, Windows Authenticode, package
manager adapters, stores, and automatic background updates are outside this
public-source alpha contract.

## Release assets

The GitHub Release tag and title are both `v0.5.0-alpha`. Its immutable asset
set is:

- `luastra-release.v1.json` — exact release manifest and host selector;
- `SHA256SUMS` — digest for every host and companion asset;
- `luastra-install.mjs` — Node.js bootstrap installer;
- the four host archives listed above;
- `luastra-sdk-0.5.0-alpha.spdx.json` — exact SDK SPDX inventory;
- `luastra-sdk-0.5.0-alpha-THIRD_PARTY_NOTICES.md`;
- `luastra-sdk-0.5.0-alpha-licenses.tar.gz` — exact license texts and ledger;
- `luastra-0.5.0-alpha-RELEASE_NOTES.md`.

The release builder and verifier reject missing, extra, changed, reordered, or
non-admitted assets. Published release bytes are never replaced in place; a
correction receives a new version and a new complete manifest.

## Online installation

Download the installer and let it select and verify the current host archive
from the same HTTPS release location:

```sh
curl -fsSLO https://github.com/Luastra/luastra/releases/download/v0.5.0-alpha/luastra-install.mjs
node luastra-install.mjs \
  --manifest=https://github.com/Luastra/luastra/releases/download/v0.5.0-alpha/luastra-release.v1.json
```

## Offline installation

On a machine with internet access, open the
[`v0.5.0-alpha` GitHub Release](https://github.com/Luastra/luastra/releases/tag/v0.5.0-alpha)
and expand its **Assets** list. Download these three files:

1. `luastra-install.mjs`;
2. `luastra-release.v1.json`;
3. exactly one SDK archive matching the destination machine, using the host
   table above.

The archives are GitHub Release downloads; they are not obtained from the
repository **Code** tab. Keep every filename unchanged. Copy the three files
into one directory on the offline machine, open a terminal in that directory,
and run:

```sh
node ./luastra-install.mjs --manifest=./luastra-release.v1.json
```

For example, an Apple Silicon Mac directory contains:

```text
offline-luastra-install/
  luastra-install.mjs
  luastra-release.v1.json
  luastra-sdk-0.5.0-alpha-darwin-arm64.tar.gz
```

The installer detects the offline machine, finds the matching filename named
by the local release manifest, and verifies the archive plus its internal file
ledger before installation. `SHA256SUMS` may also be downloaded for independent
inspection, but it is not an additional command-line argument and is not one
of the three files required by the offline installer invocation above.

The installer writes only beneath `~/.luastra` by default:

```text
~/.luastra/
  bin/luastra
  bin/luastra.cmd
  shim.mjs
  state.v1.json
  sdk/0.5.0-alpha/
```

Construction happens in a sibling partial directory. Verification completes
before the atomic rename into `sdk/<version>`. An interruption leaves no
selectable partial SDK.

Add `~/.luastra/bin` to `PATH` manually if it is not already present. The
installer deliberately does not edit shell profiles or the Windows registry.

## Verification and version management

```sh
luastra version
luastra doctor
luastra sdk list
luastra sdk use 0.5.0-alpha
luastra sdk update --manifest=<path-or-https-url>
luastra sdk remove <inactive-version>
```

`doctor` verifies Node.js, the selected host, the manager state, every installed
file digest, the immutable SDK receipt, and the PATH shim. `sdk use` is the
rollback mechanism: select a previously retained verified version. Removing the
active version fails closed until another verified version is selected.

## Trust boundary

The release manifest binds archive bytes, installed file ledgers, SBOM,
notices, license texts, release notes, and installer. Online downloads require
HTTPS; offline bytes are checked against that same manifest. Archive extraction
rejects traversal, duplicate paths, links, non-regular entries, changed modes,
non-canonical metadata, and trailing data.

SHA-256 proves equality with the manifest obtained from the release channel; it
is not a cryptographic publisher signature. Code signing and notarization are
explicitly not claimed by `0.5.0-alpha`.

## Failure and rollback rules

- Unsupported host: stop before downloading an archive.
- Changed manifest or archive checksum: install nothing.
- Existing version with different bytes: do not overwrite it.
- Interrupted extraction: delete the partial directory.
- Installed-file tampering: `doctor` and command resolution fail closed.
- Update failure: retain the previously selected SDK.
- Rollback: run `luastra sdk use <verified-version>`.
- Removal: reject the active version and verify an inactive version before
  deleting it.

The immutable `0.4.0-alpha` and earlier releases remain available as historical
rollback targets when already installed or deliberately downloaded from their
own GitHub Releases. Never combine a manifest, installer, or archive from one
release with `0.5.0-alpha` assets.
