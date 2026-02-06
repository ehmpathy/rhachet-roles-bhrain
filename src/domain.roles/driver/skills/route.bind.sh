#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for route.bind skill
#
# .why = enables bind/query/remove of a route for the current branch
#        via location-independent package import
#
# usage:
#   ./route.bind.sh --route .behavior/my-feature
#   ./route.bind.sh --get
#   ./route.bind.sh --del
#
# options:
#   --route   path to route directory to bind
#   --get     query the current bind
#   --del     remove the current bind
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli').then(m => m.cli.route.bind())" -- "$@"
