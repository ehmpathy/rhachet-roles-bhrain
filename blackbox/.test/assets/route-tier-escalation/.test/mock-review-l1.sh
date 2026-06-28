#!/usr/bin/env bash
######################################################################
# .what = mock L1 reviewer for tier escalation tests
# .why = enables controlled terminal-failure behavior for tests
#
# behavior:
#   - if .test/l1-should-malfunction exists: exit 1 (malfunction)
#   - if .test/l1-should-constraint exists: exit 2 with 0 blockers (genuine constraint)
#   - if .test/l1-should-pass exists: emit 0 blockers, exit 0
#   - otherwise: emit 1 blocker, exit 0
######################################################################
set -euo pipefail

# get the route directory (parent of .test)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROUTE_DIR="$(dirname "$SCRIPT_DIR")"

# check if we should malfunction
if [[ -f "$ROUTE_DIR/.test/l1-should-malfunction" ]]; then
  echo "L1 reviewer malfunction: simulated crash"
  exit 1
fi

# check if we should hit a genuine constraint (exit 2 with 0 blockers)
# .note = a genuine constraint emits NO blockers — the reviewer could not run a
#         real review. exit 2 WITH blockers would instead be a normal rejection.
if [[ -f "$ROUTE_DIR/.test/l1-should-constraint" ]]; then
  echo "---"
  echo "blockers: 0"
  echo "nitpicks: 0"
  echo "---"
  echo "L1 review could not run (mock constraint)"
  echo ""
  echo "reviewer hit a constraint and cannot proceed without external action"
  exit 2
fi

# check if we should pass
if [[ -f "$ROUTE_DIR/.test/l1-should-pass" ]]; then
  echo "---"
  echo "blockers: 0"
  echo "nitpicks: 0"
  echo "---"
  echo "L1 review passed (mock)"
  exit 0
fi

# default: emit blocker
echo "---"
echo "blockers: 1"
echo "nitpicks: 0"
echo "---"
echo "L1 review failed (mock)"
echo ""
echo "## blockers"
echo "- mock blocker: create .test/l1-should-pass to pass"
exit 0
