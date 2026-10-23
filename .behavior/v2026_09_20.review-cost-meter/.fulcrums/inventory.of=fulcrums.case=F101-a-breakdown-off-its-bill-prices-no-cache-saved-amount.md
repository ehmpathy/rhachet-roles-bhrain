# fulcrum F101 — a cost breakdown that does not sum to its bill prices no cache saved amount

- rework = **clean** — one guard in `getOneCacheSavedPriceWherePriced`, one transformer
- status = 🟡 **BEST-GUESSED 2026-10-05 — option B: exact reconciliation, else unpriced**
- confidence = 🟡 **85%**
- raised.by = self, at the 5.3 ergonomics re-capture (`--of run --json`)

## .the cue that fired

`rhx review._.cost --of run --json` on a fresh openrouter run read `cacheGet: 1280` beside
`cacheSaved: "USD 0.000_000_000"`. its `metrics.realized.json`:

| dimension | figure |
|---|---|
| input (2,077 tok) | `$0.000623100` |
| cacheRead (1,280 tok) | `$0.000384000` — the SAME $0.30/M as input |
| output | `$0.000452000` |
| sum of parts | `$0.001459100` |
| **total (billed)** | **`$0.000236230`** — ~1/6 of the parts |

`rhachet-brains-openrouter`'s `asCashWithSupplyTotal` documents why: its breakdown per token kind is
a spec-rate estimate, and only the total is replaced by the charge openrouter billed. so the
meter's cache-saved quotient, documented as a run's own measured rate, was a rate card for every
run on the default brain — and a card that prices a cache read at the full rate reads every such
run as `saved: $0`. the warmer sums `saved`, so every warmed openrouter review would have read as
worthless.

## .the fork

| option | what it does | cost |
|---|---|---|
| A — leave it | `saved: $0` on every openrouter run | 🔴 a projection rendered as a measured nil; the warmer verdict reads a loss it never measured |
| **B — exact reconciliation** ✅ | price only where the four parts sum to the total, to the last minor unit; else `null` (unpriced, an extant render path) | an honest supplier that ROUNDS its parts would read unpriced too — a lost figure, never a false one |
| C — a tolerance (e.g. 1%) | admits rounded breakdowns | a tolerance is a number nobody measured; and openrouter's gap is 6×, so no tolerance was needed to catch it |
| D — derive cache-read from the total | back out a rate from `total` | 🔴 two unknowns (input rate, cache rate), one equation — it would invent a figure |

taken: **B**. fireworks artifacts reconcile exactly (`$0.012794320 + $0.001124640 = $0.013918960`),
so the discriminator costs the reconciled corpus naught. a false `null` hides a figure; a false
`$0` states a wrong one — the asymmetry `rule.forbid.failhide` settles.

## .confidence, and why it is not higher

- 🟡 n=2 suppliers checked (fireworks reconciles, openrouter does not). a third supplier whose parts
  round to fewer decimals than its total would read unpriced under B — a coverage loss, recorded here
- 🟡 the real fix is upstream: if the package wrote measured parts from openrouter's usage payload,
  B would price them with no change here

## .where

- `src/domain.operations/review/meter/isRunCostBreakdownReconciled.ts` (+ `.test.ts`, 3 cases)
- `src/domain.operations/review/meter/getOneReviewRunMeter.ts` — the guard
- `src/domain.operations/review/meter/getAllReviewRunMeters.integration.test.ts` `[case9]` — the
  clamp; with the guard disabled it reads `USD 0.000_000_000` and goes red, restored it is 28/0/0
- `src/contract/cli/reviewCost.acceptance.test.ts` — the fixture now writes a reconciled
  breakdown (four parts, total = their sum); only the fixture totals moved in its snapshot

## .verdict

open — for the council.
