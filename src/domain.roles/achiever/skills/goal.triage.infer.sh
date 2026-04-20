#!/usr/bin/env bash
######################################################################
# .what = detect uncovered asks and suggest goal creation
#
# .why = ensures every ask is covered by a goal:
#        - shows uncovered asks (need goals)
#        - shows goals with incomplete fields (need detail)
#        - onStop mode exits 2 if uncovered asks exist
#
# usage:
#   rhx goal.triage.infer                   # show triage state
#   rhx goal.triage.infer --when hook.onStop  # halt if uncovered asks
#
# exit codes:
#   0 = all asks covered
#   2 = onStop mode with uncovered asks (halt)
#
# note: scope is automatic based on route bind state.
#
# what it shows:
#   - uncovered asks: asks not covered by any goal
#   - incomplete goals: goals that lack required fields
#   - suggested actions: how to address each issue
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/goal').then(m => m.goalTriageInfer())" -- "$@"
