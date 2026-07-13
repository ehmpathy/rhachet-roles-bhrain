#!/usr/bin/env bash
######################################################################
# .what = a conversation-aware architect reviewer for the journey
# .why = round 1 (no prior .taken) raises 1 blocker; a later round that
#        sees the driver's FIXED .taken via --conversation drops it (0/0).
#        this drives the journey's convergence at the stale-hash re-run.
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
  echo "architect: the driver's .taken claims FIXED — the blocker is dropped"
else
  echo "blockers: 1"
  echo "nitpicks: 0"
  echo "---"
  echo "architect: the design lacks a bounded context"
  echo ""
  echo "## blockers"
  echo "- the design lacks a bounded context"
fi

# echo the conversation the reviewer saw, for the visibility assertion
count=${#files[@]}
echo ""
echo "## conversation seen ($count files)"
for f in "${files[@]:-}"; do
  if [ -n "$f" ]; then echo "- $(basename "$f")"; fi
done

# exit clean — the verdict + counts above are the contract; the loop's last
# test must not leak a non-zero status that the guard reads as a malfunction
exit 0
