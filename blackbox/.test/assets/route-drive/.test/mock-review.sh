#!/usr/bin/env bash
######################################################################
# .what = mock review command for testing
# .why = simulates review pass/fail based on marker file
######################################################################
set -euo pipefail

CMD_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# check if review should pass
if [[ -f "$CMD_DIR/review-should-pass" ]]; then
  echo "review: passed"
  echo "blockers: 0"
  echo "nitpicks: 0"
  exit 0
else
  echo "review: failed"
  echo "blockers: 1"
  echo "nitpicks: 0"
  exit 0
fi
