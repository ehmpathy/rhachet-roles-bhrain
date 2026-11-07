#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for the memory.guard skill (learner PreToolUse hook)
#
# .why = halts writes to claude native memory and redirects to durable capture.
#        captures stdin in bash, then hands it to node on node's own stdin, to
#        work around node -e stdin inheritance in the claude code harness.
#
# usage:
#   ./memory.guard.sh --mode hook   # pretool check (reads tool input from stdin)
#
# exit codes:
#   0 = allowed (not a native-memory write)
#   2 = blocked (native-memory write; owl nudge to stderr)
######################################################################
set -euo pipefail

# capture stdin in bash before node starts (node -e has issues with stdin inheritance)
# only read stdin if in hook mode
# .note = held in a shell var, never exported: linux caps one env string near 128KB,
#         so an exported payload past it fails the exec below. node reads it on its
#         own stdin, via a here-string
PAYLOAD=''
if [[ "${*}" == *"--mode hook"* || "${*}" == *"--mode=hook"* ]]; then
  # check if stdin has data (fd 0 is not a terminal)
  if [ ! -t 0 ]; then
    PAYLOAD="$(cat)"
  fi
fi

exec node -e "import('rhachet-roles-bhrain/cli/memory').then(m => m.memoryGuard())" -- "$@" <<<"$PAYLOAD"
