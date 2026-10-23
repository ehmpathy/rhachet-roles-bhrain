#!/usr/bin/env bash
######################################################################
# .what = entrypoint for brief.min.moveout — move the `.why` sections of a glob set of mins
#         out to the `.md` beside each
#
# .why  = rhx resolves a skill by its .sh; the .js holds the logic and the usage
#
# usage:
#   rhx brief.min.moveout --glob '<glob>' [--glob '<glob>' ...] [--mode plan|apply]
######################################################################
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# fail loud, with the fix, outside a git checkout or before deps are installed
if ! REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null)"; then
  echo "✋ ConstraintError: brief.min.moveout needs the repo root; run it from a git checkout of this repo" >&2
  exit 2
fi
if [[ ! -x "$REPO_ROOT/node_modules/.bin/tsx" ]]; then
  echo "✋ ConstraintError: brief.min.moveout needs installed deps (tsx); run npm install, then rerun" >&2
  exit 2
fi

# tsx, so the .js can require the shipped cue classifier from its typescript source
exec "$REPO_ROOT/node_modules/.bin/tsx" "$SCRIPT_DIR/brief.min.moveout.js" "$@"
