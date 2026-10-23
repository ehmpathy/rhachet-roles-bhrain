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
exec node "$SCRIPT_DIR/census.minpeer.js" "$@"
