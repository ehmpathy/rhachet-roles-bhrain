#!/usr/bin/env bash
######################################################################
# .what = pad the numeric ordinal of each `case=` entry of one
#         inventory dir to a fixed width (default 3), in the entry
#         names, the summary's table rows, and each entry's H1 line
#
# .why  = an unpadded ordinal sorts F10 before F9; a name sort must
#         hold the sequence (librarian
#         rule.forbid.itemization-without-coordinates)
#
# usage:
#   rhx inventory.pad --dir .behavior/<route>/.seeds
#   rhx inventory.pad --dir .behavior/<route>/.seeds --mode apply
#
# guarantee:
#   - plan by default; apply renames and rewrites
#   - never rewrites an entry body, so a verbatim .said is untouched
#   - idempotent; exit 2 on bad input
######################################################################
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$SKILL_DIR/inventory.pad.js" "$@"
