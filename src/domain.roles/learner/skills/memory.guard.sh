#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for the memory.guard skill (learner PreToolUse hook)
#
# .why = halts writes to claude native memory and redirects to durable capture.
#        captures stdin into RHACHET_STDIN to work around node -e stdin
#        inheritance in the claude code harness (same pattern as route.bounce).
#
# usage:
#   ./memory.guard.sh --mode hook   # pretool check (reads tool input from stdin)
#
# exit codes:
#   0 = allowed (not a native-memory write)
#   2 = blocked (native-memory write; owl nudge to stderr)
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

exec node -e "import('rhachet-roles-bhrain/cli/memory').then(m => m.memoryGuard())" -- "$@"
