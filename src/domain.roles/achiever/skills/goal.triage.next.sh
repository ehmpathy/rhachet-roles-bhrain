#!/usr/bin/env bash
######################################################################
# .what = show unfinished goals at session boundaries
#
# .why = ensures goals persist across compaction and session end:
#        - inflight goals have priority (finish first)
#        - enqueued goals shown if no inflight
#        - escalates after 5 repeated reminders
#
# modes:
#   hook.onBoot = informational refresh after compaction (exit 0)
#   hook.onStop = halt until goals fulfilled (exit 2)
#
# usage:
#   rhx goal.triage.next --when hook.onBoot   # refresh after compaction
#   rhx goal.triage.next --when hook.onStop   # halt until fulfilled
#
# exit codes:
#   0 = no unfinished goals (silent)
#   0 = onBoot mode (informational refresh to stdout)
#   2 = onStop mode with unfinished goals (halt, treestruct to stderr)
#
# note: scope is automatic based on route bind state.
#
# configured as hooks via getAchieverRole.ts:
#   onBoot = refresh goal state into context after compaction
#   onStop = halt until all goals fulfilled
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/goal').then(m => m.goalTriageNext())" -- "$@"
