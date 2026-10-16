# F191 — the retry policy and the watermark transit unify later

- raised 2026-10-09, from i031 r031 nitpick.1 + nitpick.2, both `[nitpick][better]`, and both
  state outright that no harm ships today
  - n1: three retry layers, and the outer one (`withOneRetryOnBrainCallFault`) re-runs a partition
    on any `ReviewBrainCallError` rather than ask the inner classifier
    (`isErrorOfTransientBrainFault`); it reads a `finishReason` metadata string to tell a spent
    runaway retry apart
  - n2: five watermark read-then-write sites hand-build the hold, where one
    (`setReviewWarmerRecord`) already takes a pure `transit`; `setOneReviewWatermarkRaw` is
    exported; `getOneGatherOfLeader` writes inside its hold under a `get` name
- rework: 🔴 **dirty**
- status: 🟡 **BEST-GUESSED — deferred, disputed**
- confidence: **75%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — unify both now** | one retry policy, one watermark transit; the convention becomes a type |
| **B — defer both** | each change rethreads a concurrency seam the prime meet and the warmer depend on; land it in a round whose subject is that seam |

## .taken, and why

**B.** both points are maintenance with no harm today, by the reviewer's own count: every write
sits inside a hold on the same key it writes, the lane bound caps the outer retry, and swallowed
faults are added into spend. the repair for each is a contract change:

- n1 wants `ReviewBrainCallError` to carry a typed retry verdict the inner layer sets, which
  changes the error contract four call sites read and the retry counts the meter reports
- n2 wants a generic `setOneReviewWatermarkOfTransit<TShape, T>` and five sites rewritten as pure
  transits, under the prime meet's race clamps (two lanes see no claim, both lead) — the exact
  behavior a slip would break

on a branch already this wide, each belongs to a round whose whole subject is that seam, with its
race clamps run red→green against the new shape.

## .rework, and why

**dirty.** n1 moves the retry decision across a layer boundary and changes how many asks one
partition can make; n2 rewrites every hold site of the prime meet and the warmer record. both are
guarded by concurrency integration suites, not by types.

## .confidence, and why it is not higher

- n2's rename of `getOneGatherOfLeader` alone is clean, and could ride ahead of the rest
- n1's double-charge of a schema-fail reply is a real (small) spend; a later meter read may show
  it larger than assumed here

## .where

`src/domain.operations/review/partition/withOneRetryOnBrainCallFault.ts` ·
`getOneReviewAnswerOfBrain.ts` · `asReviewBrainCallFault.ts` · `review/watermark/` ·
`review/prime/meet/` · `review/warmer/setReviewWarmerLane.ts` · `setReviewWarmerRecord.ts`

## .the i032 additions

| lane | point | why it joins this fulcrum |
|---|---|---|
| r031 n1 | the retry still uses its own classifier (now skips a runaway reply) | same seam as i031 n1 |
| r031 n2 | the watermark transit, second raise | same seam as i031 n2 |
| r031 n3 | the warmer's stop rules split between the loop and `getOneWarmerWakeVerdict` | the three inline retire branches read the watermark (fault · superseded · displaced), so a lift into the pure verdict rethreads the same transit seam n2 names. one round, one subject |

the plan-cannot-begin retire row, raised by r030 at i032, did NOT wait: it moved to one domain op,
`setOneWarmerRetireBeforeBegin`, used by both the boot path and the poke loop, with its own clamp.

## .verdict

(open)
