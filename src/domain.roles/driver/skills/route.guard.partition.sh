#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for route.guard.partition skill
#
# .why = declare, once per route, how its peer reviews split when they
#        overflow — so every reviewer reuses one set, and a set that
#        leaves a changed file uncovered refuses before it is written
#
# usage:
#   ./route.guard.partition.sh --for review --peer @all \
#     --partition 'review=src/review/**,.behavior/my-feature/**' \
#     --partition 'route=src/route/**,.behavior/my-feature/**'          # plan (default)
#   ./route.guard.partition.sh ... --mode apply                          # write it
#   ./route.guard.partition.sh --for review --peer @all \
#     --claim 'src/new/**' --into review                                 # grow one partition
#   ./route.guard.partition.sh --for review --peer @all                  # show + check what is declared
#   ./route.guard.partition.sh --for review --peer @all --stone <stone>  # read a stone's coverage, pre-arrival
#   ./route.guard.partition.sh --for review --peer @all --stone <stone> --full  # ...every path listed
#   ./route.guard.partition.sh --for review --peer @all --partition none # clear the scope
#   ./route.guard.partition.sh --help                                    # every flag
#
# guarantee:
#   - the --partition flags together are the WHOLE set for the scope
#   - plan by default; --mode apply writes $route/.route/partitions.json
#   - exit 2 before any write if a changed file sits in no partition,
#     or a partition lacks the route spec
#   - with no --partition, shows the held set AND checks it against the
#     branch: on a gap (a changed file in no partition), prints a
#     paste-ready repair command and exits 2; else exits 0
#   - --peer @all --stone <stone> with no --partition is a READ: the
#     coverage of every scope that stone's reviewers read, through the
#     same check its entrance gate runs — no review, no brain, no write
#   - a coverage read shows the head of each per-file list and names the
#     rest as "… +N more"; --full lists every path
#   - --claim <glob> --into <slug> grows one held partition and writes
#     the whole set back; an unknown slug refuses, the held slugs listed
#   - a repair prints the smallest command: one --claim per partition
#     that fits, else a new partition named for its domain — never rest
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/route').then(m => m.routeGuardPartition())" -- "$@"
