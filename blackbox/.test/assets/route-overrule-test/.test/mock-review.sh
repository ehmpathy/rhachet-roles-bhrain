#!/usr/bin/env bash
######################################################################
# .what = mock review for overrule acceptance test
# .why = enables controlled pass/fail behavior for test scenarios
#
# behavior:
#   - if .test/review-should-pass exists: emit 0 blockers, 0 nitpicks
#   - otherwise: emit 3 blockers (to simulate overzealous reviewer)
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
  echo "blockers: 3"
  echo "nitpicks: 7"
  echo "---"
  echo "review failed (mock - overzealous reviewer)"
  echo ""
  echo "## blockers"
  echo "- mock blocker 1: this is pedantic"
  echo "- mock blocker 2: this is also pedantic"
  echo "- mock blocker 3: this too is pedantic"
  echo ""
  echo "## nitpicks"
  echo "- mock nitpick 1-7"
fi
