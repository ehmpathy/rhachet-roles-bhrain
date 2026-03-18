#!/usr/bin/env bash
######################################################################
# .what = capture experience snapshot (transcript + savepoints)
#
# .why  = preserve sessions for reflection and eval creation
#
# usage:
#   reflect.snapshot.capture.sh                  # capture snapshot
#
# guarantee:
#   - bundles transcript + savepoints + annotations
#   - creates zip at ~/.rhachet/storage/.../snapshots/...
#   - outputs owl-vibed status
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/reflect').then(m => m.reflectSnapshotCapture())" -- "$@"
