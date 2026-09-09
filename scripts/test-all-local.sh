#!/usr/bin/env sh
set -eu

prototype_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$prototype_root"
node --test tests/*.mjs
node --test platform/tests/startup-execution.mjs platform/tests/startup-web.mjs
node website/scripts/validate-recipes.mjs
node platform/tests/dom-adapter-ime.mjs
