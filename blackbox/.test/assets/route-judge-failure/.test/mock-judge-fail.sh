#!/usr/bin/env bash
######################################################################
# .what = mock judge that fails without proper passed: false output
# .why = tests that failed judges show clear errors and don't cache
######################################################################
set -euo pipefail

# simulates a judge command that crashes/fails without
# proper passed: true/false metadata

echo "error: evaluation crashed unexpectedly"
exit 1
