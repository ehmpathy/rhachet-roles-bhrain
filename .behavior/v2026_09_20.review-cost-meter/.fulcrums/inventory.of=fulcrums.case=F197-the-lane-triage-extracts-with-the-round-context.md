# F197 — the lane triage extracts with the round context

- raised 2026-10-09, from i033 r030 nitpick.3 `[nitpick][better]`: each level's lane triage in
  `runStoneGuardReviews` picks one of five outcomes and repeats the `onGuardProgress` emit in four
  skip branches; the branch order is an invariant held by statement order
- rework: 🔴 dirty
- status: 🟡 **BEST-GUESSED — disputed; overrule it to extract the triage now**
- confidence: **70%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — a triage transformer now** | `{ kind: 'approved' \| 'disputed' \| 'exhausted' \| 'reused' \| 'pour', artifact, review }`, one emit, a caselist that pins the order |
| **B — with F189's round context** | the triage reads six round-scoped values; extracted alone it takes them as a wide input that the round-context object then replaces |

## .taken, and why

**B.** the reviewer is right that this cut is narrower than F189, and the caselist is the real
gain. but its input is exactly the set of locals F189's round-context object exists to name, and
its two i/o reads (`getOneLatestReviewArtifactForSlug`, `getOneResponseNewerVerdict`) move with it.
two passes over one loop, a round apart, cost more than one.

## .rework, and why

**dirty.** the order — cache before exhaustion, dispute before exhaustion — gates passage
(`define.invariant.review.peer.passage`). a reorder slip in the extraction ships as a false
approval, and the guard acceptance snapshots cover each branch, so the move is a teardown of a
gate's tests, not a rename.

## .confidence, and why it is not higher

a fifth skip branch would be a fifth copy of the emit; if one lands before F189, A is overdue.

## .where

`src/domain.operations/route/guard/review/runStoneGuardReviews.ts:421-602` · F189

## .verdict

(open)
