#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for route.stone.set skill
#
# .why = mark stone status to progress through a route:
#        - arrived: ready for review (triggers guard)
#        - passed: work complete (continues route)
#        - approved: human sign-off (for guarded stones)
#        - blocked: stuck, need help (halts route)
#
# usage:
#   ./route.stone.set.sh --stone 1.vision --route .behavior/my-feature --as arrived
#   ./route.stone.set.sh --stone 1.vision --route .behavior/my-feature --as passed
#   ./route.stone.set.sh --stone 1.vision --route .behavior/my-feature --as approved
#   ./route.stone.set.sh --stone 1.vision --route .behavior/my-feature --as blocked
#
# options:
#   --stone   stone name or glob pattern (required)
#   --route   path to route directory (required)
#   --as      status: arrived | passed | approved | blocked (required)
#             - arrived: "i'm here, review my work"
#             - passed: "done, continue to next stone"
#             - approved: "human approved" (requires human)
#             - blocked: "stuck, escalate to human" (requires articulation)
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/route').then(m => m.routeStoneSet())" -- "$@"
