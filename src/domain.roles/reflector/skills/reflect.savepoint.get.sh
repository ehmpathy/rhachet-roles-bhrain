#!/usr/bin/env bash
######################################################################
# .what = list or inspect savepoints
#
# .why  = browse captured code states for correlation
#
# usage:
#   reflect.savepoint.get.sh                         # list all savepoints
#   reflect.savepoint.get.sh --at 2026-03-12.143052  # inspect specific savepoint
#
# guarantee:
#   - lists savepoints with stats (count, size, hash)
#   - shows patch details for specific savepoint if --at provided
#   - outputs owl-vibed status
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/reflect').then(m => m.reflectSavepointGet())" -- "$@"
