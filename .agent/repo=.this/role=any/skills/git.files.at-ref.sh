#!/usr/bin/env bash
######################################################################
# .what = set down the tracked files a pathspec names, as they stand
#         at a git ref, under .temp/ref=<slug>/
#
# .why  = a before/after census (e.g. cue counts on main vs head) needs
#         the old files on disk, where any glob-driven skill can read them
#
# usage:
#   rhx git.files.at-ref --ref origin/main --path src/domain.roles/learner/briefs
#   rhx git.files.at-ref --ref origin/main --path <spec> --path <spec>
#
# guarantee:
#   - writes only under .temp/ref=<slug>/, emptied first (a rerun converges)
#   - skips a symlink at the ref
#   - exit 2 on bad input: no --ref, no --path, an unknown ref, no match
######################################################################
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$SKILL_DIR/git.files.at-ref.js" "$@"
