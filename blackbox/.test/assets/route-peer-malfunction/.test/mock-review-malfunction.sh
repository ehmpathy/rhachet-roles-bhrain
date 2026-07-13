#!/usr/bin/env bash
######################################################################
# .what = mock peer review that emits NO numeric counts
# .why = an unreadable verdict is a malfunction — the guard cannot infer
#        zero. the malfunction halt must take priority over the
#        contemplation gate: a driver cannot contemplate an unparseable
#        critique (design-note B5)
######################################################################
set -euo pipefail

echo "looks solid to me, ship it"
