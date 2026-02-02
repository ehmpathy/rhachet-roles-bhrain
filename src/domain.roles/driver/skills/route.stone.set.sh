#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for route.stone.set skill
#
# .why = enables mark of stone as passed or approved
#        via location-independent package import
#
# usage:
#   ./route.stone.set.sh --stone 1.vision --route .behavior/my-feature --as passed
#   ./route.stone.set.sh --stone 1.vision --route .behavior/my-feature --as approved
#
# options:
#   --stone   stone name or glob pattern (required)
#   --route   path to route directory (required)
#   --as      status: passed or approved (required)
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli').then(m => m.cli.route.stone.set())" -- "$@"
