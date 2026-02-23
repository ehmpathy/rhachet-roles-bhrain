#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for route.bind.get skill
#
# .why = queries the route bound to the current branch
#        via location-independent package import
#
# usage:
#   ./route.bind.get.sh
#
# options:
#   (none)
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/route').then(m => m.routeBindGet())" -- "$@"
