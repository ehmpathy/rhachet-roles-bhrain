#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for the librarian brief.min.moveout skill — move the argument-only
#         `## .why…` sections out of a glob set of `.md.min` briefs
#
# .why = `rule.prefer.rules-that-refout` says a rule boots its cue and refs out its argument,
#        and a `.why` section is the case FOR a cue, read once, by a reader who disputes it. a
#        min that keeps one pays it on every boot. the `.md` beside each min already holds the
#        full argument, so the section is moved, never lost. by hand, the move across many mins
#        drops a cue or misses a section; one walk names each section it moves
#
# usage:
#   ./brief.min.moveout.sh --glob 'src/domain.roles/learner/briefs/rule.*.md.min'
#   ./brief.min.moveout.sh --glob '...' --mode apply
#   ./brief.min.moveout.sh --help
#
# flags:
#   --glob <pattern>  a set of mins; repeat it to union several sets
#   --mode plan|apply plan (default) lists each section; apply rewrites each min
#
# guarantee:
#   - a section that holds any cue line, or any body line the `.md` lacks, is HELD, never cut
#   - a symlinked min is skipped (its source is edited where it lives), and so is a min with no `.md`
#   - a `#` inside a fence never ends a section; the `.md` is never written
#
# exit codes:
#   0 = success
#   2 = bad input: no --glob, an unknown flag or --mode, or a glob that names no file
######################################################################
set -euo pipefail

# the .then awaits the command; the .catch surfaces any rejection loud with a clean message
# and a non-zero exit, rather than lean on node's default unhandled-rejection dump
exec node -e "import('rhachet-roles-bhrain/cli/librarian').then(m => m.briefMinMoveout()).catch((e) => { console.error(e?.message ?? e); process.exit(1); })" -- "$@"
