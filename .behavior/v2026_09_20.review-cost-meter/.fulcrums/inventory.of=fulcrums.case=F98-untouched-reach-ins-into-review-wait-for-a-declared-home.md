# F98 — untouched reach-ins into `review/` wait for a declared home

- raised 2026-10-05, by `arch-smell-scopeleaks` (nitpick.1, nitpick.2), at i003.bf5cc
- rework: **dirty** — a declared home for the runner and the file enumerator re-points every
  peer context that reads them, and the enumerator's own imports (`asErrorMessage`,
  `asPathAbsoluteFromCwd`) are `review/` modules that would have to move with it
- status: 🟡 **BEST-GUESSED — keep both edges; catch the lift beside the F97 dream**
- confidence: **80%**

## .the fork, stated fairly

two reach-ins into `domain.operations/review/` from a peer context, both byte-identical on
`origin/main`:

- `review.by/stepReviewBy.ts` and `review.by/asReviewVerdict.ts` → `review/runOneReview`
- `reflect/step2/compileReflectStep2Prompt.ts` and `executeManifestOperations.ts` →
  `review/enumFilesFromGlob`

| option | the claim |
|---|---|
| **A — keep both, catch the lift** | neither import line is touched here. `review.by` is a wrapper over `review` (it composes the runner it wraps), and the enumerator's two callers outside `review/` predate the branch. a home for either is a move of shared modules, not a rename |
| **B — swap reflect to `@src/utils/enumFilesFromGlob`** | the utils copy is a different contract: it takes one glob string, returns ABSOLUTE paths, and skips dotfiles. reflect filters `.draft/` off RELATIVE paths, so a swap changes behavior |
| **C — lift the review enumerator to the root now** | the root would then import `review/asErrorMessage` and `review/asPathAbsoluteFromCwd`, a new upward edge, unless those move too |

## .taken, and why

**A.** B changes behavior under a file this stone only renamed a function in; C trades one leak
for a wider one unless three modules move with their tests. both fail CLEAN
(`rule.always.fix-forward-under-scouts-honor`), so the lift is caught beside F97's in
`dreams/v2026_10_01.fix.runonereview-reaches-into-route-guard-for-its-tally-seam.md`, which now
names these two edges as part of the same lift.

## .rework, and why

dirty. the runner home re-points `review.by`, `route/guard/review`, and the review cli; the
enumerator home moves three modules and re-points six importers and one integration suite that
mocks the module path.

## .the enumerator lift, tried and reverted 2026-10-05

the lift of `enumFilesFromGlob` alone to `domain.operations/` was made and measured. it opened a
new edge rather than shut one: the enumerator imports `asErrorMessage` and
`asPathAbsoluteFromCwd` from `review/`, so the root would reach down into a child context, the
first root operation to do so. to shut that edge, both leaves would move too, which repoints
about sixteen importers across the review subsystem and widens every guard lane's scope for a
boundary move the wish never named. the lift was reverted; the measurement is what makes the
dirty verdict above more than a guess.

## .confidence, and why it is not higher

80%: a council may rule that `review/` is a shared subdomain and should be DECLARED one (as
`brain/` was under F54), which costs a brief rather than a move — a cheaper path than either lift.

## .where

- `src/domain.operations/review.by/stepReviewBy.ts:5`
- `src/domain.operations/review.by/asReviewVerdict.ts:1`
- `src/domain.operations/reflect/step2/executeManifestOperations.ts:10`

## .the verdict, once ruled

> _unruled._

## .settled in code, 2026-10-06

`src/domain.operations/review/.readme.md` now declares `review/` the home of the reach-ins this fulcrum keeps, so a later reader finds the edge sanctioned at its source. rework stays the same: delete the readme line and move the edge.