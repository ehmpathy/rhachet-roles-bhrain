# fulcrum F64 — six behavior-intent nitpicks hold past this round

- rework = 🟢 **clean** — each held concern is an added test, an added comment, or a flag rename a later round can land alone
- status = 🟡 **BEST-GUESSED 2026-09-28 — fix two, hold six, each by name**
- confidence = 🟡 **75%**
- raised.by = peer lane `enroll-impl-behavior-intent`, i015 r024 (0 blockers, 8 nitpicks)

## .the fork

two of eight were live silent defaults and were fixed in code: `--trace` beside `--json` now
refuses (exit 2), and `review._.warmer` now refuses a flag outside its five (exit 1). the other
six add coverage or rename a contract; none ships a harm today.

| option | cost |
|---|---|
| **A** — land all eight this round | a flag rename on `review.by` changes a published cli contract; four new test cases each re-open a lane at level 1, which the wisher has closed to more budget |
| **B** — fix the two live defaults; hold the six, graded `better` | each hold is a judgment, hence this row |

## .per concern

| concern | disposition | why |
|---|---|---|
| nitpick.1 — `review.by` says `mode`/`paths` where peers say `--focus`/`--paths-with` | 🟡 **disputed** | a rename of a published flag. `F14` already holds the parser family; the rename belongs with that consolidation |
| nitpick.4 — no test proves a guard's `--output` makes a lane warmer-eligible | 🟡 **disputed** | coverage gap, no defect. the eligibility read is unit-covered; the guard wire is not |
| nitpick.5 — `stepReviewBy.integration.test.ts` asserts no warmer decline | 🟡 **disputed** | same class as nitpick.4 |
| nitpick.6 — no breadcrumb in `setStoneAsPassed.ts` that a warmer may spend after a halt | 🟡 **disputed** | disclosed in the wish and in dream `v2026_09_27.feat.tune-the-warmer-policy-to-raise-cache-hits` |
| nitpick.7 — no `$warmer` runtime guard var | 🟡 **disputed** | a new guard surface; no lane asks for it yet |
| nitpick.8 — `--warmer` has no blackbox coverage | 🟡 **disputed** | the spawn refusal is blackbox-covered (`reviewWarmerSpawnRefusal.acceptance.test.ts`); a blackbox spawn that spends is a paid test |

## 🟡 .why 75%

- a council may prefer nitpick.4 and nitpick.5 as concessions — they are cheap tests. they are held
  only because the wisher closed level 1 to more budget, and each re-arrival re-runs it
- nitpick.1 rests on `F14` as the home of the rename; if `F14` is ruled out of scope, nitpick.1 stays open

## .where

- `src/contract/cli/review.by.ts` · `src/contract/cli/review._.warmer.ts` · `src/contract/cli/review._.cost.ts`
- `src/domain.operations/route/guard/review/stepReviewBy.integration.test.ts`
- `src/domain.operations/route/setStoneAsPassed.ts`
