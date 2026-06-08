#!/usr/bin/env bash
######################################################################
# .what = mock review that always malfunctions (exit code 1)
# .why = tests that budget is NOT consumed on malfunction
#
# behavior:
#   - if .test/review-should-malfunction exists: exit 1 (malfunction)
#   - if .test/review-should-pass exists: emit 0 blockers
#   - otherwise: emit 1 blocker
######################################################################
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROUTE_DIR="$(dirname "$SCRIPT_DIR")"

# check if should malfunction
if [[ -f "$ROUTE_DIR/.test/review-should-malfunction" ]]; then
  echo "error: simulated malfunction (network timeout, etc.)" >&2
  exit 1
fi

# check if should pass
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
  echo "- mock blocker: fix the code"
fi
