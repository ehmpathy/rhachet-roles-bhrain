#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for the education.pursuit.course skill
#
# .why = the stack moves of a pursuit: init pushes into one course
#        route, exit pops back to the pursuit. a course runs only
#        within a pursuit, and ends only by exit.
#
# usage:
#   ./education.pursuit.course.sh init --course idempotency
#   ./education.pursuit.course.sh exit
#   ./education.pursuit.course.sh --help
#
# guarantee:
#   - init refuses unless the branch is bound to a pursuit
#   - exit refuses until every course stone before 6.exit has passed
#   - each move swaps the bind (del, then set) under one lock per branch
#
# exit codes:
#   0 = success or --help
#   1 = a malfunction, under a `💥 MalfunctionError:` header with its stack
#   2 = a refusal the caller must fix
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/education.pursuit.course').then(m => m.educationPursuitCourse()).catch((e) => { const msg = String(e?.message ?? e); console.error(msg.startsWith('💥 MalfunctionError:') ? msg : '💥 MalfunctionError: ' + msg); if (e?.stack) console.error(String(e.stack).split('\n').map((line) => '   ' + line).join('\n')); process.exitCode = 1; })" -- "$@"
