#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for route.drive skill
#
# .why = provides GPS-like guidance for clones, shows current stone
#        content and the command to mark it as passed
#
# usage:
#   ./route.drive.sh                     # echo current stone
#   ./route.drive.sh --mode hook         # silent if route complete
#   ./route.drive.sh --route .behavior/my-feature
#
# options:
#   --route   path to route directory (uses bound route if absent)
#   --mode    hook = silent on route complete (for hooks)
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli').then(m => m.cli.route.drive())" -- "$@"
