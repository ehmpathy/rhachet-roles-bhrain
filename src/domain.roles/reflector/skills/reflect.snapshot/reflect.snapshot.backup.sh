#!/usr/bin/env bash
######################################################################
# .what = backup snapshots to s3
#
# .why  = enable durability and cross-machine access
#
# usage:
#   reflect.snapshot.backup.sh --into s3://my-reflection-archive
#
# guarantee:
#   - syncs all snapshots to s3 bucket
#   - uses aws cli (must be configured)
#   - outputs owl-vibed status
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/reflect').then(m => m.reflectSnapshotBackup())" -- "$@"
