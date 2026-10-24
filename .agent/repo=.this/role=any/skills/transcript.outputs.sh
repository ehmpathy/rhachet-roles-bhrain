#!/usr/bin/env bash
######################################################################
# .what = print past tool outputs of a session transcript that match a pattern
#
# .why  = a halt, a refusal, or a count printed earlier in the session is
#         often owed verbatim later (to a director, a blocker file). the
#         transcript jsonl rows are too long for grepsafe or Read, so this
#         extracts the tool_result text itself.
#
# usage:
#   rhx transcript.outputs --transcript <path.jsonl> --pattern '<regex>'
#   rhx transcript.outputs --transcript <path.jsonl> --pattern '<regex>' --last 1
#
# guarantee:
#   - read-only; prints each match whole, oldest first, split by a ===== line
#   - --last N keeps the newest N (default: all)
#   - exit 0 = printed (zero matches says so), 2 = bad input
######################################################################
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# fail loud, with the fix, on a host with no node (the same preflight in every wrapper here)
if ! command -v node >/dev/null; then
  echo "✋ ConstraintError: node is not on PATH; install node, then rerun" >&2
  exit 2
fi

exec node "$SCRIPT_DIR/transcript.outputs.js" "$@"
