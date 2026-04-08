#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for goal.memory.set skill
#
# .why = persists a goal to the goals directory
#        via location-independent package import
#
# usage:
#   ./goal.memory.set.sh --scope repo --covers hash1,hash2 < goal.yaml
#   ./goal.memory.set.sh --slug my-goal --status inflight --scope repo
#
# options:
#   --scope   where to persist: repo | route (required)
#   --covers  comma-separated hashes to mark as covered (optional)
#   --slug    goal slug for status update (update mode)
#   --status  new status choice: blocked | enqueued | inflight | fulfilled
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/goal').then(m => m.goalMemorySet())" -- "$@"
