#!/usr/bin/env bash
######################################################################
# .what = mock L3 reviewer that always passes
# .why = peer levels must clear so the judge rung becomes the top rung
######################################################################
set -euo pipefail

echo "---"
echo "blockers: 0"
echo "nitpicks: 0"
echo "---"
echo "L3 review passed (mock)"
exit 0
