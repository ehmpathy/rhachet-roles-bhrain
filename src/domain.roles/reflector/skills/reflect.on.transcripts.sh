#!/usr/bin/env bash
######################################################################
# .what = list each clone session of this repo, newest human prompt
#         first, with its actor, size, activity, and resume line
#
# .why  = several clones work one tree under distinct actors, and a
#         fork can hold one session id under two; this finds the
#         session a human spoke to, so they can resume it
#
# usage:
#   rhx reflect.on.transcripts                       # this tree
#   rhx reflect.on.transcripts --all                 # every tree
#   rhx reflect.on.transcripts --limit 3
#   rhx reflect.on.transcripts --session 28230521
#
# guarantee:
#   - read-only; writes no file
#   - exit 0 = report, exit 2 = constraint
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/reflect.on.transcripts').then(m => m.reflectOnTranscripts())" -- "$@"
