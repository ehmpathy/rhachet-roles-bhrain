#!/usr/bin/env bash
######################################################################
# .what = mock peer review that emits 1 blocker
# .why = two of these (distinct slugs) drive the partial-contemplation
#        case — the driver answers one, the gate blocks and names the other
######################################################################
set -euo pipefail

echo "---"
echo "blockers: 1"
echo "nitpicks: 0"
echo "---"
echo "review: 1 blocker"
echo ""
echo "## blockers"
echo "- the design lacks a bounded context"
