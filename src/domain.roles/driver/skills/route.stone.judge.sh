#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for route.stone.judge skill
#
# .why = enables deterministic judge mechanisms for guard validation
#        via location-independent package import
#
# usage:
#   ./route.stone.judge.sh --mechanism approved? --stone 1.vision --route .behavior/my-feature
#   ./route.stone.judge.sh --mechanism reviewed? --stone 5.implement --route .behavior/my-feature --allow-blockers 0 --allow-nitpicks 2
#
# mechanisms:
#   approved?   check if stone has human approval marker
#   reviewed?   check if reviews pass thresholds
#
# options:
#   --mechanism     judge type: approved? or reviewed? (required)
#   --stone         stone name (required)
#   --route         path to route directory (required)
#   --allow-blockers  max blockers allowed (for reviewed?, default: 0)
#   --allow-nitpicks  max nitpicks allowed (for reviewed?, default: 0)
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli').then(m => m.cli.route.stone.judge())" -- "$@"
