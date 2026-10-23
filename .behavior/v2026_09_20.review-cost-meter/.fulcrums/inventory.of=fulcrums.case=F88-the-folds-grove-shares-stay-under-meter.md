# F88 — the folds the grove shares stay under `meter/` this round

- rework = 🟠 **dirty** — eight or more operations move from `meter/` to `review/`, with every import across `meter/`, `grove/`, `warmer/`, the contract, and their tests rewritten
- confidence = 🟡 **80%**
- raised.by = `enroll-impl-arch-defects-review-ops` at i057, nitpick.1

## .the fork

`meter/` and `grove/` are peer subdomains under `review/`. some folds they share were lifted to
`review/` (`getOneCacheHitRate`, `getOneGradeCensus`, `getOneWarmersSeen`, `getOneWarmerValue`,
`asPromptInputsCensus`). others stayed under `meter/` while `grove/` imports them
(`getOneAccountedCost`, `getAllReviewRunMeters`, `getOneReviewRunMeter`, `getOneCostLeverFigures`,
`asCostColumnHuman`, `asCostLeverLines`, `WORD_OF_ABSENT`). no rule says where a shared fold lives.

| option | what it costs |
|---|---|
| A — lift every fold `grove/` consumes up to `review/`, so a `grove → meter/*` import is a visible smell | a rename across ~40 files and their tests, in a diff whose subject is the meter itself |
| B — defer A to a dream, keep the stone on its subject | the placement stays uneven until the dream lands |

## .taken — B

- no import cycle exists (`warmer/` never imports `meter/`; `meter → warmer` is one-way), and no
  reviewer names a wrong result — the cost is placement and discovery alone
- `rule.prefer.most-common-denominator` asks for the lift on proven reuse, and the reuse is proven;
  the deferral rests on ripple, not on whether the lift is right
- a move this wide in the same diff as the meter makes the meter's own review harder to read, and it
  re-opens every snapshot import path for no behavior change
- the work is caught: `dreams/v2026_10_03.refactor.lift-the-folds-grove-shares-from-meter-to-review.md`

## .why confidence is not higher

the lift is mechanical, and `sedreplace` makes an import move cheap. a reader may hold that a
mechanical move is clean by definition, and that the stone that grew the grove should leave it
placed evenly.

## .verdict

🟡 BEST-GUESSED 2026-10-03 — defer to the dream.
