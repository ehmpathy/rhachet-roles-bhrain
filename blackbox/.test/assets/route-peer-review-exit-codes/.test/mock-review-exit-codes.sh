#!/usr/bin/env bash
######################################################################
# .what = mock review that can simulate different exit code scenarios
# .why = tests how guard handles various exit codes
#
# behavior (checked in order):
#   1. .test/review-should-malfunction exists → exit 1 (malfunction)
#   2. .test/review-should-constraint exists → exit 2 without blockers (genuine constraint)
#   3. .test/review-should-pass exists → exit 0 with 0 blockers (approved)
#   4. default → exit 0 with 1 blocker (rejected)
#
# exit code semantics:
#   0 = passed (review completed, may have blockers)
#   2 = constraint (controlled failure, like validation error or absent creds)
#   1 = malfunction (unexpected error)
######################################################################
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROUTE_DIR="$(dirname "$SCRIPT_DIR")"

# scenario 1: malfunction (exit 1)
if [[ -f "$ROUTE_DIR/.test/review-should-malfunction" ]]; then
  echo "error: simulated malfunction (network timeout, disk full, etc.)" >&2
  exit 1
fi

# scenario 2: genuine constraint error (exit 2 without blockers)
if [[ -f "$ROUTE_DIR/.test/review-should-constraint" ]]; then
  echo "error: API key not configured for review" >&2
  echo "hint: run 'rhx keyrack unlock --owner ehmpath --env test'" >&2
  exit 2
fi

# scenario 3: pass with no blockers (exit 0)
if [[ -f "$ROUTE_DIR/.test/review-should-pass" ]]; then
  echo "---"
  echo "blockers: 0"
  echo "nitpicks: 0"
  echo "---"
  echo "review passed (mock)"
  exit 0
fi

# scenario 4 (default): reject with blockers (exit 0)
echo "---"
echo "blockers: 1"
echo "nitpicks: 0"
echo "---"
echo "review failed (mock)"
echo ""
echo "## blockers"
echo "- mock blocker: fix the code"
exit 0
