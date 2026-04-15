#!/usr/bin/env bash
######################################################################
# .what = add a stone to the bound route
#
# .why  = enables drivers to dynamically add stones while on route
#         - add research stones on the fly
#         - add custom stones from templates
#         - add stones with inline content
#
# usage:
#   rhx route.stone.add --stone 3.1.6.research.custom --from @stdin
#   rhx route.stone.add --stone 3.1.6.research.custom --from 'inline content'
#   rhx route.stone.add --stone 3.1.6.research.custom --from 'template($behavior/refs/template.research.stone)'
#   rhx route.stone.add --stone 3.1.6.research.custom --from @stdin --mode apply
#
# guarantee:
#   - stone name must have numeric prefix + alpha segment
#   - --from must be @stdin, template($path), or literal text
#   - fails if stone already exists
#   - fails if no route is bound
#   - plan mode by default (preview only)
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/route').then(m => m.routeStoneAdd())" -- "$@"
