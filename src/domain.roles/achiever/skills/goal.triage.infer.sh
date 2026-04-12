#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for goal.triage.infer skill
#
# .why = shows triage state: uncovered asks and extant goals
#        via location-independent package import
#
# usage:
#   ./goal.triage.infer.sh --scope repo
#   ./goal.triage.infer.sh --scope route
#   ./goal.triage.infer.sh --when hook.onStop
#
# options:
#   --scope   where to check: repo | route (defaults to route if bound, repo otherwise)
#   --when    mode: hook.onStop (optional)
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/goal').then(m => m.goalTriageInfer())" -- "$@"
