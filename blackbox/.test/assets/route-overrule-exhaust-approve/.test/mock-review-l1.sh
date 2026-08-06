#!/usr/bin/env bash
######################################################################
# .what = mock l1 reviewer for the B5 boundary cell
# .why = l1 rejects by default so a human can overrule it; the overrule
#        must combine with an exhausted+approved l3 to allow passage.
#
# behavior:
#   - emit 1 blocker, exit 0 (a normal rejection)
######################################################################
set -euo pipefail

echo "---"
echo "blockers: 1"
echo "nitpicks: 0"
echo "---"
echo "l1 review failed (mock)"
echo ""
echo "## blockers"
echo "- mock l1 blocker: overrule to wave this level"
exit 0
