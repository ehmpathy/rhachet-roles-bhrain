#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for route.reminder.gen skill (REGISTER)
#
# .why = turns a clone's one RouteReminder on — points its focus at the
#        route, then findserts the daemon, which spawns a detached process
#        if none is live. idempotent: a live daemon is returned, never
#        duplicated; it nudges about the new focus from its next tick.
#        named `gen` (findsert) to match the internal genRouteReminder verb.
#
# usage:
#   ./route.reminder.gen.sh --route .behavior/my-feature --clone-addr @:driver-1
#   ./route.reminder.gen.sh --route .behavior/my-feature --interval-ms 1200000
#   ./route.reminder.gen.sh --route .behavior/my-feature --say-timeout-ms 30000
#
# options:
#   --route          the route to focus (default: the branch's bound route)
#   --clone-addr     the clone address (default: this session's own)
#   --interval-ms    tick cadence in ms (optional, default ~20min)
#   --say-timeout-ms per-nudge clone-say reach timeout in ms (optional, default 30000)
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/route.reminder').then(m => m.routeReminderCli({ verb: 'gen' }))" -- "$@"
