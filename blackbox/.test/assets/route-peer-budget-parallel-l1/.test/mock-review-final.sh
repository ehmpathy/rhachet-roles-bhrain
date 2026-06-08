#!/usr/bin/env bash
######################################################################
# .what = mock review for final-checker (L2) peer reviewer
# .why = enables controlled pass/fail behavior per reviewer
#
# behavior:
#   - if .test/final-should-pass exists: emit 0 blockers
#   - otherwise: emit 1 blocker (consumes budget)
######################################################################
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROUTE_DIR="$(dirname "$SCRIPT_DIR")"

if [[ -f "$ROUTE_DIR/.test/final-should-pass" ]]; then
  echo "---"
  echo "blockers: 0"
  echo "nitpicks: 0"
  echo "---"
  echo "final review passed (mock)"
else
  echo "---"
  echo "blockers: 1"
  echo "nitpicks: 0"
  echo "---"
  echo "final review failed (mock)"
  echo ""
  echo "## blockers"
  echo "- final blocker: L2 reviewer found issue"
fi
