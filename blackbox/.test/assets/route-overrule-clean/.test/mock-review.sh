#!/usr/bin/env bash
######################################################################
# .what = mock reviewer that approves on merit
# .why = the only level clears with 0 blockers, so the stone reaches an
#        all-reviews-approved state with NO overrule ever recorded — the
#        precondition for the "overrule an already-clear stone" no-op test
#
# behavior:
#   - always emit 0 blockers, exit 0
######################################################################
set -euo pipefail

echo "---"
echo "blockers: 0"
echo "nitpicks: 0"
echo "---"
echo "review passed (mock)"
exit 0
