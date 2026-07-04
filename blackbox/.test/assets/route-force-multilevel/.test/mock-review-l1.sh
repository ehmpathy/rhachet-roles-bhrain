#!/usr/bin/env bash
######################################################################
# .what = mock L1 reviewer for multi-level force tests
# .why = l1 default-rejects (a perma-blocker) so l3 stays queued and
#        the human must force to advance
#
# behavior:
#   - default: emit 1 blocker, exit 0 (a rejection — non-terminal)
######################################################################
set -euo pipefail

echo "---"
echo "blockers: 1"
echo "nitpicks: 0"
echo "---"
echo "L1 review failed (mock rejection)"
echo ""
echo "## blockers"
echo "- mock blocker: l1 perma-rejects to force a leveled overrule/force"
exit 0
