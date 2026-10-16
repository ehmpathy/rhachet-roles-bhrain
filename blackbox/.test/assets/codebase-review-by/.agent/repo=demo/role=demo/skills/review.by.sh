#!/usr/bin/env bash
######################################################################
# .what = the demo role's OWN review.by wrapper
#
# .why = a role ships its own thin review.by that delegates to the bhrain
#        base engine. `rhx review.by --role demo` resolves THIS wrapper,
#        which hands its argv straight to the base cli. the base owns the
#        orchestration; demo owns only its rubrics.yml + this one line.
#
# usage:
#   ./review.by.sh --role demo --paths "src/**/*.ts"
#   ./review.by.sh --role demo --for demo-arrow-only
######################################################################
set -euo pipefail

# delegate to the bhrain base engine, node-direct — the one shape
# rule.require.review-by-wrapper-pattern prescribes.
#
# rhachet forwards --role demo (and --skill review.by) into THIS wrapper's
# argv, so "$@" already names the role whose rubrics run; the wrapper adds
# no --role of its own. a second `rhx` dispatch here would print a second
# `🪨 run solid skill` banner, so the base cli runs inside this one dispatch.
exec node -e "import('rhachet-roles-bhrain/cli/review.by').then(m => m.reviewBy())" -- "$@"
