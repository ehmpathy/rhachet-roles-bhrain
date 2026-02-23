#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for route.bind.set skill
#
# .why = binds a route to the current branch for auto-lookup
#        via location-independent package import
#
# usage:
#   ./route.bind.set.sh --route .behavior/my-feature
#
# options:
#   --route   path to route directory to bind (required)
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/route').then(m => m.routeBindSet())" -- "$@"
