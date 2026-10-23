#!/usr/bin/env bash
######################################################################
# .what = entrypoint for census.cues — the cue vs argument share of a glob set of briefs
#
# .why  = rhx resolves a skill by its .sh; the .js holds the logic and the usage
#
# usage:
#   rhx census.cues --glob '<glob>' [--glob '<glob>' ...] [--files] [--emit]
#
# flags:
#   --glob <pattern>  a set of briefs to census; repeat it to union several sets
#   --files           add one row per file (its cue share and size), above the total
#   --emit            print every cue line as `<file>\t<line>`, no report — for a diff
######################################################################
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# fail loud, with the fix, outside a git checkout or before deps are installed
if ! REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null)"; then
  echo "✋ ConstraintError: census.cues needs the repo root; run it from a git checkout of this repo" >&2
  exit 2
fi
if [[ ! -x "$REPO_ROOT/node_modules/.bin/tsx" ]]; then
  echo "✋ ConstraintError: census.cues needs installed deps (tsx); run npm install, then rerun" >&2
  exit 2
fi

# tsx, so the .js can require the shipped cue classifier from its typescript source
exec "$REPO_ROOT/node_modules/.bin/tsx" "$SCRIPT_DIR/census.cues.js" "$@"
