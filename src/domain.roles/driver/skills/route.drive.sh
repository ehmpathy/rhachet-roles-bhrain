#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for route.drive skill
#
# .why = provides GPS-like guidance for clones, shows current stone
#        content and the command to mark it as passed
#
# usage:
#   ./route.drive.sh                           # echo current stone
#   ./route.drive.sh --when hook.onBoot        # show stone, exit 0 (session start)
#   ./route.drive.sh --when hook.onStop        # show stone, exit 2 if unpassed
#   ./route.drive.sh --route .behavior/my-feature
#
# options:
#   --route   path to route directory (uses bound route if absent)
#   --when    hook context: hook.onBoot or hook.onStop
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/route').then(m => m.routeDrive())" -- "$@"
