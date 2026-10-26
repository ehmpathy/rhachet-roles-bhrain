#!/usr/bin/env bash
######################################################################
# .what = install a consumer patch the way a consumer would, then run
#         two real status line repaints through that install
#
# .why  = `gen.consumer-patch` proves the patch APPLIES. a consumer is
#         owed more: that pnpm accepts it, that the patched package
#         loads the subpath, that a repaint prints a line, and that the
#         second repaint is a hit. this runs exactly those steps, so the
#         claim in a pr body rests on a real install, never on a diff
#
# usage:
#   rhx prove.consumer-patch --from 0.42.1 --patch <path>.patch
#
# guarantee:
#   - a scratch consumer under .temp/consumer-patch/proof/ (gitignored),
#     rebuilt fresh each run: a package.json that pins --from and names
#     the patch in pnpm.patchedDependencies, then `pnpm install`
#   - the repaints run from the repo root, so the seat is this repo and
#     its bound route; the package loads from the scratch install
#   - the first repaint drops the cache (a miss), the second must hit
#   - an install refusal names each read-only file the patch edits
#     (why: briefs/hazard.git-apply-check-is-not-a-pnpm-install.md)
#   - exit 0 = a line, then a hit · 1 = install or repaint failed, or no
#     hit · 2 = bad input
######################################################################
set -euo pipefail

# a value flag owes a value; under set -u a bare `$2` would crash unqualified
require_value() {
  [[ $# -ge 2 && -n "$2" ]] || { echo "✋ ConstraintError: $1 needs a value" >&2; exit 2; }
}

FROM=""
PATCH=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --from) require_value "$@"; FROM="$2"; shift 2 ;;
    --patch) require_value "$@"; PATCH="$2"; shift 2 ;;
    --repo|--role|--skill) shift 2 ;; # rhx passes its own address through
    --help|-h) awk 'NR > 1 { print } NR > 2 && /^#####/ { exit }' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) echo "✋ ConstraintError: unknown arg '$1'" >&2; exit 2 ;;
  esac
done
[[ "$FROM" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]] ||
  { echo "✋ ConstraintError: --from must be a semver version, e.g. 0.42.1" >&2; exit 2; }
[[ -s "$PATCH" ]] || { echo "✋ ConstraintError: --patch must name a patch file on disk" >&2; exit 2; }

# the scratch consumer, fresh each run, the way the pr body tells a consumer to set it up
PKG=$(node -p "require('./package.json').name")
PROOF=".temp/consumer-patch/proof"
rm -rf "$PROOF"
mkdir -p "$PROOF/patches"
cp "$PATCH" "$PROOF/patches/${PKG}@${FROM}.patch"
node -e '
  const [into, pkg, from] = process.argv.slice(1);
  const spec = `${pkg}@${from}`;
  const manifest = {
    name: "consumer-patch-proof",
    private: true,
    dependencies: { [pkg]: from },
    pnpm: { patchedDependencies: { [spec]: `patches/${spec}.patch` } },
  };
  require("fs").writeFileSync(into, JSON.stringify(manifest, null, 2) + "\n");
' "$PROOF/package.json" "$PKG" "$FROM"

# install; scripts are skipped, as a consumer's postinstall is not what is under proof
# the log is ndjson, so a refused patch keeps pnpm's full cause, not its one-line summary
INSTALL_LOG="$PROOF/install.ndjson"
pnpm install --dir "$PROOF" --ignore-workspace --ignore-scripts --reporter=ndjson >"$INSTALL_LOG" 2>&1 || {
  echo "💥 MalfunctionError: pnpm install of the patched ${PKG}@${FROM} failed" >&2
  # pnpm's patch engine cannot write a read-only file and reports only "could not apply";
  # name each file the patch edits that the installed copy holds read-only
  PATCHED_DIR="$(find "$PROOF/node_modules/.pnpm" -maxdepth 1 -name "${PKG}@${FROM}_patch_hash=*" | head -n 1)"
  UNWRITABLE="$(awk '/^diff --git a\// { f = $3; sub(/^a\//, "", f) } /^new file mode/ { f = "" } /^--- a\// && f != "" { print f }' "$PATCH" |
    while IFS= read -r file; do [[ -e "$PATCHED_DIR/node_modules/$PKG/$file" && ! -w "$PATCHED_DIR/node_modules/$PKG/$file" ]] && echo "$file"; done || true)"
  if [[ -n "$UNWRITABLE" ]]; then
    echo "   ├─ cause: the base ships these files read-only, so no patch can edit them" >&2
    echo "$UNWRITABLE" | sed 's/^/   │  ├─ /' >&2
  fi
  echo "   └─ log: $INSTALL_LOG" >&2
  exit 1
}

# one repaint, the subpath loaded from the scratch install; prints the line, keeps stderr apart
CACHE_DIR=".agent/.cache/repo=bhrain/role=driver/skill=route.status.line"
PROOF_ABS="$(realpath "$PROOF")"
CODE="require('module').createRequire(process.argv[1] + '/package.json')('${PKG}/cli/route.status.line').routeStatusLine()"
cache_marks() {
  find "$CACHE_DIR" -maxdepth 1 -name 'branch=*.json' -printf '%f %T@\n' 2>/dev/null | sort || true
}
repaint() {
  node -e "$CODE" "$PROOF_ABS" 2>"$PROOF/repaint.stderr"
}

# the first repaint is cold, so it must render and write the cache
rm -rf "$CACHE_DIR"
LINE_COLD="$(repaint)" || { echo "💥 MalfunctionError: the cold repaint failed" >&2; cat "$PROOF/repaint.stderr" >&2; exit 1; }
MARKS_COLD="$(cache_marks)"

# the second repaint, with no change between, must leave the cache file untouched
LINE_WARM="$(repaint)" || { echo "💥 MalfunctionError: the warm repaint failed" >&2; cat "$PROOF/repaint.stderr" >&2; exit 1; }
MARKS_WARM="$(cache_marks)"
CACHE="hit"
[[ -z "$MARKS_COLD" || "$MARKS_COLD" != "$MARKS_WARM" ]] && CACHE="miss"

echo "🦉 the path is walked, as a consumer walks it"
echo ""
echo "🔍 prove.consumer-patch"
echo "   ├─ base = ${PKG}@${FROM}"
echo "   ├─ patch = ${PATCH}"
echo "   ├─ install = pnpm accepted the patch"
echo "   ├─ cold = ${LINE_COLD:-(blank line)}"
echo "   ├─ warm = ${LINE_WARM:-(blank line)}"
echo "   └─ second repaint = ${CACHE}"

# a warm repaint that rewrote the cache did fresh work, which is the defect the patch cures
if [[ "$CACHE" != "hit" ]]; then
  echo "💥 MalfunctionError: the second repaint was a miss; the patched install does not cache" >&2
  exit 1
fi
