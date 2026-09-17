#!/usr/bin/env bash
# a mock reviewer that always raises exactly ONE blocker
#
# .why = the dispute-to-passage journey needs a lane that NEVER goes clean on its own,
#        so the only road past it is a dispute. a reviewer that could be satisfied by a
#        code fix would let the journey pass for the wrong reason (rule.forbid.failhide)
set -euo pipefail

echo "---"
echo "blockers: 1"
echo "nitpicks: 0"
echo "---"
echo "lane: rejected"
echo ""
echo "## blockers"
echo "- the shape here is wrong, and the driver disagrees"
