#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for route.bind.del skill
#
# .why = removes the route bind for the current branch
#        via location-independent package import
#
# usage:
#   ./route.bind.del.sh
#
# options:
#   (none)
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/route').then(m => m.routeBindDel())" -- "$@"
