#!/usr/bin/env bash
######################################################################
# .what = mock review for journey acceptance test
# .why = enables controlled pass/fail behavior for test scenarios
#
# behavior:
#   - if .test/review-should-pass exists: emit 0 blockers, 0 nitpicks
#   - otherwise: emit 1 blocker
#
# usage:
#   bash $route/.test/mock-review.sh
######################################################################
set -euo pipefail

# get the route directory (parent of .test)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROUTE_DIR="$(dirname "$SCRIPT_DIR")"

# check if we should pass
if [[ -f "$ROUTE_DIR/.test/review-should-pass" ]]; then
  echo "---"
  echo "blockers: 0"
  echo "nitpicks: 0"
  echo "---"
  echo "review passed (mock)"
else
  echo "---"
  echo "blockers: 1"
  echo "nitpicks: 0"
  echo "---"
  echo "review failed (mock)"
  echo ""
  echo "## blockers"
  echo "- mock blocker: this is a test blocker that will be removed when .test/review-should-pass exists"
fi
