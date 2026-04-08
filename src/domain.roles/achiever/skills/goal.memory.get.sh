#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for goal.memory.get skill
#
# .why = retrieves goals from the goals directory
#        via location-independent package import
#
# usage:
#   ./goal.memory.get.sh --scope repo
#   ./goal.memory.get.sh --scope repo --status inflight
#   ./goal.memory.get.sh --scope repo --slug my-goal
#
# options:
#   --scope   where to read from: repo | route (required)
#   --status  filter by status: blocked | enqueued | inflight | fulfilled
#   --slug    filter by specific goal slug
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/goal').then(m => m.goalMemoryGet())" -- "$@"
