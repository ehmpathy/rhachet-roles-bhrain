#!/usr/bin/env bash
######################################################################
# .what = list every identity leak in the text files this branch
#         changed (committed vs base, staged, unstaged, untracked):
#         emails, home dirs, session transcript paths, the host user,
#         and any extra names passed via --also
#
# .why  = a tracked file ships to every clone and fork. a home dir or
#         an email names a person; a transcript path names a session
#
# usage:
#   rhx doxxers.scan                            # scan this branch
#   rhx doxxers.scan --also 'name1|name2'       # extra names, a regex
#   rhx doxxers.scan --base origin/main         # the base to diff against
#
# guarantee:
#   - read only; it never writes
#   - names passed via --also stay out of every file; this skill holds none
#   - exit 0 when clean, exit 2 when any leak is found or on bad input
######################################################################
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$SKILL_DIR/doxxers.scan.js" "$@"
