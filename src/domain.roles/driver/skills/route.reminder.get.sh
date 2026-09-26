#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for route.reminder.get skill (DETECT)
#
# .why = reads whether a driver session's RouteReminder is live, and its
#        pid. a dead / stale / absent handle reads as "not live", so this
#        never reports a phantom live daemon.
#
# usage:
#   ./route.reminder.get.sh --route .behavior/my-feature --clone-addr driver-1
#
# options:
#   --route        path to route directory (required)
#   --clone-addr   the driver session's clone address (required)
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/route.reminder').then(m => m.routeReminderGet())" -- "$@"
