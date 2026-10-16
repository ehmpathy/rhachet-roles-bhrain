# F280 — the warmer is covered in pieces, not end to end

- raised 2026-10-12, by `enroll-verif-snapshot-coverage` (blocker.3), at 5.3 i006
- rework: **dirty** — an end-to-end case spawns a detached child that pokes a live brain on a real cadence
- status: 🟡 **BEST-GUESSED — disputed as a blocker; the gap is caught as a dream**
- confidence: **80%**

## .the fork, stated fairly

the lane found no test that drives a legal `--warmer` through the CLI, lets the detached child poke,
and confirms a cheaper next round. it graded this `urgent`, monetary: a warmer that silently does
naught keeps a driver's spend.

| option | the claim |
|---|---|
| **A — dispute; catch the end-to-end case as a dream** | each link of the chain has a test, and the harm named is observable in the cost report |
| **B — write the end-to-end acceptance case now** | the one proof that composes the links |

## .taken, and why

**A.** the links, each tested:

- the poke loop — `setReviewWarmerPokes.integration.test.ts`: the head sent byte-identical to the
  run (`[case1]`), the budget spent then exit, the real cadence (`[case9]`), a review that lands
  between wakes (`[case4]`), each poke's `hit` recorded in the ledger (`[case2]`: a sliver served
  reads `hit: false`). the brain is stubbed at `choice.ask` only, with a stated `.mock`
- the spawn — `genReviewWarmer.integration.test.ts [case3]`/`[case4]`: a live detached spawn
- the boot refusals — `reviewWarmerSpawnRefusal.acceptance.test.ts`, 8 cases
- the cache effect itself — `stepReview.casePromptCache`: a repeated prefix reads 99.7% warm

the harm is not silent: every poke's `hit` lands in the ledger, and `rhx review._.cost --of tree`
renders the warmer row, so a warmer that warms naught reads as a cost with no hits.

## .rework, and why

**dirty.** a happy-boot acceptance case spawns a real detached child, waits a real cadence, and pays
live pokes. that is flake-prone and costs money on every CI run. it is caught as
`.dream/v2026_10_12.feat.warmer-happy-boot-acceptance.md`.

## .confidence, and why it is not higher

the lane is right that no one test composes the links. a defect in the seam between `review.ts` and
the detached boot — args mangled across the spawn — would pass every piece above.

## .where

`src/domain.operations/review/warmer/**`, `blackbox/reviewWarmer*.acceptance.test.ts`

## .verdict

— (awaits the council)
