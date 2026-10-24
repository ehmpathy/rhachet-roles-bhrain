#!/usr/bin/env bash
######################################################################
# .what = measure the cpu one status-line repaint costs, per seat
#
# .why  = the status line runs on every repaint of every claude seat.
#         a cpu claim about it with no measured before-and-after is a
#         guess. this names the instrument so the figure is reproducible
#         and the split (node boot, module load, the render) is visible.
#
# usage:
#   rhx bench.status-line                 # 10 repaints per arm, cwd = repo
#   rhx bench.status-line --runs 30
#
# guarantee:
#   - reports user+sys cpu seconds per repaint, for three arms:
#     bare node · import of cli/route only · the full repaint
#   - read-only: renders the line, never writes route state
#   - exit 0 = measured, exit 2 = bad input
######################################################################
set -euo pipefail

RUNS=10
while [[ $# -gt 0 ]]; do
  case "$1" in
    --runs) RUNS="$2"; shift 2 ;;
    --repo|--role|--skill) shift 2 ;; # rhx passes its own address through
    --help|-h) sed -n '2,19p' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) echo "✋ ConstraintError: unknown arg '$1'" >&2; exit 2 ;;
  esac
done
[[ "$RUNS" =~ ^[0-9]+$ ]] || { echo "✋ ConstraintError: --runs must be an integer" >&2; exit 2; }

# measure one arm: total user+sys cpu over RUNS invocations, then per repaint
measure_arm() {
  local label="$1" code="$2" cpu
  TIMEFORMAT='%U %S'
  cpu=$( { time (for _ in $(seq "$RUNS"); do node -e "$code" >/dev/null 2>&1 || true; done) ; } 2>&1 )
  awk -v l="$label" -v n="$RUNS" -v c="$cpu" 'BEGIN { split(c, a, " "); t = a[1] + a[2]; printf "   ├─ %-14s %6.3fs cpu per repaint\n", l, t / n }'
}

echo "🦉 measure twice, cut once"
echo ""
echo "🔍 bench.status-line"
echo "   ├─ runs per arm = $RUNS"
measure_arm "bare node" "0"
measure_arm "import only" "import('rhachet-roles-bhrain/cli/route').then(() => 0)"
measure_arm "full repaint" "import('rhachet-roles-bhrain/cli/route').then(m => m.routeStatusLine())"
echo "   └─ cwd = $(pwd)"
