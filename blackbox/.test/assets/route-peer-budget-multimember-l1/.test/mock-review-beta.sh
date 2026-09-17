#!/usr/bin/env bash
######################################################################
# .what = mock review for beta-checker (L1) peer reviewer
# .why = enables controlled pass/fail behavior per reviewer
#
# behavior:
#   - if .test/beta-should-pass exists: emit 0 blockers
#   - otherwise: emit 1 blocker (consumes budget)
######################################################################
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROUTE_DIR="$(dirname "$SCRIPT_DIR")"

if [[ -f "$ROUTE_DIR/.test/beta-should-pass" ]]; then
  echo "---"
  echo "blockers: 0"
  echo "nitpicks: 0"
  echo "---"
  echo "beta review passed (mock)"
else
  echo "---"
  echo "blockers: 1"
  echo "nitpicks: 0"
  echo "---"
  echo "beta review failed (mock)"
  echo ""
  echo "## blockers"
  echo "- beta blocker: L1 reviewer found issue"
fi
