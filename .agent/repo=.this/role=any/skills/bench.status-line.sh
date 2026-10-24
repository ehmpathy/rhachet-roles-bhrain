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
#   - reports user+sys cpu seconds per repaint, for ten arms:
#     bare node · bare node + one git spawn (the branch read a hit avoids)
#     · the import() floor (a builtin via dynamic import — the command shape's
#     own cost) · import of cli/route only · a legacy miss (the cache dropped,
#     then the cli/route command: the old per-repaint cost) · a legacy warm
#     repaint (the cli/route command over a warm cache: a seat patched, its
#     init not yet re-run) · import of the cli/route.status.line subpath only
#     · a warm repaint via that subpath · a miss via that subpath (the cache
#     dropped first: the bind lookup + the render, the cost of each change)
#     · the unbound glob (the repo-wide bind flag walk an unbound seat's
#     miss pays once per max age, over this repo's real tree)
#   - never writes route state; the subpath arm fills its own gitignored
#     cache under .agent/.cache/, as every seat does
#   - exit 0 = measured, exit 1 = an arm failed, exit 2 = bad input
######################################################################
set -euo pipefail

RUNS=10
while [[ $# -gt 0 ]]; do
  case "$1" in
    --runs)
      [[ $# -ge 2 && -n "$2" ]] || { echo "✋ ConstraintError: --runs needs a value" >&2; exit 2; }
      RUNS="$2"; shift 2 ;;
    --repo|--role|--skill) shift 2 ;; # rhx passes its own address through
    --help|-h) awk 'NR > 1 { print } NR > 2 && /^#####/ { exit }' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) echo "✋ ConstraintError: unknown arg '$1'" >&2; exit 2 ;;
  esac
done
[[ "$RUNS" =~ ^[1-9][0-9]*$ ]] || { echo "✋ ConstraintError: --runs must be a positive integer" >&2; exit 2; }

# measure one arm: total user+sys cpu over RUNS invocations, then per repaint
measure_arm() {
  local label="$1" code="$2" cpu
  # probe once, loud: an arm that fails would bench the cost of a crash, not of a repaint
  node -e "$code" >/dev/null ||
    { echo "💥 MalfunctionError: the '$label' arm failed; its stderr is above" >&2; exit 1; }
  TIMEFORMAT='%U %S'
  cpu=$( { time (for _ in $(seq "$RUNS"); do node -e "$code" >/dev/null 2>&1 || exit 1; done) ; } 2>&1 ) ||
    { echo "💥 MalfunctionError: the '$label' arm failed mid-run" >&2; exit 1; }
  awk -v l="$label" -v n="$RUNS" -v c="$cpu" 'BEGIN { split(c, a, " "); t = a[1] + a[2]; printf "   ├─ %-14s %6.3fs cpu per repaint\n", l, t / n }'
}

echo "🦉 measure twice, cut once"
echo ""
echo "🔍 bench.status-line"
echo "   ├─ runs per arm = $RUNS"
measure_arm "bare node" "0"
# the branch read the hit path avoids: its delta over bare node is the cost of one git spawn
measure_arm "git spawn" "require('child_process').execSync('git rev-parse --abbrev-ref HEAD')"
# the floor of the command shape: a dynamic import() boots node's esm loader, even for a builtin
measure_arm "import() floor" "import('node:fs').then(() => 0)"
measure_arm "import only" "import('rhachet-roles-bhrain/cli/route').then(() => 0)"
# the commands, and a cache drop that forces a miss before each repaint
SUBPATH_CODE="import('rhachet-roles-bhrain/cli/route.status.line').then(m => m.routeStatusLine())"
LEGACY_CODE="import('rhachet-roles-bhrain/cli/route').then(m => m.routeStatusLine())"
DROP_CODE="require('fs').rmSync('.agent/.cache/repo=bhrain/role=driver/skill=route.status.line', { recursive: true, force: true });"
# the old cost: a seat on the legacy barrel with no cache to read — the barrel, the glob, the render
measure_arm "legacy miss" "$DROP_CODE $LEGACY_CODE"
# one cold repaint fills the cache, then the warm repaints are measured
node -e "$SUBPATH_CODE" >/dev/null
# a seat on the legacy barrel after a patch, before its init re-runs: the barrel, then a hit
measure_arm "legacy warm" "$LEGACY_CODE"
measure_arm "subpath import" "import('rhachet-roles-bhrain/cli/route.status.line').then(() => 0)"
measure_arm "subpath warm" "$SUBPATH_CODE"
# a miss via the subpath: the bind lookup and the render, the cost of each change
measure_arm "subpath miss" "$DROP_CODE $SUBPATH_CODE"
# an unbound seat's miss, once per max age: the repo-wide bind flag walk, for a branch no flag
# names, over this repo's real tree (seat transcripts and caches included, so the ignore list is
# what is measured). the op is internal, so it loads from the package's dist via node_modules
GLOB_MODULE="process.cwd() + '/node_modules/rhachet-roles-bhrain/dist/domain.operations/route/bind/getAllBindFlagsByBranch.js'"
measure_arm "unbound glob" "require($GLOB_MODULE).getAllBindFlagsByBranch({ branch: 'bench/unbound-seat' }).then(() => 0)"
echo "   └─ cwd = $(pwd)"
