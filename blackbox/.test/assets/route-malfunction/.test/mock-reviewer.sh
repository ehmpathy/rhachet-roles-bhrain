#!/usr/bin/env bash
######################################################################
# .what = mock reviewer for malfunction acceptance tests
# .why = enables controlled malfunction/pass/constraint behavior for tests
#
# behavior:
#   - if .test/reviewer-should-malfunction exists: exit 1 (malfunction)
#   - if .test/reviewer-should-constraint exists: exit 2 (constraint)
#   - if .test/reviewer-should-pass exists: emit 0 blockers, exit 0
#   - otherwise: emit 1 blocker, exit 0
#
# usage:
#   bash $route/.test/mock-reviewer.sh
######################################################################
set -euo pipefail

# get the route directory (parent of .test)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROUTE_DIR="$(dirname "$SCRIPT_DIR")"

# check if we should malfunction
if [[ -f "$ROUTE_DIR/.test/reviewer-should-malfunction" ]]; then
  echo "reviewer malfunction: simulated crash"
  exit 1
fi

# check if we should constraint (exit 2 with 0 blockers = genuine constraint)
# .note = a genuine constraint (e.g., absent api key, absent rule file) emits NO
#         blockers — the reviewer could not run a real review. exit 2 WITH blockers
#         would instead be a normal rejection (see computeReviewPeerVerdict).
if [[ -f "$ROUTE_DIR/.test/reviewer-should-constraint" ]]; then
  echo "---"
  echo "blockers: 0"
  echo "nitpicks: 0"
  echo "---"
  echo "review could not run (mock constraint)"
  echo ""
  echo "reviewer hit a constraint and cannot proceed without external action"
  exit 2
fi

# check if we should pass
if [[ -f "$ROUTE_DIR/.test/reviewer-should-pass" ]]; then
  echo "---"
  echo "blockers: 0"
  echo "nitpicks: 0"
  echo "---"
  echo "review passed (mock)"
  exit 0
fi

# default: emit blocker (no exit code flag)
echo "---"
echo "blockers: 1"
echo "nitpicks: 0"
echo "---"
echo "review failed (mock)"
echo ""
echo "## blockers"
echo "- mock blocker: create .test/reviewer-should-pass to pass"
exit 0
