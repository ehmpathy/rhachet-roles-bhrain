#!/usr/bin/env bash
# mock reviewer that always finds blockers (level 2, expensive)
# .why = simulates an expensive reviewer that runs after level 1 exhausts

set -euo pipefail

echo "---"
echo "blockers: 1"
echo "nitpicks: 0"
echo "---"
echo ""
echo "## blockers"
echo "- thorough: deep analysis found issues"
