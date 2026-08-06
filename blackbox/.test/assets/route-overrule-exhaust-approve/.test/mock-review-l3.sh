#!/usr/bin/env bash
######################################################################
# .what = mock l3 reviewer for the B5 boundary cell
# .why = l3 ALWAYS rejects, so with budget 1 it exhausts after one run.
#        the invariant under test: an exhausted l3 (terminal) plus an
#        l1 overrule, once the human approves, allows passage (B5).
#
# behavior:
#   - emit 1 blocker, exit 0 (a hard rejection that never converges)
######################################################################
set -euo pipefail

echo "---"
echo "blockers: 1"
echo "nitpicks: 0"
echo "---"
echo "l3 review failed (mock)"
echo ""
echo "## blockers"
echo "- mock l3 blocker: this reviewer never converges (drives to exhaustion)"
exit 0
