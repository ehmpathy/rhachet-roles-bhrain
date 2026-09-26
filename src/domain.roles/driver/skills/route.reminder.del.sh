#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for route.reminder.del skill (DEREGISTER)
#
# .why = turns the RouteReminder off for a driver session — stops the
#        live daemon and clears its handle. idempotent: a re-run on an
#        already-absent reminder is a safe no-op.
#
# usage:
#   ./route.reminder.del.sh --route .behavior/my-feature --clone-addr driver-1
#
# options:
#   --route        path to route directory (required)
#   --clone-addr   the driver session's clone address (required)
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/route.reminder').then(m => m.routeReminderDel())" -- "$@"
