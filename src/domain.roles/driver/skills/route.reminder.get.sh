#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for route.reminder.get skill (DETECT)
#
# .why = reads whether a clone's one RouteReminder is live, its pid, and
#        its focus route. a dead / stale / absent handle reads as "not
#        live", so this never reports a phantom live daemon.
#
# usage:
#   ./route.reminder.get.sh                          # inside an enrolled clone
#   ./route.reminder.get.sh --clone-addr @:driver-1
#
# options:
#   --clone-addr   the clone address (default: this session's own)
#
# note:
#   the reminder is one per clone, so get takes no --route (refused: exit 2, names the fix).
#   the handle sits under the repo root of the cwd.
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/route.reminder').then(m => m.routeReminderCli({ verb: 'get' }))" -- "$@"
