#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for the review._.cost skill
#
# .why = reports what review actually cost, at the breadth you ask for,
#        from the log artifacts `rhx review` already writes.
#
#        ONE command over the `breadth` axis, never one command per
#        axis position. two commands that differ only in one axis
#        position ARE the axis, spelled as a namespace — and the proof
#        the old set was wrong is that the axis has THREE positions
#        while the commands expressed two. `run` had no surface at all.
#
#        a cost no one can read is a cost no one can cut. the review
#        ladder multiplies three deep (stones x rounds x reviewers).
#
# usage:
#   ./review._.cost.sh --of run              # one invocation: cost + composition
#   ./review._.cost.sh --of tree             # this worktree's review history
#   ./review._.cost.sh --of grove            # every tree on this machine
#   ./review._.cost.sh --of tree --at /path  # another tree's logs
#   ./review._.cost.sh --of grove --limit 25 # more rows per axis
#   ./review._.cost.sh --of run --json       # json instead of a tree
#   ./review._.cost.sh --help                # the AUTHORITATIVE flag list
#
# options:
#   none listed here, deliberately. `--help` states every flag and its
#   limits, beside the parser it describes, and is snapshot-clamped. a
#   list here would be a second copy at the greatest distance from the
#   contract.
#
# guarantee:
#   - never reads metrics.expected.json, so no estimate can enter a
#     reported figure (`--help` lists every file it does read)
#   - an unrecorded figure renders as absent, never as $0.00; a refusal
#     renders $0, because nil cost is a FACT there
#   - exit 2 when --of is absent or unknown, with the valid set named
#   - exit 2 when the corpus is empty, with a hint that names the fix
#
# .note = which breadths answer "which input bought this?" is declared in
#         `--help` alone, which is snapshot-clamped, and this file
#         deliberately makes no claim about it. a paraphrase
#         here would be a second copy to repair, and a driver reads this
#         file first, so a stale copy here costs the most.
#
# .note = review logs are git-ignored ephemera, local to the machine
#         that ran the review. price where the reviews ran.
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/review._.cost').then(m => m.reviewCost())" -- "$@"
