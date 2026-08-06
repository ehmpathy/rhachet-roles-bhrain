#!/usr/bin/env bash
######################################################################
# .what = mock l3 reviewer for the overrule / contemplation discrimination
# .why = l3 rejects by default with exactly 1 blocker. the judge budget
#        tolerates that blocker, so the reviewed? judge passes and the
#        contemplation gate becomes the blocker — l3 still owes a .taken,
#        un-forgiven by the l1 overrule (R6). a flag lets l3 go clean.
#
# behavior:
#   - if .test/l3-should-pass exists: emit 0 blockers, exit 0
#   - otherwise: emit 1 blocker, exit 0 (a normal rejection)
######################################################################
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROUTE_DIR="$(dirname "$SCRIPT_DIR")"

if [[ -f "$ROUTE_DIR/.test/l3-should-pass" ]]; then
  echo "---"
  echo "blockers: 0"
  echo "nitpicks: 0"
  echo "---"
  echo "l3 review passed (mock)"
  exit 0
fi

echo "---"
echo "blockers: 1"
echo "nitpicks: 0"
echo "---"
echo "l3 review failed (mock)"
echo ""
echo "## blockers"
echo "- mock l3 blocker: create .test/l3-should-pass to pass"
exit 0
