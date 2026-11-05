#!/usr/bin/env bash
######################################################################
# .what = report where a claude transcript spent its tokens
#
# .why  = clones re-pay large contexts every call; this names what the
#         context holds and what each part cost to keep, so a cut can be
#         ranked by what it saves
#
# usage:
#   rhx reflect.on.token.spend                          # this session
#   rhx reflect.on.token.spend --from <path>.jsonl      # one transcript
#   rhx reflect.on.token.spend --from <uuid>            # a session id
#   rhx reflect.on.token.spend --from '<glob>'          # a corpus
#
# guarantee:
#   - read-only; writes no file
#   - exit 0 = report, exit 2 = constraint, exit 1 = malfunction
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/reflect.on.token.spend').then(m => m.reflectOnTokenSpend())" -- "$@"
