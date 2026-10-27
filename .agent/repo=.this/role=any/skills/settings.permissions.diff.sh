#!/usr/bin/env bash
######################################################################
# .what = compare the permission sets of a claude settings file across two revs
#
# .why  = `rhx upgrade` and `roles link` regenerate settings files, and a
#         regen often reorders hundreds of lines. a line diff cannot say
#         whether the allowlist widened or merely moved; a set diff can.
#         a reviewer who asks "did this permission change?" gets the answer
#         in one call, not by hand
#
# usage:
#   rhx settings.permissions.diff --of <path> --from <rev>               # <rev> vs the work tree
#   rhx settings.permissions.diff --of <path> --from <rev> --into <rev>
#
# guarantee:
#   - reads both versions via git show (or the work tree); writes naught
#   - reports, per list (allow, deny, ask): entries added and removed,
#     order ignored; and whether every key outside `permissions` is equal,
#     with each top-level key that moved named beneath (`~ hooks`)
#   - a version that is not one json object (a conflict marker, say)
#     refuses as bad input, with jq's cause beneath the header
#   - exit 0 = compared, exit 2 = bad input, exit 1 = a read failed
######################################################################
set -euo pipefail

# a value flag owes a value; a bare `shift 2` past the last arg would exit 1 with no row
require_value() {
  [[ $# -ge 2 && -n "$2" ]] || { echo "✋ ConstraintError: $1 needs a value" >&2; exit 2; }
}

OF="" FROM="" INTO=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --of) require_value "$@"; OF="$2"; shift 2 ;;
    --from) require_value "$@"; FROM="$2"; shift 2 ;;
    --into) require_value "$@"; INTO="$2"; shift 2 ;;
    --repo|--role|--skill) shift 2 ;; # rhx passes its own address through
    --help|-h) awk 'NR > 1 { print } NR > 2 && /^#####/ { exit }' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) echo "✋ ConstraintError: unknown arg '$1'" >&2; exit 2 ;;
  esac
done
[[ -n "$OF" ]] || { echo "✋ ConstraintError: --of <path> is required" >&2; exit 2; }
[[ -n "$FROM" ]] || { echo "✋ ConstraintError: --from <rev> is required" >&2; exit 2; }

# read one version: a rev via git show, or the work tree when no rev is named
read_version() {
  local rev="$1"
  local cause
  if [[ -z "$rev" ]]; then
    cat "$OF" 2>/dev/null && return
    echo "💥 MalfunctionError: cannot read $OF in the work tree" >&2
    echo "   └─ cause: no such file" >&2
    exit 1
  fi
  # the header opens the error; git's own message rides beneath it as the cause
  cause="$(git show "$rev:$OF" 2>&1 1>/dev/null)" && { git show "$rev:$OF"; return; }
  echo "💥 MalfunctionError: cannot read $OF at $rev" >&2
  echo "   └─ cause: ${cause#fatal: }" >&2
  exit 1
}
BEFORE="$(read_version "$FROM")"
AFTER="$(read_version "$INTO")"

# a version that is not one json object is bad input: name which one, and jq's cause
require_object() {
  local where="$1" body="$2" cause
  cause="$(jq -e 'type == "object"' <<<"$body" 2>&1 1>/dev/null)" && return
  # jq 1.7+ prefixes its errors with `jq: ` and 1.6 does not; drop it so the cause reads the
  # same on every host (as the git cause above drops `fatal: `)
  cause="${cause#jq: }"
  echo "✋ ConstraintError: $OF $where is not a json object" >&2
  echo "   └─ cause: ${cause:-the content holds no json object}" >&2
  exit 2
}
require_object "at $FROM" "$BEFORE"
if [[ -n "$INTO" ]]; then require_object "at $INTO" "$AFTER"; fi
if [[ -z "$INTO" ]]; then require_object "in the work tree" "$AFTER"; fi

# set diff per list, order ignored; plus an equality check of all else
REPORT="$(jq -n --argjson a "$BEFORE" --argjson b "$AFTER" '
  def list($o; $k): ($o.permissions[$k] // []);
  def delta($k): { added: (list($b; $k) - list($a; $k)), removed: (list($a; $k) - list($b; $k)) };
  { allow: delta("allow"), deny: delta("deny"), ask: delta("ask"),
    rest_equal: (($a | del(.permissions)) == ($b | del(.permissions))),
    rest_moved: ([($a | del(.permissions) | keys[]), ($b | del(.permissions) | keys[])]
      | unique | map(select($a[.] != $b[.]))) }
')"

# one leaf per entry; the last leaf of a list closes with └─
JQ_LEAVES='def leaves($l): range(0; $l | length) as $i
  | $pre + (if $i == ($l | length) - 1 then "└─ " else "├─ " end) + $sign + " " + $l[$i];'
JQ_LEAVES_OF_ADDED="$JQ_LEAVES leaves(.[\$k].added)"
JQ_LEAVES_OF_REMOVED="$JQ_LEAVES leaves(.[\$k].removed)"

# render as a tree: one leaf per fact
echo "🦉 the pond reflects what moved, not how it was stirred"
echo ""
echo "🔍 settings.permissions.diff"
echo "   ├─ of = $OF"
echo "   ├─ from = $FROM"
echo "   ├─ into = ${INTO:-(work tree)}"
for LIST in allow deny ask; do
  ADDED="$(jq -r --arg k "$LIST" '.[$k].added | length' <<<"$REPORT")"
  REMOVED="$(jq -r --arg k "$LIST" '.[$k].removed | length' <<<"$REPORT")"
  echo "   ├─ $LIST"
  echo "   │  ├─ added = $ADDED"
  jq -r --arg k "$LIST" --arg pre "   │  │  " --arg sign "+" "$JQ_LEAVES_OF_ADDED" <<<"$REPORT"
  echo "   │  └─ removed = $REMOVED"
  jq -r --arg k "$LIST" --arg pre "   │     " --arg sign "-" "$JQ_LEAVES_OF_REMOVED" <<<"$REPORT"
done
echo "   └─ all else equal = $(jq -r '.rest_equal' <<<"$REPORT")"
# a difference names each top-level key that moved, one leaf per key
jq -r --arg pre "      " --arg sign "~" '.rest_moved as $l | range(0; $l | length) as $i
  | $pre + (if $i == ($l | length) - 1 then "└─ " else "├─ " end) + $sign + " " + $l[$i]' <<<"$REPORT"