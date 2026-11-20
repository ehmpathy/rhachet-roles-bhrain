---
case: F11
rework: clean
ground: wrong
confidence: 0.80
status: superseded
owed: none
holds: []
lean: the verdict ledger lives at .fulcrums/verdicts.jsonl, tracked, beside the yaml it proves
verdict: null
---

# F11 — the verdict ledger is tracked, beside the fulcrums it proves

## .the fork

the verdict ledger first sat at `$route/.route/fulcrum.verdicts.jsonl`, which is gitignored. a
yaml verdict ships in the fulcrum file, so any clone without the ignored ledger read a real verdict
as forged (behavior-intent-coverage i001 nitpick.4).

- A: move the ledger to `$route/.fulcrums/verdicts.jsonl`, tracked, so proof travels with the claim
- B: keep it ignored, and let the linter trust a verdict it cannot prove off-machine
- C: write verdicts as PassageReport rows, as the vision sketched

## .taken, why

A. B fails open on every other clone. C keys a verdict to a stone, while a verdict is keyed to a
case that may span stones. a tracked file beside the yaml is the one place both travel together.

## .rework, why

clean. the path is one constant, `FULCRUM_VERDICT_LEDGER_NAME`, and the linter skips the ledger by
that same name.

## .confidence, why low

a tracked ledger can be hand-edited as easily as the yaml; it proves a human lever ran only as far
as the review of the diff that wrote it. that holds for any file-based proof. 80%.

## .where

`src/domain.operations/route/fulcrum/getAllFulcrumVerdictRows.ts` · `setFulcrumVerdictRow.ts`.

## .superseded by

F17. the ledger is tracked still, but sits at `$route/.route/fulcrum.verdicts.jsonl` under the
route seal, allowlisted by the route gitignore — so it travels with the claim and the driver's own
tools cannot write it.
