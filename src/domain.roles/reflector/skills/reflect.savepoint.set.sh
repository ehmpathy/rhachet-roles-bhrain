#!/usr/bin/env bash
######################################################################
# .what = capture code state savepoint (git diff patches)
#
# .why  = correlate transcript with code changes
#
# usage:
#   reflect.savepoint.set.sh                  # plan mode (preview)
#   reflect.savepoint.set.sh --mode apply     # apply mode (write patches)
#
# guarantee:
#   - captures staged.patch (git diff --staged)
#   - captures unstaged.patch (git diff)
#   - computes hash for deduplication
#   - outputs owl-vibed status
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/reflect').then(m => m.reflectSavepointSet())" -- "$@"
