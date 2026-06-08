#!/usr/bin/env bash
# mock spellcheck review - passes when flag file exists
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ -f "$SCRIPT_DIR/spellcheck-should-pass" ]]; then
  echo "---"
  echo "blockers: 0"
  echo "nitpicks: 0"
  echo "---"
  echo "spellcheck: passed"
else
  echo "---"
  echo "blockers: 1"
  echo "nitpicks: 0"
  echo "---"
  echo "spellcheck: failed"
  echo ""
  echo "## blockers"
  echo "- typo detected on line 5"
fi
