#!/bin/sh
set -eu

# Compatibility launcher for older x86-64 CPUs and legacy Linux graphics
# stacks. Keep this opt-in: disabling JavaScriptCore JIT and accelerated
# compositing can reduce performance on otherwise supported systems.

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
host_dir=$(CDPATH= cd -- "$script_dir/.." && pwd)
binary=${1:-"$host_dir/src-tauri/target/release/luastra-phase5-desktop-host"}

if [ ! -x "$binary" ]; then
  echo "Luastra desktop host is not executable: $binary" >&2
  echo "Build it first with: npm run build" >&2
  exit 1
fi

export JSC_useJIT=false
export WEBKIT_DISABLE_COMPOSITING_MODE=1

exec "$binary"
