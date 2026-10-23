#!/usr/bin/env bash
######################################################################
# .what = entrypoint for the acceptance-suite benchmark
#
# .why  = a speedup with no measured before-and-after is a guess dressed
#         as a tune. this names the instrument so the measurement is
#         reproducible and its rule is written down, rather than
#         re-derived at the prompt each time.
#
# usage:
#   rhx bench.acceptance run     --label before
#   rhx bench.acceptance run     --label after --no-build
#   rhx bench.acceptance gate    --label bar
#   rhx bench.acceptance report  --label before
#   rhx bench.acceptance compare --before before --after after
#
# guarantee:
#   - run/gate/report exit 0 (they measure, they do not gate)
#   - compare exits 2 if a case that PASSED before no longer passes
#
# .scope = a repo-local instrument, never published (package.json files
#          holds /dist only). run and gate each spawn the whole acceptance
#          suite, so no acceptance case pins their output — it would
#          recurse. the hermetic paths (--help, an unknown command, report
#          of an absent label, compare clean and compare regressed) are
#          snapped in blackbox/bench.acceptance.acceptance
######################################################################
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$SCRIPT_DIR/bench.acceptance.js" "$@"
