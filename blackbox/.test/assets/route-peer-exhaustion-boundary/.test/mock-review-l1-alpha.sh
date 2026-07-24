#!/bin/bash
# mock-review-l1-alpha.sh - simulates an l1 reviewer (budget 1)
# passes if .test/l1-alpha-should-pass exists, otherwise fails with 1 blocker

if [ -f ".test/l1-alpha-should-pass" ]; then
  echo "metrics.realized"
  echo "  └─ blockers: 0"
  echo "  └─ nitpicks: 0"
  exit 0
fi

echo "metrics.realized"
echo "  └─ blockers: 1"
echo "  └─ nitpicks: 0"
exit 2
