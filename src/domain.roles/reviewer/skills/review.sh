#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for code review skill
#
# .why = enables direct invocation from CLI, CI/CD, git hooks
#        via location-independent package import
#
# usage:
#   ./review.sh --rules "rules/*.md" --paths-with "src/**/*.ts"
#   ./review.sh --help                # the AUTHORITATIVE flag list
#
# options:
#   this header lists no flags, deliberately: `--help` states all of them and
#   sits beside the parser it describes, so a list here would be a third copy
#   at the greatest distance from the contract. the two copies that remain are
#   both in `review.ts`.
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/review').then(m => m.review())" -- "$@"
