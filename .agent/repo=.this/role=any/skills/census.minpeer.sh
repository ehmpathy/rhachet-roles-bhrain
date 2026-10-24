#!/usr/bin/env bash
######################################################################
# .what = entrypoint for census.minpeer — min lines absent from the .md beside them
#
# .why  = rhx resolves a skill by its .sh; the .js holds the logic and the usage
#
# usage:
#   rhx census.minpeer --glob '<glob>' [--glob '<glob>' ...] [--files] [--emit]
#
# flags:
#   --glob <pattern>  a set of `.md.min` files to check; repeat it to union several sets
#   --files           add one row per min (absent lines / total, or `no .md peer`)
#   --emit            print every absent line as `<min>\t<line>`, no report — for a diff
######################################################################
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# fail loud, with the fix, on a host with no node (the same preflight in every wrapper here)
if ! command -v node >/dev/null; then
  echo "✋ ConstraintError: node is not on PATH; install node, then rerun" >&2
  exit 2
fi

exec node "$SCRIPT_DIR/census.minpeer.js" "$@"
