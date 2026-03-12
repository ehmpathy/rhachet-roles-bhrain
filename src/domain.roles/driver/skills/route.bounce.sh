#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for route.bounce skill
#
# .why = artifact gate enforcement for protected paths
#        blocks writes to artifacts until their stone passes
#
# usage:
#   ./route.bounce.sh                     # list protected artifacts
#   ./route.bounce.sh --mode hook --path src/feature.ts
#
# options:
#   --mode    hook = pretool check (reads path from stdin or --path)
#   --path    artifact path to check (hook mode)
#
# exit codes:
#   0 = allowed (or no protections active)
#   2 = blocked (artifact protected by unpassed gate)
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/route').then(m => m.routeBounce())" -- "$@"
