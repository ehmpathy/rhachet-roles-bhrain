#!/usr/bin/env bash
######################################################################
# .what = mock review for releaser peer reviewer
# .why = enables controlled pass/fail behavior per reviewer
#
# behavior:
#   - if .test/releaser-should-pass exists: emit 0 blockers
#   - otherwise: emit 1 blocker (consumes budget)
######################################################################
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROUTE_DIR="$(dirname "$SCRIPT_DIR")"

if [[ -f "$ROUTE_DIR/.test/releaser-should-pass" ]]; then
  echo "---"
  echo "blockers: 0"
  echo "nitpicks: 0"
  echo "---"
  echo "releaser review passed (mock)"
else
  echo "---"
  echo "blockers: 1"
  echo "nitpicks: 0"
  echo "---"
  echo "releaser review failed (mock)"
  echo ""
  echo "## blockers"
  echo "- releaser blocker: release notes issue"
fi
