#!/usr/bin/env bash
######################################################################
# .what = rename every bracketed brief file to coordinate form, and
#         rewrite each citation of it
#
# .why  = a `[` or `]` in a filename breaks a glob, a boot.yml entry,
#         and the shell (rule.forbid.brackets-in-filenames, librarian)
#
# usage:
#   rhx unbracket.briefs                  # plan: the map + every citer
#   rhx unbracket.briefs --mode apply     # rewrite citations, then rename
#
# guarantee:
#   - plan mode by default; no file moves without --mode apply
#   - exit 2 before any write, if a target name already exists
#   - never touches .route/, .behavior/, or a symlink
######################################################################
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$SKILL_DIR/unbracket.briefs.js" "$@"
