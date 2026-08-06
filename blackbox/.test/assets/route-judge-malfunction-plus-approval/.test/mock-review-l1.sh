#!/usr/bin/env bash
######################################################################
# .what = mock L1 reviewer that always passes
# .why = peer levels must clear so the judge rung becomes the top rung
######################################################################
set -euo pipefail

echo "---"
echo "blockers: 0"
echo "nitpicks: 0"
echo "---"
echo "L1 review passed (mock)"
exit 0
