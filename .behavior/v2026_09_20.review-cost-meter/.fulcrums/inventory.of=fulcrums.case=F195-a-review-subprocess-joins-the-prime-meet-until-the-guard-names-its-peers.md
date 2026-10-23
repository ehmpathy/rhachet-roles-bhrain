# F195 — a review subprocess joins the prime meet until the guard names its peers

- raised 2026-10-09, from i033 r030 nitpick.2 `[nitpick][better]`: `review.ts` sets
  `meet: 'join'` on `isReviewSubprocess`, which every `runOneReview` descendant inherits — a guard
  lane, but also a `review.by` rubric child or a clone's hand run
- rework: 🔴 dirty
- status: 🟡 **BEST-GUESSED — disputed; overrule it to move the signal now**
- confidence: **70%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — the guard passes an explicit signal** (`--meet join`, or a guard-only marker) | "has peers" is decided where the peers are known |
| **B — keep the inherited marker** | a non-guard descendant that joins finds no peer within the gather and pours solo |

## .taken, and why

**B, for this round.** the cost of a false join is bounded: a lone joiner leads its own meet, and
the late-lane reach (F187) is the only wait it adds. no spend is lost or under-reported — the meet
moves wall time, never the meter. the reviewer names no shipped harm.

## .rework, and why

**dirty.** a new flag crosses three contracts: the guard's command build
(`runOneStoneGuardReview`), the `review` cli parse and `--help`, and the shared `runOneReview`
runner that `review.by` also calls. each has acceptance snapshots of its args.

## .confidence, and why it is not higher

`review.by` aggregates are common, and each rubric child pays the gather for naught. a measured
round of `review.by` wall time would settle whether the wait is worth a contract.

## .where

`src/contract/cli/review.ts` (`meet:`) · `src/domain.operations/isReviewSubprocess.ts` ·
`runOneStoneGuardReview.ts` · `runOneReview.ts`

## .verdict

(open)
