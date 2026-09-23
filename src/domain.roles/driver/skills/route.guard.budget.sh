#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for route.guard.budget skill
#
# .why = extend a peer reviewer budget past its bound, where the round was EARNED:
#        - the grant is REFUSED by default — the budget is a bound, never a free lever
#        - it is lifted by a live URGENT concession on a reviewer that has run dry
#        - enables route continuation without approval bypass
#
# .note = this command checks NO actor, so a human is refused here exactly as a driver is. the
#         human path is a different command — `route.mutate grant allow` mints the privilege flag
#         a guard edit needs (raised i002/r009 n1, on the identical claim in the --help text).
#
# usage:
#   ./route.guard.budget.sh --for review --add 2 --stone 1.vision            # extend the LATEST level by 2
#   ./route.guard.budget.sh --for review --add 2 --peer cheapo --stone 1.vision  # extend specific peer
#   ./route.guard.budget.sh --for review --add 2 --stone 1.vision --route .behavior/my-feature
#
# options:
#   --for     resource type: "review" (required)
#   --add     number of budget rounds to add (required)
#   --peer    peer reviewer slug to extend (default: the latest level in play)
#   --stone   stone name with guard to update (required) — must name exactly ONE stone
#   --level   review level to extend — reach a LOWER level only when you name it
#   --route   path to route directory (default: auto-detect from branch)
#   --help    show the full help on stdout, exit 0
#
# exit codes:
#   0 = success — the budget was raised, and stdout names the warrant that earned it
#   1 = error — a malfunction; the cli rethrows a non-BadRequest throw uncaught
#   2 = constraint — a malformed invocation, OR a REFUSED grant. a refusal is actionable:
#       converge with the reviewer, grade a concern urgent, or re-scope --stone to one stone.
#       ⇒ never a transient fault, so a bare retry refuses identically. stderr names what to run
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/route').then(m => m.routeGuardBudget())" -- "$@"
