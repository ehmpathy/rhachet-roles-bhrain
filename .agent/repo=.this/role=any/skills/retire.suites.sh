#!/usr/bin/env bash
######################################################################
# .what = retire each test file this repo keeps but never runs:
#         `$name.test.ts` → `$name.test.ts.retired`, so jest never
#         runs it, tsc never compiles it, biome never lints it
#
# .why  = archived code, `.scratch/` drafts, and suites of an api the
#         repo no longer ships through are records, never suites. the
#         practice-owned jest configs are exact files, so the cut
#         cannot live there
#
# usage:
#   rhx retire.suites                                    # plan: archive/ + .scratch/
#   rhx retire.suites --mode apply                       # rename
#   rhx retire.suites --glob '<glob>' --mode apply       # also a named set
#
# guarantee:
#   - plan mode by default; no file moves without --mode apply
#   - exit 2 before any write, if a target name already exists
#   - moves each suite's snapshot with it, so none reads as obsolete
#   - touches only git-tracked *.test.ts and their snapshots
######################################################################
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$SKILL_DIR/retire.suites.js" "$@"
