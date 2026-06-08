#!/usr/bin/env bash
######################################################################
# .what = mock review that always returns blockers
# .why = enables controlled exhaustion for approval unification test
#
# behavior:
#   - always emits 1 blocker (never passes within budget)
######################################################################
set -euo pipefail

echo "---"
echo "blockers: 1"
echo "nitpicks: 0"
echo "---"
echo "review failed (mock)"
echo ""
echo "## blockers"
echo "- mock blocker: this reviewer always fails to force exhaustion"
