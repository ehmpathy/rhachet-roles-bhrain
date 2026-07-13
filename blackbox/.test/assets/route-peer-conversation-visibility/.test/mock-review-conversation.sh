#!/usr/bin/env bash
######################################################################
# .what = a bespoke (non-review) reviewer that consumes $conversation
#         as a raw glob of filepaths
# .why = proves the wish's "any skill" claim — $conversation is a plain
#        glob any executable can read, not just the built-in review skill.
#        it converges: when a prior .taken says FIXED, it drops the blocker;
#        else it re-raises. it also echoes the conversation it saw, so the
#        test can assert opt-in visibility (on vs off).
######################################################################
set -euo pipefail

# gather the filepaths passed after --conversation
# .why = $conversation expands to ONE comma-joined token, so grab the single
#        value after --conversation, then split it on commas into filepaths
files=()
takenext=no
value=""
for arg in "$@"; do
  if [ "$arg" = "--conversation" ]; then takenext=yes; continue; fi
  if [ "$takenext" = yes ]; then value="$arg"; takenext=no; fi
done
if [ -n "$value" ]; then
  IFS=',' read -ra files <<< "$value"
fi

# decide the verdict from the prior dialogue
# .why = if the driver's .taken claims a fix, converge (drop the blocker)
fixed=no
for f in "${files[@]:-}"; do
  case "$f" in
    *taken.by_self*)
      if [ -f "$f" ] && grep -q 'FIXED' "$f"; then fixed=yes; fi
      ;;
  esac
done

echo "---"
if [ "$fixed" = yes ]; then
  echo "blockers: 0"
  echo "nitpicks: 0"
  echo "---"
  echo "seer: the driver's .taken claims FIXED — the blocker is dropped"
else
  echo "blockers: 1"
  echo "nitpicks: 0"
  echo "---"
  echo "seer: the design lacks a bounded context"
  echo ""
  echo "## blockers"
  echo "- the design lacks a bounded context"
fi

# echo the conversation the reviewer saw, for the visibility assertion
count=${#files[@]}
echo ""
echo "## conversation seen ($count files)"
for f in "${files[@]:-}"; do
  [ -n "$f" ] && echo "- $(basename "$f")"
done
