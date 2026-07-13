#!/usr/bin/env bash
######################################################################
# .what = mock reviewer that emits numeric counts (deterministic path)
# .why = the deterministic parser reads these verbatim; NO sub-brain
#        fallback runs, so this reviewer shows no `tallied by` marker.
######################################################################
set -euo pipefail

echo "## review"
echo ""
echo "the change looks solid. two small style points worth a cleanup."
echo ""
echo "0 blockers"
echo "2 nitpicks"
