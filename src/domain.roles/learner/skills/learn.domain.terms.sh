#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for the learn.domain.terms skill
#
# .why = tends the repo's domain.terms glossary. two faces, one skill:
#        - --when hook.onStop : staleness check for the onStop sweephook;
#          exit 2 to hold the stop when the distillation is stale, else exit 0.
#          read-only — it never writes.
#        - (no --when) : the clone's reflect-and-distill guide; findserts the
#          glossary scaffold, then prints how to distill.
#
# usage:
#   ./learn.domain.terms.sh --when hook.onStop   # onStop staleness nudge
#   ./learn.domain.terms.sh                       # clone reflect-and-distill guide
#
# exit codes:
#   0 = fresh (hook) or guide printed (clone)
#   2 = stale (hook) — hold the stop open (never a write)
######################################################################
set -euo pipefail

# the .then chains (awaits) learnDomainTerms — its awaited fs io keeps the event
# loop alive to completion. the .catch surfaces any rejection loud + sets a
# non-zero exit, rather than lean on node's default unhandled-rejection dump
# (which prints a machine-specific stack). print the clean message only, so the
# error is legible + deterministic (fail-loud, never fail-hide)
exec node -e "import('rhachet-roles-bhrain/cli/learn').then(m => m.learnDomainTerms()).catch((e) => { console.error(e?.message ?? e); process.exit(1); })" -- "$@"
