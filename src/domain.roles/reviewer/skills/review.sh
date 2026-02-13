#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for code review skill
#
# .why = enables direct invocation from CLI, CI/CD, git hooks
#        via location-independent package import
#
# usage:
#   ./review.sh --rules "rules/*.md" --paths "src/*.ts" --output "review.md" --mode hard
#
# options:
#   --rules   glob pattern(s) for rule files (comma-separated)
#   --diffs   diff range: since-main, since-commit, since-staged
#   --paths   glob pattern(s) for target files (comma-separated)
#   --output  output file path for the review
#   --mode    review mode: soft (paths only) or hard (full content)
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli').then(m => m.cli.review())" -- "$@"
