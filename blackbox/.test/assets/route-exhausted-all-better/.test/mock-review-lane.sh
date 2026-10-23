#!/usr/bin/env bash
# a mock reviewer that raises a fixed count of blockers and nitpicks on every run
#
# .why = the exhausted-all-better journey needs lanes that never clear on their own, so
#        budget exhaustion plus the driver's concession grade is the only road forward
#
# usage: mock-review-lane.sh <blockers> <nitpicks>
set -euo pipefail

BLOCKERS="$1"
NITPICKS="$2"

echo "---"
echo "blockers: ${BLOCKERS}"
echo "nitpicks: ${NITPICKS}"
echo "---"
echo ""
for i in $(seq 1 "${BLOCKERS}"); do echo "- [blocker][better] concern ${i}"; done
for i in $(seq 1 "${NITPICKS}"); do echo "- [nitpick][better] concern ${i}"; done
