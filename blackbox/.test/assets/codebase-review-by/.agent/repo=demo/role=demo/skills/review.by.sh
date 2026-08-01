#!/usr/bin/env bash
######################################################################
# .what = the demo role's OWN review.by wrapper
#
# .why = a role ships its own thin review.by that bakes in its role and
#        delegates to the bhrain base engine. `rhx review.by --role demo`
#        resolves THIS wrapper, which calls the base with the demo role
#        baked in. the base owns the orchestration; demo owns only its
#        rubrics.yml + this one-line delegation.
#
# usage:
#   ./review.by.sh --paths "src/**/*.ts"
#   ./review.by.sh --for demo-arrow-only
######################################################################
set -euo pipefail

# delegate to the bhrain base engine, with demo's role baked in.
#
# rhachet forwards --repo/--role/--skill into THIS wrapper's argv, so "$@" may
# carry a dispatch --role demo + --skill review.by alongside the user's scope
# flags. we pass "$@" through after our own `-- --role demo`: the base tolerates
# the forwarded --skill/--repo and resolves --role demo last-wins, so the doubled
# dispatch noise is harmless and only demo's rubrics run.
exec rhx review.by --repo bhrain --role reviewer -- --role demo "$@"
