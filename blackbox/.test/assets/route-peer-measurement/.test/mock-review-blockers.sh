#!/usr/bin/env bash
######################################################################
# .what = mock reviewer that emits a numeric blocker (deterministic path)
# .why = proves the numeric-REJECTION path through the real CLI: the
#        deterministic parser reads `1 blocker` verbatim (no sub-brain
#        fallback, so NO `tallied by` marker), and the reviewed? judge
#        rejects the stone because 1 blocker exceeds the 0 allowed. this
#        is a distinct variant from crash-malfunction and clean-pass —
#        a review that ran fine and reported a real blocker.
######################################################################
set -euo pipefail

echo "## review"
echo ""
echo "the change has one issue that must be fixed before it can pass."
echo ""
echo "1 blocker"
echo "0 nitpicks"
