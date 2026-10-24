#!/usr/bin/env bash
######################################################################
# .what = entrypoint for census.dreams — which dreams in the `.dream/` queue a route
#         links from its `dreams/` dir, and which links point at naught
#
# .why  = rhx resolves a skill by its .sh; the .js holds the logic and the usage.
#         the .js documented `rhx census.dreams` with no .sh beside it, so that
#         call failed with "no skill found"
#
# usage:
#   rhx census.dreams --route <path> [--since <version>] [--queue <dir>]
#
# flags:
#   --route <path>     the route whose `dreams/` dir is checked (required)
#   --since <version>  narrow the unlinked report to dreams caught at or after this
#                      version, e.g. v2026_09_09 — the window the route ran
#   --queue <dir>      the flat dream queue to read (default: .dream)
######################################################################
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# fail loud, with the fix, on a host with no node (the same preflight in every wrapper here)
if ! command -v node >/dev/null; then
  echo "✋ ConstraintError: node is not on PATH; install node, then rerun" >&2
  exit 2
fi

exec node "$SCRIPT_DIR/census.dreams.js" "$@"
