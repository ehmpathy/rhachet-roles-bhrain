#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for route.stone.get skill
#
# .why = enables discovery of next stone(s) on a thought route
#        via location-independent package import
#
# usage:
#   ./route.stone.get.sh --stone @next-one --route .behavior/my-feature
#   ./route.stone.get.sh --stone @next-all --route .behavior/my-feature
#   ./route.stone.get.sh --stone @next-one --route .behavior/my-feature --say
#
# options:
#   --stone   query: @next-one, @next-all, or glob pattern (required)
#   --route   path to route directory (required)
#   --say     echo stone content to stdout
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli').then(m => m.cli.route.stone.get())" -- "$@"
