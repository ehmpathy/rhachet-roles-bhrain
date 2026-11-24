# fulcrum F7: the two copy consts sit beside the extant urgent-copy family, not in a new leaf

## .the fork

- **A — beside the family**: `REMEDY_LABEL_BUDGET_GRANT` and `ASK_TEXT_BUDGET_NOTE` live in
  `genRouteGuardExhaustedReason.ts`, beside `WARN_TEXT_CONCESSION_URGENT_HEAD` / `_HARM` and
  `REASON_TEXT_CONCESSION_URGENT`
- **B — a new copy leaf**: hoist the copy into its own file (raised by `arch-opport-decomposition`,
  5.1 r004 nitpick.1), so `genRouteGuardExhaustedReason` holds only the reason contract

## .taken: A

- B with the two new consts alone splits one family across two files: the urgent halt would read
  head + harm from one module and label + note from another. that is a worse seam than today's
- B done whole moves the extant `WARN_TEXT_*` trio too, which ripples every reader of those
  consts — a refactor outside this wish
- the reviewer grades it a nitpick and names the extant pattern itself

## .rework: clean

a new leaf file plus import edits; no behavior, no render byte moves. a later change that touches
the family can hoist all of it in one move.

## .confidence: 80%, and why not higher

the reviewer's grain argument is sound: the module's name says "reason", and copy is not a reason.
if the wisher wants the seam clean now, B whole is a small, safe refactor.

## .where

- `src/domain.operations/route/guard/review/peer/genRouteGuardExhaustedReason.ts`

## .verdict

settled: A. B with the two new consts alone splits one family across two files; B whole moves the extant trio, a refactor outside this wish.
