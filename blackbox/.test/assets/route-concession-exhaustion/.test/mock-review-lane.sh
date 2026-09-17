#!/usr/bin/env bash
# a mock reviewer that always raises exactly ONE blocker
#
# .why = the concession-exhaustion journey needs a lane that never clears on its own, so
#        budget exhaustion is the only road forward — the lane's fate is decided entirely
#        by what severity the driver conceded it at, never by a fix that satisfies it
set -euo pipefail

echo "---"
echo "blockers: 1"
echo "nitpicks: 0"
echo "---"
echo "lane: rejected"
echo ""
echo "## blockers"
echo "- the shape here is wrong, and the driver disagrees"
