#!/usr/bin/env bash
######################################################################
# .what = entrypoint for census.tokens — the token weight of a glob set
#
# .why  = rhx resolves a skill by its .sh; the .js holds the logic and the usage.
#         the .js documented `rhx census.tokens` with no .sh beside it, so that
#         call failed with "no skill found"
#
# usage:
#   rhx census.tokens --glob '<glob>' [--glob '<glob>' ...] [--files]
#
# flags:
#   --glob <pattern>  a set of files to weigh; repeat it to union several sets
#   --files           add one row per file (its estimated tokens), above the total
######################################################################
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# fail loud, with the fix, on a host with no node (the same preflight in every wrapper here)
if ! command -v node >/dev/null; then
  echo "✋ ConstraintError: node is not on PATH; install node, then rerun" >&2
  exit 2
fi

exec node "$SCRIPT_DIR/census.tokens.js" "$@"
