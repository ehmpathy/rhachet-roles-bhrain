#!/usr/bin/env bash
######################################################################
# .what = run one real status line repaint, and show what it did
#
# .why  = a claim that a repaint was a hit, or that a change showed on
#         the next repaint, is owed the repaint itself: its line, its
#         stderr, its cpu, and whether the cache file was rewritten.
#         the bench reports cost only; this reports the experience.
#
# usage:
#   rhx route.status.line.show                 # one repaint via the subpath
#   rhx route.status.line.show --drop          # drop the cache first (a cold repaint)
#   rhx route.status.line.show --via legacy    # the cli/route export, as an unmigrated seat
#   rhx route.status.line.show --unbound       # repaint as a seat in a repo with no route bound
#   rhx route.status.line.show --line-arg --help   # pass an arg to the status line itself
#
# guarantee:
#   - runs the exact command the driver init writes into a seat's settings
#   - never writes route state; only --drop removes the gitignored cache dir
#   - reports `hit` when the cache file was not rewritten, `miss` when it was,
#     `untouched` for a --line-arg run that wrote no cache, and `(not reached)`
#     for a repaint that faulted before any cache write
#   - a faulted repaint ends with a `💥 MalfunctionError:` row on stderr
#   - exit 0 = shown, exit 1 = the repaint itself failed, exit 2 = bad input
######################################################################
set -euo pipefail

VIA="subpath"
DROP="false"
UNBOUND="false"
LINE_ARGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --drop) DROP="true"; shift ;;
    --unbound) UNBOUND="true"; shift ;;
    --line-arg)
      [[ $# -ge 2 && -n "$2" ]] || { echo "✋ ConstraintError: --line-arg needs a value" >&2; exit 2; }
      LINE_ARGS+=("$2"); shift 2 ;;
    --via)
      [[ $# -ge 2 && ( "$2" == "subpath" || "$2" == "legacy" ) ]] ||
        { echo "✋ ConstraintError: --via must be subpath or legacy" >&2; exit 2; }
      VIA="$2"; shift 2 ;;
    --repo|--role|--skill) shift 2 ;; # rhx passes its own address through
    # the header block, from its open rule to its close rule, so the range never drifts
    --help|-h) awk 'NR > 1 { print } NR > 2 && /^#####/ { exit }' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) echo "✋ ConstraintError: unknown arg '$1'" >&2; exit 2 ;;
  esac
done

# an unbound seat: a repo of its own under .scratch/ (gitignored), with no bind flag at all.
# it sits inside this repo, so node still resolves the package from this repo's node_modules
if [[ "$UNBOUND" == "true" ]]; then
  SEAT_DIR=".scratch/route.status.line.show/unbound-seat"
  if [[ ! -d "$SEAT_DIR/.git" ]]; then
    mkdir -p "$SEAT_DIR"
    git -C "$SEAT_DIR" init -q -b walk/unbound-seat
    git -C "$SEAT_DIR" -c user.name='Test Human' -c user.email='human@example.com' \
      commit -q --allow-empty -m 'an unbound seat'
  fi
  cd "$SEAT_DIR"
fi

CACHE_DIR=".agent/.cache/repo=bhrain/role=driver/skill=route.status.line"
SUBPATH="rhachet-roles-bhrain/cli/route.status.line"
[[ "$VIA" == "legacy" ]] && SUBPATH="rhachet-roles-bhrain/cli/route"
CODE="import('$SUBPATH').then(m => m.routeStatusLine())"

# the cache file's mtime per branch file, so a rewrite is visible
cache_marks() {
  find "$CACHE_DIR" -maxdepth 1 -name 'branch=*.json' -printf '%f %T@\n' 2>/dev/null | sort || true
}

# optional cold start
[[ "$DROP" == "true" ]] && rm -rf "$CACHE_DIR"

# one repaint, timed, its streams kept apart
MARKS_BEFORE="$(cache_marks)"
OUT_FILE="$(mktemp)"; ERR_FILE="$(mktemp)"
trap 'rm -f "$OUT_FILE" "$ERR_FILE"' EXIT
TIMEFORMAT='%U %S'
CODE_EXIT=0
CPU=$( { time node -e "$CODE" -- "${LINE_ARGS[@]}" >"$OUT_FILE" 2>"$ERR_FILE" ; } 2>&1 ) || CODE_EXIT=$?
MARKS_AFTER="$(cache_marks)"

# a hit leaves every cache file untouched; any rewrite or first write is a miss
CACHE="hit"
[[ "$MARKS_BEFORE" != "$MARKS_AFTER" || -z "$MARKS_AFTER" ]] && CACHE="miss"
# a pass-through arg (e.g. --help) may skip the render, so an unwritten cache proves no hit
[[ ${#LINE_ARGS[@]} -gt 0 && "$CACHE" == "hit" ]] && CACHE="untouched"
# a repaint that faulted and wrote no cache never reached the cache read at all
[[ "$CODE_EXIT" -ne 0 && "$MARKS_BEFORE" == "$MARKS_AFTER" ]] && CACHE="(not reached)"

echo "🦉 one repaint, as a seat sees it"
echo ""
echo "🔍 route.status.line.show"
echo "   ├─ via = $SUBPATH"
echo "   ├─ cwd = $(pwd)"
[[ ${#LINE_ARGS[@]} -gt 0 ]] && echo "   ├─ line args = ${LINE_ARGS[*]}"
echo "   ├─ cold = $DROP"
echo "   ├─ cache = $CACHE"
awk -v c="$CPU" 'BEGIN { split(c, a, " "); printf "   ├─ cpu = %.3fs\n", a[1] + a[2] }'
echo "   ├─ exit = $CODE_EXIT"
# an empty or blank line is named, never drawn as a childless branch
if [[ ! -s "$OUT_FILE" ]]; then
  echo "   ├─ stdout = (none)"
elif ! grep -q '[^[:space:]]' "$OUT_FILE"; then
  echo "   ├─ stdout = (blank line)"
else
  # a multi-line value renders as one block, the same shape under every node: open ├─, a │
  # spacer, the value rows, a │ spacer, close └─. no row is left with a final space
  echo "   ├─ stdout"
  echo "   │  ├─"
  echo "   │  │"
  sed 's/^/   │  │  /; s/[[:space:]]*$//' "$OUT_FILE"
  echo "   │  │"
  echo "   │  └─"
  echo "   │"
fi
if [[ -s "$ERR_FILE" ]]; then
  echo "   └─ stderr"
  echo "      ├─"
  echo "      │"
  sed 's/^/      │  /; s/[[:space:]]*$//' "$ERR_FILE"
  echo "      │"
  echo "      └─"
else
  echo "   └─ stderr = (none)"
fi

# a faulted repaint fails loud, with the fix a seat most often owes
if [[ "$CODE_EXIT" -ne 0 ]]; then
  echo "💥 MalfunctionError: the repaint exited $CODE_EXIT" >&2
  echo "   └─ fix: read the stderr branch of the tree; a module not found asks for npm run build, or pnpm install" >&2
  exit 1
fi