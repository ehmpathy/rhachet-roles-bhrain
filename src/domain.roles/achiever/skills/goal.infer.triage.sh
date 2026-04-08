#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for goal.infer.triage skill
#
# .why = shows triage state: uncovered asks and extant goals
#        via location-independent package import
#
# usage:
#   ./goal.infer.triage.sh --scope repo
#   ./goal.infer.triage.sh --scope route
#
# options:
#   --scope   where to check: repo | route (required)
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/goal').then(m => m.goalInferTriage())" -- "$@"
