#!/usr/bin/env sh
set -eu

prototype_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$prototype_root"
# Several suites deliberately measure hard runtime budgets or exercise the same
# admitted native/Wasm artifacts. Run files serially so host load cannot make
# one gate distort another on shared CI runners.
node --test --test-concurrency=1 platform/tests/startup-execution.mjs platform/tests/startup-web.mjs
node --test --test-concurrency=1 tests/*.mjs
node website/scripts/validate-recipes.mjs
node platform/tests/dom-adapter-ime.mjs
