#!/usr/bin/env bash
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
  echo "- beta blocker: will pass when .test/beta-should-pass exists"
fi
