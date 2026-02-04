#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for route.stone.del skill
#
# .why = enables deletion of unused stones from a route
#        via location-independent package import
#
# usage:
#   ./route.stone.del.sh --stone "*.research.*" --route .behavior/my-feature
#
# options:
#   --stone   glob pattern for stones to delete (required)
#   --route   path to route directory (required)
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli').then(m => m.cli.route.stone.del())" -- "$@"
