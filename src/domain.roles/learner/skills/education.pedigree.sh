#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for the education.pedigree skill
#
# .why = the record of education: set stamps a graduated pursuit into
#        its role's briefs; get shows what each role was taught.
#
# usage:
#   ./education.pedigree.sh get
#   ./education.pedigree.sh get --for mechanic
#   ./education.pedigree.sh set                 # from a bound pursuit
#   ./education.pedigree.sh set --from .route/v2026_11_23.education.pursuit.mechanic.reliable-writes
#   ./education.pedigree.sh --help
#
# guarantee:
#   - get never writes
#   - set is an upsert keyed on date + slug; a re-stamp converges
#   - set refuses until every course of the pursuit has exited
#
# exit codes:
#   0 = success or --help
#   1 = a malfunction, under a `💥 MalfunctionError:` header with its stack
#   2 = a refusal the caller must fix
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/education.pedigree').then(m => m.educationPedigree()).catch((e) => { const msg = String(e?.message ?? e); console.error(msg.startsWith('💥 MalfunctionError:') ? msg : '💥 MalfunctionError: ' + msg); if (e?.stack) console.error(String(e.stack).split('\n').map((line) => '   ' + line).join('\n')); process.exitCode = 1; })" -- "$@"
