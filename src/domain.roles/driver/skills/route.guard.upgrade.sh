#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for route.guard.upgrade skill
#
# .why = re-sync a route's guards from their source templates:
#        - after a supplier bump, pull the newest review frame in one command
#        - plan mode (default) previews a diff; apply mode overwrites the guard
#        - driven by each guard's declared provenance.uri
#
# usage:
#   ./route.guard.upgrade.sh                                     # plan all guards (default)
#   ./route.guard.upgrade.sh --mode apply                        # apply all guards
#   ./route.guard.upgrade.sh --stone 5.1.execution               # plan one stone's guard
#   ./route.guard.upgrade.sh --stone 5.1 --mode apply            # apply every 5.1.* guard
#   ./route.guard.upgrade.sh --route .behavior/my-feature        # target an explicit route
#
# options:
#   --stone   stone name (BOUNDARY match: "5.1" hits every "5.1.*" guard but NOT "5.10.x").
#             default: all guards in the route
#   --route   path to route directory (default: auto-detect from branch)
#   --mode    plan | apply (default: plan)
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/route').then(m => m.routeGuardUpgrade())" -- "$@"
