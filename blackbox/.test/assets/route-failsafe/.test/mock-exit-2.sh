#!/usr/bin/env bash
# reviewer that fails by constraint (exit 2)
echo "---"
echo "blockers: 1"
echo "nitpicks: 0"
echo "---"
echo "review failed: constraint violation"
exit 2
