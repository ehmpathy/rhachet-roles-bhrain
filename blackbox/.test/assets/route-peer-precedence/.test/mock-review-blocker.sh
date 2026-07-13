#!/usr/bin/env bash
######################################################################
# .what = mock peer review that emits 1 blocker
# .why = two of these (distinct slugs, distinct budgets) drive the
#        precedence case — one reviewer exhausts its budget while the
#        other stays uncontemplated, so the gate order can be proven
######################################################################
set -euo pipefail

echo "---"
echo "blockers: 1"
echo "nitpicks: 0"
echo "---"
echo "review: 1 blocker"
echo ""
echo "## blockers"
echo "- the design lacks a bounded context"
