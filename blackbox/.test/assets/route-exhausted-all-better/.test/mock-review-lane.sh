#!/usr/bin/env bash
# a mock reviewer that raises a fixed count of blockers and nitpicks on every run
#
# .why = the exhausted-all-better journey needs lanes that never clear on their own, so
#        budget exhaustion plus the driver's concession grade is the only road forward
#
# usage: mock-review-lane.sh --blockers <n> --nitpicks <n>
set -euo pipefail

BLOCKERS=""
NITPICKS=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --blockers) BLOCKERS="$2"; shift 2 ;;
    --nitpicks) NITPICKS="$2"; shift 2 ;;
    *) echo "✋ ConstraintError: unknown arg '$1' (usage: --blockers <n> --nitpicks <n>)" >&2; exit 2 ;;
  esac
done

# both counts are required; a lane with an absent count would print an unreadable verdict
if [[ -z "$BLOCKERS" || -z "$NITPICKS" ]]; then
  echo "✋ ConstraintError: --blockers and --nitpicks are both required" >&2
  exit 2
fi

echo "---"
echo "blockers: ${BLOCKERS}"
echo "nitpicks: ${NITPICKS}"
echo "---"
echo ""
for i in $(seq 1 "${BLOCKERS}"); do echo "- [blocker][better] concern ${i}"; done
for i in $(seq 1 "${NITPICKS}"); do echo "- [nitpick][better] concern ${i}"; done
