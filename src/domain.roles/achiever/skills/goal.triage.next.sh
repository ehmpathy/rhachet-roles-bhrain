#!/usr/bin/env bash
######################################################################
# .what = onStop hook to show unfinished goals and mandate continuation
#
# .why = ensures bots complete their committed work:
#        - shows inflight goals (priority)
#        - shows enqueued goals if no inflight
#        - exit 2 to soft-block session end
#
# usage:
#   configured as onStop hook via getAchieverRole.ts
#   ./goal.triage.next.sh --when hook.onStop
#   ./goal.triage.next.sh --when hook.onStop --scope repo
#
# exit codes:
#   0 = no unfinished goals (silent)
#   2 = unfinished goals exist (treestruct to stderr)
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/goal').then(m => m.goalTriageNext())" -- "$@"
