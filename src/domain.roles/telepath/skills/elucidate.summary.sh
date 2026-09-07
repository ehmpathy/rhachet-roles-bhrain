#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for the elucidate.summary skill (telepath Stop hook)
#
# .why = on stop, reminds the brain to elucidate + condense its summary.
#
#        captures stdin into RHACHET_STDIN to work around node -e stdin
#        inheritance in the claude code harness (same pattern as memory.guard
#        and route.bounce). the Stop payload carries `stop_hook_active`, which
#        is the platform's own loop guard — so the reminder fires once per turn
#        with no state file and no clock.
#
# usage:
#   ./elucidate.summary.sh --when hook.onStop   # hook face: reminder, exit 2
#   ./elucidate.summary.sh                      # by hand: the same reminder, exit 0
#   ./elucidate.summary.sh --help               # usage
#
# --when values: hook.onStop (only). a wrong value exits 2 and is never silent —
#   the value is boundary-qualified (`onStop`, of WHAT? of a hook), which is the
#   same form the learner's peer skill already uses.
#
# exit codes:
#   0 = by hand, or already a hook continuation, or an unreadable payload
#   2 = the reminder (holds the stop open), or an invalid --when
######################################################################
set -euo pipefail

# capture stdin in bash before exec (node -e has issues with stdin inheritance).
# only read stdin in the hook face — the by-hand face takes no payload
if [[ "${*}" == *"--when hook.onStop"* || "${*}" == *"--when=hook.onStop"* ]]; then
  # check if stdin has data (fd 0 is not a terminal)
  if [ ! -t 0 ]; then
    export RHACHET_STDIN="$(cat)"
  fi
fi

exec node -e "import('rhachet-roles-bhrain/cli/telepath').then(m => m.elucidateSummary())" -- "$@"
