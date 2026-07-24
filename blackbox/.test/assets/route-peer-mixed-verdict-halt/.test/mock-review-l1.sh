#!/bin/bash
# mock-review-l1.sh - simulates an l1 reviewer
# malfunctions (exit 1) if .test/l1-should-malfunction exists
# passes if .test/l1-should-pass exists, otherwise fails with 1 blocker

# early-exit: malfunction when the malfunction flag is present
if [ -f ".test/l1-should-malfunction" ]; then
  echo "boom: l1 reviewer crashed mid-run"
  exit 1
fi

# early-exit: pass (0 blockers) when the pass flag is present
if [ -f ".test/l1-should-pass" ]; then
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
