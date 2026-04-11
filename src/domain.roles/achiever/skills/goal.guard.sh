#!/usr/bin/env bash
######################################################################
# .what = PreToolUse hook to protect .goals/ from direct manipulation
#
# .why = prevents bots from bypass of goal accountability:
#        - no rm, mv, cat via Bash
#        - no Read, Write, Edit on .goals/ paths
#        bots must use proper skills instead
#
# usage:
#   configured as PreToolUse hook via getAchieverRole.ts
#   reads tool input JSON from stdin (from claude code harness)
#
# exit codes:
#   0 = allowed (silent)
#   2 = blocked (treestruct to stderr)
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/goal').then(m => m.goalGuard())" -- "$@"
