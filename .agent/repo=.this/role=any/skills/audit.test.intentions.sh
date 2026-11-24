#!/usr/bin/env bash
######################################################################
# .what = audit whether a branch kept the intent of every test it
#         touched: skips added, test blocks and assertions lost, and
#         the tokens that changed in each modified suite
#
# .why  = a repair that edits tests can quietly weaken them. a line
#         count or an eyeball read misses a changed expected value
#         behind a rewrap; a token compare does not
#
# usage:
#   rhx audit.test.intentions                    # base = merge-base of origin/main and HEAD
#   rhx audit.test.intentions --base main        # another base ref
#   rhx audit.test.intentions --help
#
# guarantee:
#   - read-only: reads git objects, writes naught
#   - compares the merge-base to HEAD, over *.test.ts only
#   - exit 0 = intent held · 2 = a skip added, or test blocks or
#     assertions lost (each named) · 1 = git fault
######################################################################
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$SKILL_DIR/audit.test.intentions.js" "$@"
