#!/usr/bin/env bash
######################################################################
# .what = write a pnpm patch that lifts a published release of this
#         package to the local build, for consumers while a release lags
#
# .why  = a fix that waits on review still owes consumers relief. a pnpm
#         patch against the version they hold delivers the local build's
#         dist (and its package.json exports) with no release. each step
#         is mechanical, and two of them have traps:
#         - `npm pack <spec>` cannot fetch the base: on a pnpm host `npm` is
#           pnpm, whose `pack` always packs the LOCAL project and runs its
#           `prepare` (a build, then `rhachet init`), whatever spec it was
#           handed. so the base tarball is downloaded by url, and its sha512
#           checked against the registry's integrity
#         - a diff over the whole package.json would carry this repo's
#           devDep bumps into every consumer. only `exports` is lifted
#
# usage:
#   rhx gen.consumer-patch --from 0.42.1 --into <path>.patch
#
# guarantee:
#   - reads `dist/` as built; run `npm run build` first
#   - the patch covers dist `.js` + package.json `exports` only
#     (no `.map`, no `.d.ts` — a consumer runs, never compiles, the patch)
#   - a changed role asset (`.jsonc`) is left out and named: a consumer's
#     host holds it read-only, so pnpm would refuse the whole patch
#     (why: briefs/hazard.git-apply-check-is-not-a-pnpm-install.md)
#   - prove it installs with `rhx prove.consumer-patch`
#   - git-style diff (`git diff --no-index`), the format pnpm patch writes
#   - checks the patch applies cleanly to a fresh copy of the base
#   - prints the consumer's steps; the last re-runs the inits, since a patch
#     changes the installed code and never the settings that call it
#   - scratch lives under .temp/consumer-patch/ (gitignored)
#   - exit 0 = written + verified, 1 = malfunction, 2 = bad input
######################################################################
set -euo pipefail

# a value flag owes a value; under set -u a bare `$2` would crash unqualified
require_value() {
  [[ $# -ge 2 && -n "$2" ]] || { echo "✋ ConstraintError: $1 needs a value" >&2; exit 2; }
}

FROM=""
INTO=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --from) require_value "$@"; FROM="$2"; shift 2 ;;
    --into) require_value "$@"; INTO="$2"; shift 2 ;;
    --repo|--role|--skill) shift 2 ;; # rhx passes its own address through
    --help|-h) awk 'NR > 1 { print } NR > 2 && /^#####/ { exit }' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) echo "✋ ConstraintError: unknown arg '$1'" >&2; exit 2 ;;
  esac
done
[[ -n "$FROM" ]] || { echo "✋ ConstraintError: --from <published version> is required" >&2; exit 2; }
# a version names a scratch dir that is removed below, so only a semver shape may reach it
[[ "$FROM" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]] ||
  { echo "✋ ConstraintError: --from must be a semver version, e.g. 0.42.1" >&2; exit 2; }
[[ -n "$INTO" ]] || { echo "✋ ConstraintError: --into <path>.patch is required" >&2; exit 2; }
[[ -d dist ]] || { echo "✋ ConstraintError: no dist/ here; run npm run build first" >&2; exit 2; }

PKG=$(node -p "require('./package.json').name")
SCRATCH=".temp/consumer-patch/${PKG}@${FROM}"
rm -rf "$SCRATCH"
mkdir -p "$SCRATCH/a" "$SCRATCH/b" "$SCRATCH/verify"

# fetch the published base by its tarball url, via node's own fetch — never `npm pack`,
# which on a pnpm host always packs the LOCAL project and runs its `prepare`
# an unpublished version either fails the view (E404) or prints naught; both refuse here
# npm's own error lines are kept apart, so the refusal header leads and its code rides beneath
VIEW_ERR="$SCRATCH/view.stderr"
URL=$(npm view "${PKG}@${FROM}" dist.tarball 2>"$VIEW_ERR") || URL=""
if [[ -z "$URL" ]]; then
  echo "✋ ConstraintError: ${PKG}@${FROM} is not published" >&2
  VIEW_CODE="$(awk '/npm error code/ { print $NF; exit }' "$VIEW_ERR")"
  echo "   └─ cause: npm view returned ${VIEW_CODE:-no tarball}" >&2
  exit 2
fi
INTEGRITY=$(npm view "${PKG}@${FROM}" dist.integrity)
TARBALL="$SCRATCH/base.tgz"
node -e '
  const [url, into] = process.argv.slice(1);
  fetch(url, { signal: AbortSignal.timeout(60_000) })
    .then((res) => {
      if (!res.ok) throw new Error(`returned ${res.status}`);
      return res.arrayBuffer();
    })
    .then((buf) => require("fs").writeFileSync(into, Buffer.from(buf)))
    .catch((error) => {
      console.error(`💥 MalfunctionError: fetch ${url} failed: ${error.message}`);
      process.exit(1);
    });
' "$URL" "$TARBALL"

# verify the tarball IS the published one, so a local pack can never pass for the base
INTEGRITY_FOUND="sha512-$(openssl dgst -sha512 -binary "$TARBALL" | openssl base64 -A)"
[[ "$INTEGRITY_FOUND" == "$INTEGRITY" ]] ||
  { echo "💥 MalfunctionError: the fetched tarball is not ${PKG}@${FROM} (integrity mismatch)" >&2; exit 1; }
for side in a b verify; do
  tar -xzf "$TARBALL" -C "$SCRATCH/$side" --strip-components=1
done

# the base package.json is reformatted once, on both diff sides, so the diff holds only `exports`
# the verify side keeps the published bytes, since those are what a consumer's install holds
for side in a b; do
  node -e '
    const fs = require("fs");
    const p = process.argv[1];
    fs.writeFileSync(p, JSON.stringify(JSON.parse(fs.readFileSync(p, "utf-8")), null, 2) + "\n");
  ' "$SCRATCH/$side/package.json"
done

# overlay the local build's compiled code onto the b side. role assets (an init's .jsonc, a
# brief, a skill) are left out: rhachet links them read-only on the consumer's host, and pnpm's
# store hardlinks one inode per content, so the installed copy pnpm patches is read-only too and
# its engine refuses the whole patch. a changed asset is named instead, for the consumer by hand
find dist -type f -name '*.js' -printf '%P\0' |
  while IFS= read -r -d '' file; do
    mkdir -p "$SCRATCH/b/dist/$(dirname "$file")"
    cp "dist/$file" "$SCRATCH/b/dist/$file"
  done
SKIPPED_LIST="$SCRATCH/skipped.list"
find dist -type f -name '*.jsonc' -printf '%P\n' |
  while IFS= read -r file; do
    cmp -s "dist/$file" "$SCRATCH/a/dist/$file" || echo "dist/$file"
  done >"$SKIPPED_LIST"

# lift only `exports` from the local package.json, so no devDep bump rides along
node -e '
  const fs = require("fs");
  const [base, local] = [process.argv[1], "package.json"].map((p) => JSON.parse(fs.readFileSync(p, "utf-8")));
  base.exports = local.exports;
  fs.writeFileSync(process.argv[1], JSON.stringify(base, null, 2) + "\n");
' "$SCRATCH/b/package.json"

# diff base vs overlay; git diff exits 1 when they differ, which is the expected case
mkdir -p "$(dirname "$INTO")"
PATCH_ABS="$(realpath -m "$INTO")"
set +e
git -C "$SCRATCH" diff --no-index --no-prefix --no-color a b >"$PATCH_ABS"
DIFF_CODE=$?
set -e
[[ "$DIFF_CODE" -le 1 ]] || { echo "💥 MalfunctionError: git diff failed (exit $DIFF_CODE)" >&2; exit 1; }
[[ -s "$PATCH_ABS" ]] || { echo "✋ ConstraintError: the local build equals ${PKG}@${FROM}; no patch owed" >&2; exit 2; }

# a new file's header reads `diff --git b/x b/x` under --no-prefix; git and pnpm write `a/x b/x`
sed -i 's|^diff --git b/\(.*\) b/|diff --git a/\1 b/|' "$PATCH_ABS"

# verify: the patch applies cleanly to a fresh copy of the base
git -C "$SCRATCH/verify" apply --check "$PATCH_ABS" ||
  { echo "💥 MalfunctionError: the patch does not apply to ${PKG}@${FROM}" >&2; exit 1; }

FILES=$(grep -c '^diff --git' "$PATCH_ABS" || true)
echo "🦉 a path for those who cannot wait"
echo ""
echo "🔍 gen.consumer-patch"
echo "   ├─ base = ${PKG}@${FROM}"
echo "   ├─ files = ${FILES}"
echo "   ├─ verified = applies cleanly to the base"
echo "   ├─ patch = ${INTO}"
if [[ -s "$SKIPPED_LIST" ]]; then
  echo "   ├─ left out, role assets a consumer's host holds read-only, which pnpm cannot patch"
  sed '$!s/^/   │  ├─ /; $s/^/   │  └─ /' "$SKIPPED_LIST"
  echo "   │"
fi
echo "   └─ for the consumer, in order"
echo "      ├─ 1. copy it to patches/${PKG}@${FROM}.patch"
echo "      ├─ 2. name it in package.json pnpm.patchedDependencies"
echo "      │  └─ \"${PKG}@${FROM}\": \"patches/${PKG}@${FROM}.patch\""
echo "      ├─ 3. pnpm install"
echo "      └─ 4. re-run the inits, so each seat's settings name the new code"
echo "         ├─ npx rhachet roles init --repo bhrain --role driver"
if [[ -s "$SKIPPED_LIST" ]]; then
  echo "         └─ an init reads the assets left out above in their old form, until the release"
else
  echo "         └─ every changed asset rides in the patch"
fi
