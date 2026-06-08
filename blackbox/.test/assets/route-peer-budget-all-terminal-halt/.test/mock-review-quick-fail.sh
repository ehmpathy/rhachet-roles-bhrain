#!/usr/bin/env bash
# mock reviewer that always finds blockers (level 1, cheap)
# .why = simulates a cheap reviewer with limited depth that infiloops on issues

set -euo pipefail

echo "---"
echo "blockers: 1"
echo "nitpicks: 0"
echo "---"
echo ""
echo "## blockers"
echo "- quick-fail: always finds issues (limited depth)"
