#!/usr/bin/env bash
######################################################################
# .what = mock peer review that emits NO numeric counts
# .why = an unreadable verdict is a malfunction — the guard cannot infer
#        zero. paired with a reviewer that holds a blocker, this proves
#        the malfunction halt outranks the contemplation gate (B10; the
#        contemplation prompt is LAST)
######################################################################
set -euo pipefail

echo "looks solid to me, ship it"
