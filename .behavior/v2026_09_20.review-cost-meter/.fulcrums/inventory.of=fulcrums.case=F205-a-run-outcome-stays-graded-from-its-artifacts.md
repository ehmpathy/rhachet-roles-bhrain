# F205 — a run's outcome stays graded from the artifacts it left

- raised 2026-10-10, from i035 r031 nitpick.3 `[nitpick][better]`: `refused` and `unknown` reach the
  meter only as absent files; the reviewer asks the writer to record the outcome positively
- rework: 🔴 dirty
- status: 🟡 **BEST-GUESSED — deferred; dream caught**
- confidence: **70%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — write the outcome positively** | a refusal record, or a realized record with `unmeasured: N`; the meter grades from it and `--of run` can say why a run is unknown |
| **B — keep the three-file grade** | correct today and clamped; a new artifact must remember to act as a witness |

## .taken, and why

**B, for this round.** the change is a new run artifact contract: the writer, the reader, a legacy
path for every run already on disk, and the snapshots of every `--of` breadth. that ripples past
this diff. the dream records the shape.

## .rework, and why

**dirty.** a new log artifact plus a legacy reader, across three breadths.

## .confidence, and why it is not higher

the reviewer is right that the fragility is structural, and the prime and the partition split are
two recent spends that each had to remember the witness rule.

## .where

`src/domain.operations/review/stepReviewOfCompiled.ts` ·
`src/domain.operations/review/meter/getOneReviewRunGrade.ts` ·
dream `.dream/v2026_10_10.feat.review-run-outcome-is-recorded-positively.md`

## .verdict

(open)
