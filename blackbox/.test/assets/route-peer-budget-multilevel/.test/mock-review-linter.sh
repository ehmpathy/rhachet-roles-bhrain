#!/usr/bin/env bash
# mock linter review - always fails unless flag file exists
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ -f "$SCRIPT_DIR/linter-should-pass" ]]; then
  echo "---"
  echo "blockers: 0"
  echo "nitpicks: 0"
  echo "---"
  echo "linter: passed"
else
  echo "---"
  echo "blockers: 1"
  echo "nitpicks: 0"
  echo "---"
  echo "linter: failed"
  echo ""
  echo "## blockers"
  echo "- absent semicolon on line 1"
fi
