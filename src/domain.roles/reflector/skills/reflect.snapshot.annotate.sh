#!/usr/bin/env bash
######################################################################
# .what = annotate the timeline with a label
#
# .why  = mark defects, lessons, or discoveries for later reflection
#
# usage:
#   reflect.snapshot.annotate.sh "detected a defect: model hallucinated"
#   reflect.snapshot.annotate.sh "corrected defect: added validation"
#
# guarantee:
#   - creates timestamped annotation file
#   - annotation text is required
#   - outputs owl-vibed status
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/reflect').then(m => m.reflectSnapshotAnnotate())" -- "$@"
