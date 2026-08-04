#!/usr/bin/env bash
######################################################################
# .what = mock l1 reviewer for the overrule-must-not-skip-higher tests
# .why = l1 rejects by default so a human can overrule it; the overrule
#        must NOT let the driver skip the l3 reviewer that still guards
#
# behavior:
#   - if .test/l1-should-pass exists: emit 0 blockers, exit 0
#   - otherwise: emit 1 blocker, exit 0 (a normal rejection)
######################################################################
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROUTE_DIR="$(dirname "$SCRIPT_DIR")"

if [[ -f "$ROUTE_DIR/.test/l1-should-pass" ]]; then
  echo "---"
  echo "blockers: 0"
  echo "nitpicks: 0"
  echo "---"
  echo "l1 review passed (mock)"
  exit 0
fi

echo "---"
echo "blockers: 1"
echo "nitpicks: 0"
echo "---"
echo "l1 review failed (mock)"
echo ""
echo "## blockers"
echo "- mock l1 blocker: create .test/l1-should-pass to pass"
exit 0
