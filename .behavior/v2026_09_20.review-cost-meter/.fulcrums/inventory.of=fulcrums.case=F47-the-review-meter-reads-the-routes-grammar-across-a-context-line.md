# fulcrum F47 — the review meter reads the route's grammar across a context line

- rework = 🔴 **dirty** — a boundary layer this repo keeps nowhere else
- status = 🟡 **DISPUTED 2026-09-26 — option A, the direct import stands**
- confidence = 🟡 **70%** — see `.what i005 shifts`
- raised.by = peer lane `arch-smell-scopeleaks`, blocker.1, round hash `f9989f17260b48b058`

## .the fork

two files in `review/meter/` import from `route/guard/`:

- `asReviewRunIdentity.ts` ← `asPeerReviewOutputParts`, `SEGMENTS_OF_PEER_REVIEWS_DIR`
- `getAllReviewerLevels.ts` ← `getAllPeerLevelsFromGuard`

the lane asks for a `contract/` or `shared/` artifact between them, per `rule.forbid.scope-leaks`.

### A — keep the direct import of the owner's exported operation (taken)

the prior round (`F16`, i004) moved the grammar INTO the route context and had the meter consume
it, so the meter no longer re-derives a byte of it. what remains is one subdomain that calls an
exported operation of another — which is how this repo composes `domain.operations/` subdomains
today:

| edge | on main? |
|---|---|
| `route/guard/review/runStoneGuardReviews.ts` → `../../../review/runOneReview` | ✅ yes |
| `review/meter/*` → `route/guard/*` | this branch |

### B — route both through `src/contract/`

🔴 forbidden by a sharper rule. `contract/` is this repo's TOP layer (`cli/`, `sdk/`), and
`rule.require.directional-deps` makes `domain.operations/ → contract/` an upward edge = blocker.
the rule's example (`job/JobQuote.ts imports … from contracts/`) names a layout this repo does not
have.

### C — a new `domain.operations/shared/`

a third home for two operations, with one reader each. `rule.prefer.most-common-denominator`: lift
on proven reuse, never speculatively; and `rule.prefer.wet-over-dry` for the abstraction itself.

## 🟡 .why 82%, not higher

- the lane is right that the edge now runs BOTH ways (`route` → `review` on main, `review` →
  `route` here). a cycle between subdomains is a real smell, even with no import cycle between files
- if the council wants a boundary, C with a readme is the shape — never B

## .the route → review half — `$targets` reads the diff through the review reader

the same lane (i005, blocker.2) also names `route/guard/review/setStoneGuardReviewTargets.ts`,
new here, which imports `review/getAllFileDiffsFromRange`.

- it adds no new DIRECTION. `route → review` is on main already (`runOneReview`); this is a second
  import along that edge, from the same subdomain
- 🔴 the reuse IS the feature. `$targets` exists so an enroll lane reads the exact list
  `rhx review --diffs since-main` computes. a second diff reader under `route/` is the drift the
  file was written to end — the prior prompt-authored list omitted untracked files and missed most
  of a feature
- a `shared/` lift for it is option C again: one reader per side, lifted on no proven third use

⇒ held under option A. the council may still order C for both halves at once; the two edges would
move together, and neither should move alone.

## 🟡 .what i005 shifts — C now has proven reuse on ONE of its three operations

the lane re-raised both blockers at i005 and refused A. it said the rule offers no carve-out for a
deliberate tradeoff. that argument does not move the verdict. but one fact does weaken the "C is
speculative" leg:

- `getAllFileDiffsFromRange` now has readers in TWO subdomains (`review/`, `route/guard/review/`).
  `rule.prefer.most-common-denominator` says to lift on the second reader. so for this one operation,
  a lift to a neutral home (e.g. `domain.operations/git/`) is the rule's own default, and not
  speculative
- the grammar pair (`asPeerReviewOutputParts`, `getAllPeerLevelsFromGuard`) stays owned by
  `route/guard`. the meter reads files the guard WRITES, so a lift would misplace the owner

⇒ confidence drops to **70%**. the council choice is now sharper: lift the diff reader alone (clean,
~10 imports), and keep the grammar edge under A.

## .what i006 settled

- ✅ **the diff reader is lifted** — `src/domain.operations/git/getAllFileDiffsFromRange.ts`. the
  route→review edge is gone; every importer reads the `git/` home
- the grammar edge stays under A, for the owner reason above
- the lane also named `runStoneGuardReviews` → `brain/getOneBrainChoicePinned`. that edge is not
  this fork's: `brain/` is a shared home, and it is argued in `F54`

## .what i014 settled — the grammar edge is reversed

- the owner argument above did not survive a second reader: the grammar serves the guard (write) and
  the meter (read), so its home is their common ancestor. `asPeerReviewOutputName` and
  `asPeerReviewOutputParts` moved to `src/domain.operations/review.peer/`
- `getAllPeerLevelsFromGuard` stays in `route/guard` and is injected into `getAllReviewerLevels` by
  `src/contract/cli/review._.cost.ts` — a downward edge from the contract layer
- ⇒ no `review/` file imports `route/`, and the diff reader was already in `git/`. option A retired

## .where

- `src/domain.operations/review.peer/asPeerReviewOutputName.ts` (lifted at i014)
- `src/domain.operations/review/meter/asReviewRunIdentity.ts`
- `src/domain.operations/review/meter/getAllReviewerLevels.ts`
- `src/domain.operations/git/getAllFileDiffsFromRange.ts` (lifted at i006)
