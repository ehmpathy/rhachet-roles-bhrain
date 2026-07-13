#!/usr/bin/env bash
######################################################################
# .what = mock peer review that emits 1 blocker
# .why = drives the contemplation gate — a given that holds a blocker
#        requires a .taken response before the stone may progress
######################################################################
set -euo pipefail

echo "---"
echo "blockers: 1"
echo "nitpicks: 0"
echo "---"
echo "architect review: 1 blocker"
echo ""
echo "## blockers"
echo "- the design lacks a bounded context"
