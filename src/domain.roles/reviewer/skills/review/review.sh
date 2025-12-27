#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for code review skill
#
# .why = enables direct invocation from CLI, CI/CD, git hooks
#
# usage:
#   ./review.sh --rules "rules/*.md" --paths "src/*.ts" --output "review.md" --mode hard
#
# options:
#   --rules   glob pattern(s) for rule files (comma-separated)
#   --diffs   diff range: uptil-main, uptil-commit, uptil-staged
#   --paths   glob pattern(s) for target files (comma-separated)
#   --output  output file path for the review
#   --mode    review mode: soft (paths only) or hard (full content)
######################################################################
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

exec npx tsx "$SCRIPT_DIR/review.ts" "$@"
