#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for the RouteReminder DAEMON loop
#
# .why = this is the detached background process a register (route.reminder.gen)
#        spawns. it wakes each interval, injects the nudge into the driver
#        session, and self-exits the moment the route is dead/parked or the
#        session is gone (the wish's no-infiniloop guarantee). you rarely run
#        this by hand — route.reminder.gen spawns it for you.
#
# usage:
#   ./route.reminder.daemon.sh --route .behavior/my-feature --clone-addr driver-1 --interval-ms 1200000
#   ./route.reminder.daemon.sh --route .behavior/my-feature --clone-addr driver-1 --say-timeout-ms 30000
#
# options:
#   --route          path to route directory (required)
#   --clone-addr     the driver session's clone address (required)
#   --interval-ms    tick cadence in ms (optional, default ~20min)
#   --say-timeout-ms per-nudge clone-say reach timeout in ms (optional, default 30000)
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/route.reminder').then(m => m.routeReminderDaemon())" -- "$@"
