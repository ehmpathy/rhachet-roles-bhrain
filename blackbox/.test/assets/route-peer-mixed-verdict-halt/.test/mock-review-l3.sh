#!/bin/bash
# mock-review-l3.sh - simulates an l3 reviewer that can malfunction
# malfunctions (exit 1) if .test/l3-should-malfunction exists
# passes if .test/l3-should-pass exists
# otherwise rejects with 1 blocker (exit 2)

# early-exit: malfunction when the malfunction flag is present
if [ -f ".test/l3-should-malfunction" ]; then
  echo "boom: reviewer crashed mid-run"
  exit 1
fi

# early-exit: pass (0 blockers) when the pass flag is present
if [ -f ".test/l3-should-pass" ]; then
  echo "metrics.realized"
  echo "  └─ blockers: 0"
  echo "  └─ nitpicks: 0"
  exit 0
fi

# fallback: reject with 1 blocker
echo "metrics.realized"
echo "  └─ blockers: 1"
echo "  └─ nitpicks: 0"
exit 2
