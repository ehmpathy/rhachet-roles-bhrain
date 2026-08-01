#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for the review.by skill
#
# .why = runs a role's standard review set (its rubrics), a thin wrap
#        over the review engine — one command instead of many. bhrain
#        owns the orchestration; each role owns only its rubrics.yml.
#
# usage:
#   ./review.by.sh --role mechanic --paths "src/**/*.ts"
#   ./review.by.sh --role mechanic --for mech-failhides
#
# options:
#   --role   role slug whose rubrics.yml to run (required)
#   --for    run a single rubric by slug (default: all)
#   --paths  target file globs (forwarded to review)
#   --diffs  diff scope (forwarded to review)
#   --mode   review focus: push or pull (forwarded)
#   --brain  brain override for evals (forwarded)
#   --output output dir (default: .reviews/by=$role/)
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/review.by').then(m => m.reviewBy())" -- "$@"
