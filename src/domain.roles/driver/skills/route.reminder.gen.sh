#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for route.reminder.gen skill (REGISTER)
#
# .why = turns the RouteReminder on for a driver session — findsert the
#        daemon, spawns a detached background process if none is live.
#        idempotent: a live daemon is returned, never duplicated.
#        named `gen` (findsert) to match the internal genRouteReminder verb.
#
# usage:
#   ./route.reminder.gen.sh --route .behavior/my-feature --clone-addr driver-1
#   ./route.reminder.gen.sh --route .behavior/my-feature --clone-addr driver-1 --interval-ms 1200000
#   ./route.reminder.gen.sh --route .behavior/my-feature --clone-addr driver-1 --say-timeout-ms 30000
#
# options:
#   --route          path to route directory (required)
#   --clone-addr     the driver session's clone address (required)
#   --interval-ms    tick cadence in ms (optional, default ~20min)
#   --say-timeout-ms per-nudge clone-say reach timeout in ms (optional, default 30000)
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/route.reminder').then(m => m.routeReminderGen())" -- "$@"
