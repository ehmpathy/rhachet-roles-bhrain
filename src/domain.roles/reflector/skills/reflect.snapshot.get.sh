#!/usr/bin/env bash
######################################################################
# .what = list or inspect snapshots
#
# .why  = browse captured experiences for reflection
#
# usage:
#   reflect.snapshot.get.sh                      # list all snapshots
#   reflect.snapshot.get.sh --at 2026-03-12.143052   # inspect specific snapshot
#
# guarantee:
#   - lists snapshots with stats (count, size, episodes)
#   - shows details for specific snapshot if --at provided
#   - outputs owl-vibed status
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/reflect').then(m => m.reflectSnapshotGet())" -- "$@"
