#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for route.reminder.del skill (DEREGISTER)
#
# .why = turns a clone's one RouteReminder off — stops the live daemon and
#        clears its handle. idempotent: a re-run on an already-absent
#        reminder is a safe no-op.
#
# usage:
#   ./route.reminder.del.sh                          # inside an enrolled clone
#   ./route.reminder.del.sh --clone-addr @:driver-1
#
# options:
#   --clone-addr   the clone address (default: this session's own)
#
# note:
#   the reminder is one per clone, so del takes no --route (refused: exit 2, names the fix).
#   the handle sits under the repo root of the cwd.
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/route.reminder').then(m => m.routeReminderCli({ verb: 'del' }))" -- "$@"
