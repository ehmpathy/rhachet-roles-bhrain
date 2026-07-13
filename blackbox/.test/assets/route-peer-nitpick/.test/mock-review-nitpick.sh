#!/usr/bin/env bash
######################################################################
# .what = mock peer review with 0 blockers and 2 nitpicks
# .why = drives the nitpick-only quadrant — a review that holds only
#        nitpicks (no blockers) must NOT gate contemplation (design-note B8)
######################################################################
set -euo pipefail

echo "---"
echo "blockers: 0"
echo "nitpicks: 2"
echo "---"
echo "stylist: two small polish notes"
echo ""
echo "## nitpicks"
echo "- prefer a shorter name"
echo "- add a final comment"
