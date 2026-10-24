#!/usr/bin/env bash
######################################################################
# .what = set a pull request's body from a file on disk
#
# .why  = a route's done gate writes its pr body as a route artifact
#         (`appendix/pr.body.md`), reviewed with the route; this sets
#         the pr to exactly those bytes, so the pr and the artifact
#         never drift
#
# usage:
#   rhx pr.body.set --pr 700 --from .behavior/<route>/appendix/pr.body.md
#
# guarantee:
#   - sets the body via the gh cli login (`gh pr edit --body-file`)
#   - edits the body only: title, labels, reviewers are untouched
#   - idempotent: a rerun with the same file sets the same body
#   - exit 0 = set · 1 = gh failed · 2 = bad input
######################################################################
set -euo pipefail

# a value flag owes a value; under set -u a bare `$2` would crash unqualified
require_value() {
  [[ $# -ge 2 && -n "$2" ]] || { echo "✋ ConstraintError: $1 needs a value" >&2; exit 2; }
}

PR=""
FROM=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --pr) require_value "$@"; PR="$2"; shift 2 ;;
    --from) require_value "$@"; FROM="$2"; shift 2 ;;
    --repo|--role|--skill) shift 2 ;; # rhx passes its own address through
    --help|-h) awk 'NR > 1 { print } NR > 2 && /^#####/ { exit }' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) echo "✋ ConstraintError: unknown arg '$1'" >&2; exit 2 ;;
  esac
done
[[ "$PR" =~ ^[0-9]+$ ]] || { echo "✋ ConstraintError: --pr must be a pull request number, e.g. 700" >&2; exit 2; }
[[ -s "$FROM" ]] || { echo "✋ ConstraintError: --from must name a non-empty body file on disk" >&2; exit 2; }

# set the body; a gh fault is a malfunction, its own words kept
gh pr edit "$PR" --body-file "$FROM" >/dev/null || {
  echo "💥 MalfunctionError: gh could not set the body of pr #$PR" >&2
  echo "   └─ fix: check \`gh auth status\`, then rerun" >&2
  exit 1
}

echo "🦉 so it is"
echo ""
echo "🦉 pr.body.set"
echo "   ├─ pr: #$PR"
echo "   ├─ from: $FROM"
echo "   └─ lines: $(wc -l <"$FROM")"
