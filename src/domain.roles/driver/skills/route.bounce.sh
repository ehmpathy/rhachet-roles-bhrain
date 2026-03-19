#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for route.bounce skill
#
# .why = artifact gate enforcement for protected paths
#        blocks writes to artifacts until their stone passes
#
# usage:
#   ./route.bounce.sh                     # list protected artifacts
#   ./route.bounce.sh --mode hook
#
# options:
#   --mode    hook = pretool check (reads tool input from stdin)
#
# exit codes:
#   0 = allowed (or no protections active)
#   2 = blocked (artifact protected by unpassed gate)
######################################################################
set -euo pipefail

# capture stdin in bash before exec (node -e has issues with stdin inheritance)
# only read stdin if in hook mode
if [[ "${*}" == *"--mode hook"* || "${*}" == *"--mode=hook"* ]]; then
  # check if stdin has data (fd 0 is not a terminal)
  if [ ! -t 0 ]; then
    export RHACHET_STDIN="$(cat)"
  fi
fi

exec node -e "import('rhachet-roles-bhrain/cli/route').then(m => m.routeBounce())" -- "$@"
