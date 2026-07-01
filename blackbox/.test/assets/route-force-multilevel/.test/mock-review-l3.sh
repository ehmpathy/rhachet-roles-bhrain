#!/usr/bin/env bash
######################################################################
# .what = mock L3 reviewer for multi-level force tests
# .why = l3 always passes so, once l1 is waved through, the reviewed?
#        judge clears and only the approved? gate remains
#
# behavior:
#   - always emit 0 blockers, exit 0
######################################################################
set -euo pipefail

echo "---"
echo "blockers: 0"
echo "nitpicks: 0"
echo "---"
echo "L3 review passed (mock)"
exit 0
