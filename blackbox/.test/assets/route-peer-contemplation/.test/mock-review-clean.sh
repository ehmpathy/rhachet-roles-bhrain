#!/usr/bin/env bash
######################################################################
# .what = mock peer review that emits a clean verdict (0 blockers, 0 nitpicks)
# .why = a clean reviewer requires no .taken — the contemplation gate must
#        skip it (proves clean-skip)
######################################################################
set -euo pipefail

echo "---"
echo "blockers: 0"
echo "nitpicks: 0"
echo "---"
echo "mechanic review: all clear"
