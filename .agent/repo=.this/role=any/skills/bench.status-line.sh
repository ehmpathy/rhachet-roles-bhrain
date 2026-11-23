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
#   - reports user+sys cpu seconds per repaint, for twelve arms:
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
#     · bare bash (the floor of a bash command) · the bash reader (the
#     statusLine command since the status file: zero node, zero spawns),
#     both with BASH_ENV cleared as the command clears it, so a host rc
#     never enters the figure
#   - never writes route state; the subpath arm fills its own gitignored
#     cache under .agent/.cache/, as every seat does
#   - a miss arm drops only the node branch=*.json records, and keeps the
#     bash reader's branch=*.route pointers, so a bench never blanks the line
#   - refuses up front, before any arm, where the bash reader is not installed
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

# the bash reader must be installed, checked before any arm so a refusal costs no node spawn
READER_PATH="node_modules/rhachet-roles-bhrain/dist/domain.roles/driver/skills/route.status.line.sh"
[[ -f "$READER_PATH" ]] ||
  { echo "✋ ConstraintError: no bash reader at $READER_PATH; run bench.status-line from a repo whose installed rhachet-roles-bhrain ships route.status.line.sh" >&2; exit 2; }

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

# measure one bash arm: the same tally, for a bash command with no node in it
# .note = the second arg is the BASH_ENV the arm runs under; '' as the statusLine command
#         clears it, so the figure holds no host rc
measure_bash_arm() {
  local label="$1" bash_env="$2" cpu
  shift 2
  BASH_ENV="$bash_env" bash "$@" >/dev/null ||
    { echo "💥 MalfunctionError: the '$label' arm failed; its stderr is above" >&2; exit 1; }
  TIMEFORMAT='%U %S'
  cpu=$( { time (for _ in $(seq "$RUNS"); do BASH_ENV="$bash_env" bash "$@" >/dev/null 2>&1 || exit 1; done) ; } 2>&1 ) ||
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
# the drop removes the node records (`branch=*.json`) alone: the bash reader's branch pointers
# (`branch=*.route`) share the dir, and to drop them would blank this seat's live line
DROP_CODE="{ const fs = require('fs'); const dir = '.agent/.cache/repo=bhrain/role=driver/skill=route.status.line'; for (const name of fs.existsSync(dir) ? fs.readdirSync(dir) : []) if (name.startsWith('branch=') && name.endsWith('.json')) fs.rmSync(dir + '/' + name, { force: true }); }"
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
# the zero-node arms: a bare bash start (the floor), then the bash reader the statusLine runs,
# which reads the status file the route's writers keep and spawns no child process
measure_bash_arm "bare bash" "" "-c" ":"
measure_bash_arm "bash reader" "" "$READER_PATH"
echo "   └─ cwd = $(pwd)"
