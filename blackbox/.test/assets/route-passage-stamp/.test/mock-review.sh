#!/usr/bin/env bash
######################################################################
# .what = mock peer review that approves with no blockers or nitpicks
# .why = drives an allowed passage so the guard writes a passage stamp
#
# behavior:
#   - emits blockers/nitpicks to stdout (for guard to parse)
#   - 0 blockers, 0 nitpicks => stone passes => stamp written
######################################################################
set -euo pipefail

echo "---"
echo "blockers: 0"
echo "nitpicks: 0"
echo "---"
echo "review passed (mock stamp)"
