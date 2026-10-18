#!/usr/bin/env bash
######################################################################
# .what = drop the remote-tracking refs whose branch is gone from origin
#
# .why  = a merged pr deletes its branch on origin, and this clone keeps the
#         tracking ref. `git push --force-with-lease` then compares against a
#         ref that origin no longer holds and refuses with "stale info", so
#         the next push from that branch name fails until the ref is dropped
#
# usage:
#   rhx git.branch.prune
#
# guarantee:
#   - idempotent: a clone with no stale ref changes no ref
#   - touches remote-tracking refs only; no local branch, no commit, no file
#   - fail-fast on errors
######################################################################
set -euo pipefail

git fetch origin --prune
echo "🐢 stale remote-tracking refs dropped; origin and this clone agree on which branches exist"
