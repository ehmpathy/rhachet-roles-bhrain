#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for the librarian census.cues skill — the cue share of a glob set
#         of briefs: per file, the chars that are CUE lines and the chars that are ARGUMENT lines
#
# .why = `rule.prefer.rules-that-refout` says a rule keeps its cue at say and refs out its
#        argument. a boot budget set without that split is a guess at how far a cue-only rewrite
#        can shrink a min, and a cue-only rewrite of many files by hand can drop a row silently.
#        `--emit` lists every cue line so a census taken before the rewrite and one taken after
#        can be diffed, and a dropped line is named
#
# usage:
#   ./census.cues.sh --glob 'src/domain.roles/learner/briefs/*.md.min'
#   ./census.cues.sh --glob '...' --files    # one row per file
#   ./census.cues.sh --glob '...' --emit     # one row per cue line, for a before/after diff
#   ./census.cues.sh --help
#
# flags:
#   --glob <pattern>  a set of briefs to census; repeat it to union several sets
#   --files           add one row per file (its cue share and size), above the total
#   --emit            print every cue line as `<file>\t<line>`, no report
#
# exit codes:
#   0 = a report (it never gates)
#   2 = bad input: no --glob, an unknown flag, or a glob that names no file
######################################################################
set -euo pipefail

# the .then awaits the command; the .catch surfaces any rejection loud with a clean message
# and a non-zero exit, rather than lean on node's default unhandled-rejection dump
exec node -e "import('rhachet-roles-bhrain/cli/librarian').then(m => m.censusCues()).catch((e) => { console.error(e?.message ?? e); process.exit(1); })" -- "$@"
