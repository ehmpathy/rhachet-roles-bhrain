#!/usr/bin/env bash
######################################################################
# .what = mock reviewer that exits NON-ZERO (a real failure, not odd prose)
# .why = proves the crash path through the real CLI: a non-zero exit is NEVER
#        rescued by the sub-brain fallback (the exit-0 gate skips it), so the
#        reviewer is a malfunction, the stone blocks, and NO `tallied by` marker
#        appears. covers blackbox usecase.4 at the acceptance level.
######################################################################
set -euo pipefail

echo "## review"
echo ""
echo "the reviewer process hit an error before it could produce a verdict."
exit 1
