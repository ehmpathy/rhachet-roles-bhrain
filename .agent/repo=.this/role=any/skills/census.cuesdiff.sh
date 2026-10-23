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
exec node "$SCRIPT_DIR/census.cuesdiff.js" "$@"
