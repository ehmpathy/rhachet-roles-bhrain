#!/usr/bin/env bash
######################################################################
# .what = the learner's own review.by wrapper
#
# .why = the learner ships its own thin review.by that bakes in its role
#        and delegates to the bhrain reviewer's base engine. so
#        `rhx review.by --role learner` resolves THIS wrapper, which
#        hands off to the base — the base owns the orchestration; the
#        learner owns only its rubrics.yml (term-application +
#        term-aggregation) and this one delegation.
#
# usage:
#   rhx review.by --role learner --paths 'src/**/*.ts'
#   rhx review.by --role learner --for term-application --paths 'src/**/*.ts'
#   rhx review.by --role learner --for term-aggregation --paths 'src/**/*.ts'
######################################################################
set -euo pipefail

# delegate to the bhrain reviewer base engine via its node entry directly.
#
# rhachet already dispatched THIS wrapper via `rhx review.by --role learner`, so it
# forwards `--role learner` (plus any other flags) into "$@". we hand that straight to
# the base cli through node — the SAME node entry the base skill uses — rather than a
# second `rhx` dispatch. one dispatch, one banner: no doubled `🪨 run solid skill`
# header, and no doubled `--role`.
exec node -e "import('rhachet-roles-bhrain/cli/review.by').then(m => m.reviewBy())" -- "$@"
