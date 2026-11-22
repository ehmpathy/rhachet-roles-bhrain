#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for the RouteReminder DAEMON loop
#
# .why = this is the detached background process a register (route.reminder.gen
#        or route.drive) spawns, one per clone. it wakes each interval, reads
#        the clone's focus route, injects the nudge about it into the clone
#        session, and self-exits the moment the focus is dead/parked/absent or
#        the session is gone (the wish's no-infiniloop guarantee). you rarely
#        run this by hand — the register spawns it for you.
#
# usage:
#   ./route.reminder.daemon.sh --repo-root /path/to/repo --clone-addr @:driver-1 --interval-ms 1200000
#   ./route.reminder.daemon.sh --repo-root /path/to/repo --clone-addr @:driver-1 --say-timeout-ms 30000
#
# options:
#   --repo-root      the repo root the clone handle sits under (required)
#   --clone-addr     the clone address (required)
#   --interval-ms    tick cadence in ms (optional, default ~20min)
#   --say-timeout-ms per-nudge clone-say reach timeout in ms (optional, default 30000)
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/route.reminder').then(m => m.routeReminderCli({ verb: 'daemon' }))" -- "$@"
