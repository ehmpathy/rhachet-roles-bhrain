#!/usr/bin/env bash
######################################################################
# .what = mock L3 reviewer for tier escalation tests
# .why = L3 always passes to demonstrate tier escalation works
#
# behavior:
#   - always emits 0 blockers, exit 0
######################################################################
set -euo pipefail

echo "---"
echo "blockers: 0"
echo "nitpicks: 0"
echo "---"
echo "L3 review passed (mock)"
exit 0
