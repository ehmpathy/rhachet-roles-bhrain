#!/usr/bin/env bash
######################################################################
# .what = mock review for alpha-checker (L1) peer reviewer
# .why = enables controlled pass/fail behavior per reviewer
#
# behavior:
#   - if .test/alpha-should-pass exists: emit 0 blockers
#   - otherwise: emit 1 blocker (consumes budget)
######################################################################
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROUTE_DIR="$(dirname "$SCRIPT_DIR")"

if [[ -f "$ROUTE_DIR/.test/alpha-should-pass" ]]; then
  echo "---"
  echo "blockers: 0"
  echo "nitpicks: 0"
  echo "---"
  echo "alpha review passed (mock)"
else
  echo "---"
  echo "blockers: 1"
  echo "nitpicks: 0"
  echo "---"
  echo "alpha review failed (mock)"
  echo ""
  echo "## blockers"
  echo "- alpha blocker: L1 reviewer found issue"
fi
