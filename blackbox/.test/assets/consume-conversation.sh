#!/usr/bin/env bash
######################################################################
# .what = a bespoke NON-review consumer of $conversation
# .why = proves the wish's "any skill" claim — $conversation is a plain
#        comma-joined glob any executable can read, not just the built-in
#        review skill. this one does not emit the review-output contract;
#        it simply reports which conversation files it saw.
######################################################################
set -euo pipefail

# grab the single value after --conversation, then split on commas
value=""
takenext=no
for arg in "$@"; do
  if [ "$arg" = "--conversation" ]; then takenext=yes; continue; fi
  if [ "$takenext" = yes ]; then value="$arg"; takenext=no; fi
done

files=()
if [ -n "$value" ]; then
  IFS=',' read -ra files <<< "$value"
fi

echo "saw ${#files[@]} files"
for f in "${files[@]:-}"; do
  if [ -n "$f" ]; then echo "read: $(basename "$f")"; fi
done

exit 0
