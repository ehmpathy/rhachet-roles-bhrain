#!/usr/bin/env bash
######################################################################
# .what = review that always fails with a blocker
# .why = tests the escape hatch scenario where human must edit guard
######################################################################
set -euo pipefail

echo "---"
echo "blockers: 1"
echo "nitpicks: 0"
echo "---"
echo "review failed (perma-fail)"
echo ""
echo "## blockers"
echo "- perma-blocker: this review always fails. to pass, human must edit the guard file to remove this review."
