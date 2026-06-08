#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROUTE_DIR="$(dirname "$SCRIPT_DIR")"

if [[ -f "$ROUTE_DIR/.test/advanced-should-pass" ]]; then
  echo "---"
  echo "blockers: 0"
  echo "nitpicks: 0"
  echo "---"
  echo "advanced checker passed (mock)"
else
  echo "---"
  echo "blockers: 1"
  echo "nitpicks: 0"
  echo "---"
  echo "advanced checker failed (mock)"
  echo ""
  echo "## blockers"
  echo "- advanced blocker: will pass when .test/advanced-should-pass exists"
fi
