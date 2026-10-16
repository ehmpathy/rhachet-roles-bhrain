# F194 — the run kind stays two optional fields until a fourth kind

- raised 2026-10-09, from i033 r031 nitpick.1 `[nitpick][better]`: `StepReviewInput` encodes
  whole · partition · prime as `partition?` + `prime?` beside `mode` and `meet`, so illegal pairs
  typecheck
- rework: 🔴 dirty
- status: 🟡 **BEST-GUESSED — disputed; overrule it to take the union now**
- confidence: **75%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — a discriminated union now** | `run: { kind: 'whole'; meet } \| { kind: 'partition'; partition } \| { kind: 'prime'; partition }` — the compiler rejects `prime` with no partition, `prime` in plan mode, `partition` with `meet: 'join'` |
| **B — keep the two fields; union on the next kind** | two callers set them (`stepReviewByPartitions`, `getOnePrimeOfPartitions`), both by construction; no illegal pair is reachable today |

## .taken, and why

**B.** the reviewer states no harm ships, and the two sole writers build each field from one
shape. the union is the right end state; its cost lands now and its gain lands on the next kind.

## .rework, and why

**dirty.** `StepReviewInput` is read at four sites in `stepReviewOfScope` and one in
`stepReviewOfCompiled`, and `stepReviewOfScope` re-enters itself through `runOne`. the "never split
twice" rule (`isPartitionRun: !!review.partition`) and the prime branch would both rethread under
the partition and prime clamps — a contract change across the review's spine, mid-round.

## .confidence, and why it is not higher

a fourth kind (a re-split, a warm-only run) would make the union cheaper than another flag, and one
may arrive before this branch merges.

## .where

`src/domain.operations/review/StepReviewInput.ts` · `stepReviewOfScope.ts` · `stepReviewOfCompiled.ts`

## .verdict

(open)
