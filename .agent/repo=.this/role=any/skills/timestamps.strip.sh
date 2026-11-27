#!/usr/bin/env bash
######################################################################
# .what = strip every time-of-day from the text files this branch
#         changed (committed vs base, staged, unstaged, untracked):
#         a stamp keeps its date, a time-only id goes, a bare clock is
#         cut
#
# .why  = a timestamp in a tracked file is a privacy leak. a digit
#         masked as `x` (`T<hh>-<m>x-<ss>-<ms>Z`) still states the hour
#
# usage:
#   rhx timestamps.strip                      # plan
#   rhx timestamps.strip --mode apply         # write
#   rhx timestamps.strip --base origin/main   # the base to diff against
#
# guarantee:
#   - plan by default; idempotent
#   - code files (.ts, .js, .sh) are listed, never written
#   - exit 2 on bad input
######################################################################
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$SKILL_DIR/timestamps.strip.js" "$@"
