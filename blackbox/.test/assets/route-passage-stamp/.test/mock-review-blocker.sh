#!/usr/bin/env bash
######################################################################
# .what = mock peer review that rejects with a blocker
# .why = drives a blocked passage so the guard writes a passage stamp
#        whose stderr carries the judge detail under the box-draw divider
#
# behavior:
#   - emits blockers/nitpicks to stdout (for guard to parse)
#   - 1 blocker => judge blocks => stone stays blocked => stamp written
######################################################################
set -euo pipefail

echo "---"
echo "blockers: 1"
echo "nitpicks: 0"
echo "---"
echo "review rejected (mock blocker)"
echo ""
echo "## blockers"
echo "- mock blocker for the blocked-passage stamp"
