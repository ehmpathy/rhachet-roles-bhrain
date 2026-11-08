#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for the learn.terms.hook skill
#
# .why = the learner's onStop term-distill nudge, as an opt-in toggle:
#        a repo that wants it turns it on; every other repo pays no cost.
#        default disabled.
#
# usage:
#   ./learn.terms.hook.sh get       # is this repo's term hook on?
#   ./learn.terms.hook.sh enable    # add the onStop term hook
#   ./learn.terms.hook.sh disable   # remove it
#   ./learn.terms.hook.sh --help
#
# guarantee:
#   - get never writes
#   - enable and disable are idempotent, and write under rhachet's own
#     lock on the settings file, via temp + rename
#   - a link or unparseable settings file is refused, exit 2, no write
#
# exit codes:
#   0 = success, a no-op, or --help
#   1 = a malfunction, under a `💥 MalfunctionError:` header with its stack
#   2 = a refusal the caller must fix (bad verb, a target it will not touch)
######################################################################
set -euo pipefail

# a refusal is rendered and exits 2 inside the cli; aught that reaches this catch is a
# malfunction, so it prints under the qualified header with its stack beneath for the debug,
# and sets the exit code rather than exit at once, so a piped stderr drains whole
exec node -e "import('rhachet-roles-bhrain/cli/learn.terms.hook').then(m => m.learnTermsHook()).catch((e) => { console.error('💥 MalfunctionError: ' + (e?.message ?? String(e))); if (e?.stack) console.error(String(e.stack).split('\n').map((line) => '   ' + line).join('\n')); process.exitCode = 1; })" -- "$@"
