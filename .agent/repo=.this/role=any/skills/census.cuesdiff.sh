#!/usr/bin/env bash
######################################################################
# .what = entrypoint for census.cuesdiff — compare two `census.cues --emit` files: the cue lines
#         that left, the cue lines that arrived, and for each that left, whether the `.md`
#         beside its min still carries it
#
# .why  = rhx resolves a skill by its .sh; the .js holds the logic and the usage
#
# usage:
#   rhx census.cuesdiff --before <file> --after <file> [--lines]
######################################################################
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# fail loud, with the fix, on a host with no node (the same preflight in every wrapper here)
if ! command -v node >/dev/null; then
  echo "✋ ConstraintError: node is not on PATH; install node, then rerun" >&2
  exit 2
fi

exec node "$SCRIPT_DIR/census.cuesdiff.js" "$@"
