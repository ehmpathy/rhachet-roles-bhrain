#!/usr/bin/env bash
######################################################################
# .what = persist a goal — flags one-by-one (recommended)
#
# .why = every ask deserves a promise; every promise deserves a goal
#
# usage (recommended — flags one-by-one):
#   rhx goal.memory.set \
#     --slug fix-login-bug \
#     --why.ask "fix the login bug" \
#     --why.purpose "users cannot access the app" \
#     --why.benefit "users can log in again" \
#     --what.outcome "login works without errors" \
#     --how.task "debug auth flow, fix the issue" \
#     --how.gate "login test passes" \
#     --status.choice inflight \
#     --status.reason "start now" \
#     --source peer:human
#
# example: status update (partial)
#   rhx goal.memory.set \
#     --slug fix-login-bug \
#     --status.choice fulfilled \
#     --status.reason "fixed in commit abc123"
#
# required fields:
#   --why.ask        the original ask from human
#   --why.purpose    why this matters
#   --why.benefit    what success enables
#   --what.outcome   expected result
#   --how.task       work to be done
#   --how.gate       success criteria
#
# optional fields:
#   --slug           goal identifier (auto-generated if absent)
#   --status.choice  incomplete | blocked | enqueued | inflight | fulfilled
#   --status.reason  reason for current status
#   --covers         comma-separated ask hashes
#   --source         peer:human | peer:system
#   --scope          route | repo (automatic — rarely needed)
#
# note: scope is automatic based on route bind state.
#       if bound to a route, scope is route. otherwise, scope is repo.
#       explicit --scope repo while bound to route will fail-fast.
#
# note: stdin yaml is allowed but not recommended.
#       flags one-by-one increases focus on each component.
#
# help: rhx goal.memory.set --help
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/goal').then(m => m.goalMemorySet())" -- "$@"
