#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for the education.pursuit skill
#
# .why = the entrypoint of education: a director sends a role on a
#        pursuit, one route that plots courses, pursues each from the
#        greats, reviews, and graduates with a pedigree entry.
#
# usage:
#   ./education.pursuit.sh init --for mechanic --course idempotency
#   ./education.pursuit.sh init --for mechanic --slug reliable-writes \
#     --course idempotency --course retries
#   ./education.pursuit.sh --help
#
# guarantee:
#   - init is idempotent: a re-run finds the same route, keeps each file,
#     and re-binds it
#   - an unknown role is refused, exit 2, with the roles found listed
#   - `judge --criterion <criterion> --route $route` is the guard verb of the
#     pursuit's own stones; criterion = plot-valid | courses-exited |
#     pedigree-stamped | boot-within-budget
#
# exit codes:
#   0 = success or --help
#   1 = a malfunction, under a `💥 MalfunctionError:` header with its stack
#   2 = a refusal the caller must fix
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/education.pursuit').then(m => m.educationPursuit()).catch((e) => { const msg = String(e?.message ?? e); console.error(msg.startsWith('💥 MalfunctionError:') ? msg : '💥 MalfunctionError: ' + msg); if (e?.stack) console.error(String(e.stack).split('\n').map((line) => '   ' + line).join('\n')); process.exitCode = 1; })" -- "$@"
