#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for route.review skill
#
# .why = enables foremen to scan stone artifacts and review in editor
#        shows treestruct with change stats and auto-opens single file
#
# usage:
#   ./route.review.sh                     # review next stone
#   ./route.review.sh --open vim          # open artifact in vim
#   ./route.review.sh --stone 3.blueprint # review specific stone
#   ./route.review.sh --route .behavior/my-feature
#
# options:
#   --stone   stone name to review (defaults to next blocked on approval)
#   --route   path to route directory (uses bound route if absent)
#   --open    editor to open artifact in (vim, code, nvim, etc.)
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/route').then(m => m.routeReview())" -- "$@"
