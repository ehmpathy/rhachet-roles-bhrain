# fulcrum F65 — fourteen level-3 nitpicks hold past this round

- rework = 🟢 **clean** — each held concern is an added test, an added comment, a hoist, or a file move a later round can land alone
- status = 🟡 **BEST-GUESSED 2026-09-28 — fix all four blockers and five nitpicks; hold fourteen, each by name**
- confidence = 🟡 **75%**
- raised.by = peer lanes at level 3, i016: `enroll-impl-behavior-intent-review-ops` r025 (2 blockers, 8 nitpicks) · `enroll-impl-arch-defects` r026 (0 blockers, 2 nitpicks) · `enroll-impl-arch-defects-review-ops` r027 (2 blockers, 9 nitpicks)

## .the fork

the four blockers each named a live harm and were fixed in code: a provider outage now wears
`💥 MalfunctionError:` (`ReviewBrainCallError`), its test asserts the header, a tree that vanishes
mid-scan now reads as a fault rather than a silent drop, and a presence fault on one run's prompt
now isolates to that run. five nitpicks were cheap and were fixed too: the hand-listed flag array
(r027 n1), the unbounded `on` plan (r027 n5), the header assertion in the timeout acceptance
(r025 n6), a unit test for `isTargetPayloadSent` (r025 n7), and the speculative root lift of
`isErrorOfWriteRefusal` (r026 n1). the fourteen below add coverage, restate a correspondence, or
refactor a shape that is correct today.

| option | cost |
|---|---|
| **A** — land all twenty-three this round | a seven-site refactor in `route/guard` outside the wish; four new test files; a warmer schedule change that needs its own measurement |
| **B** — fix every blocker and the cheap nitpicks; hold fourteen, graded `better` | each hold is a judgment, hence this row |

## .per concern

| lane | concern | disposition | why |
|---|---|---|---|
| r025 | nitpick.1 — the `found` branch omits the `--warmer off` hint | 🟡 **disputed** | a deliberate one-line collapse: the round that spawned the warmer already printed both next moves; a re-drive reports the pid it found |
| r025 | nitpick.2 — `logs:` names the warmer dir, not one run's log | 🟡 **disputed** | the dir holds one log per run and the newest sorts last; one `ls` away. no harm ships |
| r025 | nitpick.3 — `--of run` stdout omits `cacheSaved` | 🟡 **disputed** | the figure is in `--json`; the stdout line is held to one cost figure per run by design (F1) |
| r025 | nitpick.4 — no isolated test for `setReviewWarmerProcess` | 🟡 **disputed** | coverage gap, no defect. the spawn path is exercised by `genReviewWarmer.integration.test.ts` |
| r025 | nitpick.5 — `review.exhaustive-dirty` asserts no exhaustiveness | 🟡 **disputed** | a test on `main` before this branch, which changed only its brain slug to `…/latest`; its name is not this branch's claim |
| r025 | nitpick.8 — no case composes a deleted file with a polluter glob | 🟡 **disputed** | the reviewer states the two predicates compose by construction; coverage only |
| r026 | nitpick.2 — seven inline `onGuardProgress` shapes | 🟡 **disputed** | all seven sites stand identical at `HEAD`, before this branch — `git show HEAD:…` counts 7. a seven-site refactor of a shape this wish did not author is out of its scope |
| r027 | nitpick.2 — `emitReviewOverflowRefusal` imports from `meter/` | 🟡 **disputed** | the same placement gap `F61` already holds; the move lands with `F61` as one file move |
| r027 | nitpick.3 — three names for cache write / read | 🟡 **disputed** | the three are three contracts — the sdk's, the artifact's, the rollup's — each owned by its layer; the correspondence is correct today |
| r027 | nitpick.4 — the line-anchored close scan covers the escaped case only | 🟡 **disputed** | the reviewer bounds it to the legacy re-parse path; no live run reads through it |
| r027 | nitpick.6 — the `claim` verdict trusts a time window, not identity | 🟡 **disputed** | reachable only past a 60s boot stall; the argued window lives in the file's own `.note` |
| r027 | nitpick.7 — a touch is not filtered by brain | 🟡 **disputed** | a schedule refinement; it belongs with dream `v2026_09_27.feat.tune-the-warmer-policy-to-raise-cache-hits` |
| r027 | nitpick.8 — the head brief is rewritten per poke | 🟡 **disputed** | a few KB per 15m; the rewrite re-asserts the brief if the dir was cleared between pokes |
| r027 | nitpick.9 — three per-input classification tables | 🟡 **disputed** | each is exhaustive and compiler-enforced; the reviewer says fold them only if a fourth appears |

## 🟡 .why 75%

- a council may prefer r025 nitpick.4 and nitpick.8 as concessions — they are tests. they are held
  because each re-arrival re-runs a level-3 lane on a budget only the wisher may grow
- r027 nitpick.7 rests on the warmer-policy dream as its home; if that dream is ruled out, the filter is owed here
- r027 nitpick.2 rests on `F61`; if `F61` is ruled out, the move is owed here

## .where

- `src/domain.operations/review/warmer/emitReviewWarmerSpawn.ts` · `setReviewWarmerProcess.ts` · `getOneWarmerTetherVerdict.ts` · `getOneReviewerLastRunAt.ts` · `setOneWarmerPoke.ts`
- `src/domain.operations/review/meter/genReviewRunStdout.ts` · `getOnePromptSectionCharsFromCompiled.ts` · `getOneTargetCountFromCompiled.ts`
- `src/domain.operations/review/emitReviewOverflowRefusal.ts` · `stepReview.ts` · `asPromptSectionChars.ts`
- `src/domain.operations/route/guard/review/runStoneGuardReviews.ts`
- `blackbox/review.exhaustive-dirty.acceptance.test.ts` · `src/domain.operations/review/stepReview.casePolluters.integration.test.ts`
