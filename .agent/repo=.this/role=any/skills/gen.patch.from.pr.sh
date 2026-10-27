#!/usr/bin/env bash
######################################################################
# .what = cut a pnpm patch of an installed dependency from the files
#         an upstream pull request adds or edits
#
# .why  = a tool this repo merely uses can ship a fix upstream that we
#         need before its release. the pr's own diff already holds each
#         file as a hunk; with its source prefix moved to the published
#         prefix (src/ -> dist/), those hunks ARE the patch pnpm applies.
#         no write under node_modules, and no hand copy of the files
#
# usage:
#   rhx gen.patch.from.pr --upstream ehmpathy/rhachet-roles-ehmpathy --pr 1143 \
#     --head 9895e535 --package rhachet-roles-ehmpathy@1.39.9 \
#     --file src/domain.roles/mechanic/skills/git.pull.comment/git.pull.comment.sh \
#     --file src/domain.roles/mechanic/boot.yml \
#     --note-in src/domain.roles/mechanic/skills/git.pull.comment/git.pull.comment.sh \
#     --note '# .note = LOCAL PATCH — upstream: <repo>#<pr>; drop on its release'
#
# guarantee:
#   - refuses unless the pr's head starts with --head, so the patch is
#     cut from the exact commit named
#   - keeps only the hunks of each --file, with --from (default src/)
#     moved to --into (default dist/) in every path header
#   - --note lands as a line before the close of the --note-in file's
#     header block; that file must be one the pr adds
#   - writes patches/<package>.patch and registers it under
#     pnpm.patchedDependencies; pnpm applies it on the next install
#   - an install that refuses a hunk on a read-only role asset is the
#     hazard in briefs/hazard.git-apply-check-is-not-a-pnpm-install.md
#   - exit 0 = written · 1 = gh or a file absent from the pr · 2 = bad input
######################################################################
set -euo pipefail

# a value flag owes a value; under set -u a bare `$2` would crash unqualified
require_value() {
  [[ $# -ge 2 && -n "$2" ]] || { echo "✋ ConstraintError: $1 needs a value" >&2; exit 2; }
}

REPO=""
PR=""
HEAD=""
PACKAGE=""
FILES=()
FROM="src/"
INTO="dist/"
NOTE_IN=""
NOTE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --upstream) require_value "$@"; REPO="$2"; shift 2 ;;
    --pr) require_value "$@"; PR="$2"; shift 2 ;;
    --head) require_value "$@"; HEAD="$2"; shift 2 ;;
    --package) require_value "$@"; PACKAGE="$2"; shift 2 ;;
    --file) require_value "$@"; FILES+=("$2"); shift 2 ;;
    --from) require_value "$@"; FROM="$2"; shift 2 ;;
    --into) require_value "$@"; INTO="$2"; shift 2 ;;
    --note-in) require_value "$@"; NOTE_IN="$2"; shift 2 ;;
    --note) require_value "$@"; NOTE="$2"; shift 2 ;;
    --repo|--role|--skill) shift 2 ;; # rhx passes its own address through
    --help|-h) awk 'NR > 1 { print } NR > 2 && /^#####/ { exit }' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) echo "✋ ConstraintError: unknown arg '$1'" >&2; exit 2 ;;
  esac
done
[[ "$REPO" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]] || { echo "✋ ConstraintError: --upstream must be owner/name" >&2; exit 2; }
[[ "$PR" =~ ^[0-9]+$ ]] || { echo "✋ ConstraintError: --pr must be a pull request number" >&2; exit 2; }
[[ "$HEAD" =~ ^[0-9a-f]{7,40}$ ]] || { echo "✋ ConstraintError: --head must be a commit sha, 7 to 40 hex" >&2; exit 2; }
[[ "$PACKAGE" =~ ^(@[a-z0-9._-]+/)?[a-z0-9._-]+@[0-9]+\.[0-9]+\.[0-9]+$ ]] ||
  { echo "✋ ConstraintError: --package must be name@semver, e.g. rhachet-roles-ehmpathy@1.39.9" >&2; exit 2; }
[[ ${#FILES[@]} -gt 0 ]] || { echo "✋ ConstraintError: name at least one --file" >&2; exit 2; }
[[ -z "$NOTE$NOTE_IN" || ( -n "$NOTE" && -n "$NOTE_IN" ) ]] ||
  { echo "✋ ConstraintError: --note and --note-in go together" >&2; exit 2; }

# the patch is cut from the exact commit named, never whatever the head moved to
HEAD_FOUND=$(gh pr view "$PR" --repo "$REPO" --json headRefOid --jq .headRefOid) || {
  echo "💥 MalfunctionError: gh could not read pr $REPO#$PR" >&2; exit 1; }
[[ "$HEAD_FOUND" == "$HEAD"* ]] || {
  echo "✋ ConstraintError: $REPO#$PR head is ${HEAD_FOUND:0:8}, not $HEAD" >&2
  echo "   └─ fix: name the current head, or wait for the pr to settle" >&2
  exit 2
}

# keep each named file's hunks, move its prefix, and land the note in its header
DIFF=$(gh pr diff "$PR" --repo "$REPO") || { echo "💥 MalfunctionError: gh could not read the diff of $REPO#$PR" >&2; exit 1; }
PATCH_PATH="patches/${PACKAGE}.patch"
mkdir -p patches
printf '%s\n' "$DIFF" | awk -v files="$(printf '%s\n' "${FILES[@]}")" -v from="$FROM" -v into="$INTO" \
  -v note_in="$NOTE_IN" -v note="$NOTE" '
  BEGIN { n = split(files, list, "\n"); for (i = 1; i <= n; i++) if (list[i] != "") want[list[i]] = 1 }
  /^diff --git a\// {
    path = $3; sub(/^a\//, "", path)
    keep = (path in want); if (keep) seen[path] = 1
    in_note = (keep && path == note_in); bars = 0
  }
  !keep { next }
  /^(diff --git|--- a\/|\+\+\+ b\/)/ { gsub(" a/" from, " a/" into); gsub(" b/" from, " b/" into); sub("^--- a/" from, "--- a/" into); sub("^\\+\\+\\+ b/" from, "+++ b/" into) }
  in_note && /^@@ -0,0 \+1,[0-9]+ @@/ { split($3, r, ","); sub(/,[0-9]+ @@/, "," (r[2] + 1) " @@") }
  in_note && /^\+#####/ { bars++; if (bars == 2) { print "+" note; noted = 1 } }
  { print }
  END {
    for (f in want) if (!(f in seen)) { print "absent: " f > "/dev/stderr"; bad = 1 }
    if (note_in != "" && !noted) { print "unnoted: " note_in > "/dev/stderr"; bad = 1 }
    exit bad
  }' >"$PATCH_PATH" || {
  rm -f "$PATCH_PATH"
  echo "💥 MalfunctionError: a named --file is absent from $REPO#$PR, or --note-in has no header block" >&2
  exit 1
}

# register the patch, the way pnpm patch-commit does
node -e '
  const [pkg, path] = process.argv.slice(1);
  const fs = require("fs");
  const manifest = JSON.parse(fs.readFileSync("package.json", "utf-8"));
  manifest.pnpm = manifest.pnpm ?? {};
  manifest.pnpm.patchedDependencies = { ...(manifest.pnpm.patchedDependencies ?? {}), [pkg]: path };
  fs.writeFileSync("package.json", JSON.stringify(manifest, null, 2) + "\n");
' "$PACKAGE" "$PATCH_PATH"

echo "🦉 so it is"
echo ""
echo "🦉 gen.patch.from.pr"
echo "   ├─ from: $REPO#$PR @ ${HEAD_FOUND:0:8}"
echo "   ├─ patch: $PATCH_PATH"
echo "   ├─ files"
for i in "${!FILES[@]}"; do
  glyph="├─"; [[ $i -eq $((${#FILES[@]} - 1)) ]] && glyph="└─"
  echo "   │  $glyph ${INTO}${FILES[$i]#"$FROM"}"
done
echo "   └─ next: pnpm install applies it (rhx git.branch.rebase lock refresh)"
