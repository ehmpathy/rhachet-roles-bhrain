#!/usr/bin/env bash
######################################################################
# .what = decode each time-of-day a text holds into its utc instant:
#         unix epoch seconds or milliseconds, a compact stamp, an iso
#         stamp
#
# .why  = an epoch number or a compact stamp hides its time of day in
#         plain digits, so a glance cannot say whether a value leaks
#         one. a decode turns the guess into a read
#
# usage:
#   rhx timestamps.decode --value 'ca-<epoch seconds>'
#   rhx timestamps.decode --value '<a>' --value '<b>'
#   printf '%s' "$text" | rhx timestamps.decode --value @stdin
#
# guarantee:
#   - read-only; prints to stdout, writes no file
#   - an epoch counts only inside 2001..2039, with no digit beside it
#   - a value with no stamp says so; it is not an error
#   - exit 2 on bad input
######################################################################
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$SKILL_DIR/timestamps.decode.js" "$@"
