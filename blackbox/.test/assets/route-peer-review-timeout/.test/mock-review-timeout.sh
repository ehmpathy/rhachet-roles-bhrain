#!/usr/bin/env bash
######################################################################
# .what = mock review that sleeps to trigger timeout
# .why = tests that timeout triggers malfunction
#
# behavior:
#   - sleeps for 60 seconds (longer than test timeout)
#   - test sets RHACHET_REVIEW_TIMEOUT_MS=100 to trigger timeout fast
######################################################################
set -euo pipefail

# sleep long enough to trigger timeout in tests
# test will set RHACHET_REVIEW_TIMEOUT_MS=100 (100ms)
sleep 60

# should never reach here due to timeout
echo "---"
echo "blockers: 0"
echo "nitpicks: 0"
echo "---"
echo "review passed (should not reach)"
