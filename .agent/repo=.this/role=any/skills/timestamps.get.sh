#!/usr/bin/env bash
######################################################################
# .what = list every time of day held in this tree's files, each hit with its line,
#         in every shape: a colon clock, a clock with a digit masked as x, and a
#         dash time id (with or without a date and T ahead)
#
# .why  = .husky/check.timestamps.sh halts at its first hit, skips .ts/.sh, and
#         misses the masked and the bare dash shapes. this reads every file the
#         next commit would carry, code and fixtures included, and reports all
#
# usage:
#   rhx timestamps.get                   # every file not gitignored (tracked + new)
#   rhx timestamps.get --scope staged    # only the staged blobs
#   rhx timestamps.get --count           # the totals only
#
# guarantee:
#   - reads only; stages, edits, and commits naught
#   - skips binary files, and never reads a goals record (the goal guard owns it)
#   - exit 0 = no hit · 2 = hits found (each named)
######################################################################
set -euo pipefail

SCOPE="tree"
COUNT_ONLY="false"
while [ $# -gt 0 ]; do
  case "$1" in
    --scope) SCOPE="${2:-}"; shift 2 ;;
    --count) COUNT_ONLY="true"; shift ;;
    --skill | --repo | --role) shift 2 ;; # rhx forwards its own selectors
    run) shift ;;
    --help | -h) sed -n '2,20p' "$0"; exit 0 ;;
    *) echo "✋ ConstraintError: unknown flag $1 (valid: --scope tree|staged, --count)" >&2; exit 2 ;;
  esac
done
case "$SCOPE" in tree | staged) ;; *) echo "✋ ConstraintError: --scope must be tree or staged" >&2; exit 2 ;; esac

# a clock digit: 0-9, or an x mask in its place
D='[0-9x]'
H="([01]$D|2[0-3x]|x$D)"
M="([0-5x]$D)"

# the shapes of a time of day (HH, MM, SS stand for clock digits, any of them an x mask)
#   - colon clock, after a T or after a left edge that is no digit or colon: HH:MM, THH:MM:SSZ
#   - dash time id after a T: THH-MM-SSZ, THH-MMZ
#   - dash time id after a date: YYYY-MM-DD-HH-MM-SS
#   - bare dash time id, three parts: HH-MM-SS
PATTERN="(T$H:$M(:$M)?|(^|[^0-9x:])$H:$M(:$M)?([^0-9]|$)|T$H-$M(-$M)?([^0-9]|$)|[0-9]{4}-[0-9]{2}-[0-9]{2}[-_]$H-$M(-$M)?([^0-9]|$)|(^|[^0-9-])$H-$M-$M([^0-9]|$))"

# an iso-8601 duration is a span, never an instant (PT12:30:00); drop it before the scan
DURATION='P([0-9]+[YMWD])*T([0-9]+[HMS])*[0-9][0-9]:[0-9][0-9](:[0-9][0-9])?'

# the files the next commit would carry
if [ "$SCOPE" = "staged" ]; then
  files=$(git -c core.quotepath=off diff --cached --name-only --diff-filter=ACM)
else
  files=$(git -c core.quotepath=off ls-files --cached --others --exclude-standard)
fi

hits_files=0
hits_lines=0
while IFS= read -r file; do
  [ -n "$file" ] || continue
  case "$file" in */.goals/*) continue ;; esac
  if [ "$SCOPE" = "staged" ]; then
    content=$(git show ":$file")
  else
    [ -f "$file" ] && [ ! -L "$file" ] || continue
    content=$(cat "$file")
  fi
  found=$(printf '%s\n' "$content" | sed -E "s/$DURATION//g" | grep -nIE "$PATTERN" || true)
  [ -n "$found" ] || continue
  hits_files=$((hits_files + 1))
  hits_lines=$((hits_lines + $(printf '%s\n' "$found" | wc -l)))
  [ "$COUNT_ONLY" = "true" ] && continue
  echo "├─ $file"
  printf '%s\n' "$found" | cut -c1-180 | sed 's/^/│  └─ /'
done <<EOF
$files
EOF

if [ "$hits_files" -eq 0 ]; then
  echo "🦉 so it is — 0 lines in 0 files hold a time of day (scope: $SCOPE)"
  exit 0
fi
echo "└─ $hits_lines lines in $hits_files files hold a time of day (scope: $SCOPE)"
exit 2
