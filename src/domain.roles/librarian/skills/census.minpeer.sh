#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for the librarian census.minpeer skill — the lines of each
#         `X.md.min` in a glob set that the `X.md` beside it lacks, verbatim after trim
#
# .why = a min is the say tier and its `.md` is the ref tier. a line may leave a min only if
#        its `.md` still carries it, and a cue kept in a min drifts silently if its `.md`
#        changes and the min does not. both checks reduce to one question per line: is this
#        line in the `.md`? the answer is a set membership, so it is computed, never guessed
#
# usage:
#   ./census.minpeer.sh --glob 'src/domain.roles/learner/briefs/*.md.min'
#   ./census.minpeer.sh --glob '...' --files   # one row per min: absent / total
#   ./census.minpeer.sh --glob '...' --emit    # one row per absent line, for a diff
#   ./census.minpeer.sh --help
#
# flags:
#   --glob <pattern>  a set of `.md.min` files to check; repeat it to union several sets
#   --files           add one row per min (absent lines / total, or `no .md peer`)
#   --emit            print every absent line as `<min>\t<line>`, no report — for a diff
#
# exit codes:
#   0 = a report (it never gates)
#   2 = bad input: no --glob, an unknown flag, or a glob that names no file
######################################################################
set -euo pipefail

# the .then awaits the command; the .catch surfaces any rejection loud with a clean message
# and a non-zero exit, rather than lean on node's default unhandled-rejection dump
exec node -e "import('rhachet-roles-bhrain/cli/librarian').then(m => m.censusMinpeer()).catch((e) => { console.error(e?.message ?? e); process.exit(1); })" -- "$@"
