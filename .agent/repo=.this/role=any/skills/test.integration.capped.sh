#!/usr/bin/env bash
######################################################################
# .what = run the integration suite pinned to a few cores
#
# .why  = on a shared, saturated host an uncapped run takes ~14 jest
#         workers plus their spawned children, holds 1000%+ cpu, and
#         reads red from load rather than code. a cap keeps the run
#         courteous to other seats and its reds honest
#
# usage:
#   rhx test.integration.capped                      # full suite, 3 cores
#   rhx test.integration.capped --cores 2            # full suite, 2 cores
#   rhx test.integration.capped --scope 'path://x'   # scoped, 3 cores
#   rhx test.integration.capped --scope 'path://x' --resnap   # rewrite its snapshots
#
# guarantee:
#   - taskset pins the whole process tree (jest, its workers, every
#     bash and node they spawn) to cores 0..N-1
#   - INTEGRATION_WORKERS=N sizes the jest pool to match, since jest
#     reads every core and ignores the affinity mask
#   - delegates to git.repo.test (keyrack unlock, log capture, summary)
#   - without --scope it runs the full suite (--thorough)
#   - exit code is git.repo.test's
######################################################################
set -euo pipefail

CORES=3
SCOPES=()
RESNAP=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --cores) CORES="$2"; shift 2 ;;
    --scope) SCOPES+=(--scope "$2"); shift 2 ;;
    --resnap) RESNAP=(--resnap); shift ;;
    --repo|--role|--skill) shift 2 ;; # rhx passes its own address through
    --help|-h)
      sed -n '2,24p' "${BASH_SOURCE[0]}"
      exit 0
      ;;
    *)
      echo "✋ ConstraintError: unknown arg '$1'; see --help" >&2
      exit 2
      ;;
  esac
done

# validate the core count
if ! [[ "$CORES" =~ ^[1-9][0-9]*$ ]]; then
  echo "✋ ConstraintError: --cores must be a positive integer, got '$CORES'" >&2
  exit 2
fi

# fail fast where the pin tool is absent
if ! command -v taskset >/dev/null; then
  echo "✋ ConstraintError: taskset not found; install util-linux, or run rhx git.repo.test uncapped" >&2
  exit 2
fi

# full suite unless scoped
THOROUGH=()
if [[ ${#SCOPES[@]} -eq 0 ]]; then THOROUGH=(--thorough); fi

# run pinned, with the jest pool sized to the pin
export INTEGRATION_WORKERS="$CORES"
exec taskset -c "0-$((CORES - 1))" \
  rhx git.repo.test --what integration --mode apply "${THOROUGH[@]}" "${SCOPES[@]}" "${RESNAP[@]}"
