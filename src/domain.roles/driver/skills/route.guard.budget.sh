#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for route.guard.budget skill
#
# .why = extend peer reviewer budgets when exhausted:
#        - allows humans to add more budget rounds
#        - enables route continuation without approval bypass
#
# usage:
#   ./route.guard.budget.sh --for review --add 2 --stone 1.vision            # extend all peer budgets by 2
#   ./route.guard.budget.sh --for review --add 2 --peer cheapo --stone 1.vision  # extend specific peer
#   ./route.guard.budget.sh --for review --add 2 --stone 1.vision --route .behavior/my-feature
#
# options:
#   --for     resource type: "review" (required)
#   --add     number of budget rounds to add (required)
#   --peer    peer reviewer slug to extend (default: all peers)
#   --stone   stone name with guard to update (required)
#   --route   path to route directory (default: auto-detect from branch)
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/route').then(m => m.routeGuardBudget())" -- "$@"
