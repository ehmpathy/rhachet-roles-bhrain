#!/bin/bash
# mock-review-l3.sh - simulates an l3 reviewer
# passes if .test/l3-should-pass exists, otherwise fails with 1 blocker

if [ -f ".test/l3-should-pass" ]; then
  echo "metrics.realized"
  echo "  └─ blockers: 0"
  echo "  └─ nitpicks: 0"
  exit 0
else
  echo "metrics.realized"
  echo "  └─ blockers: 1"
  echo "  └─ nitpicks: 0"
  exit 2
fi
