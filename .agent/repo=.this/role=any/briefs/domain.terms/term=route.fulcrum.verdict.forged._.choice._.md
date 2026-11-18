# domain.term: forged

term.chosen   = forged
term.kind     = adj
term.boundary = route.fulcrum.verdict
term.synonyms.forbidden:
- unproven
- fake
- tampered

## .what
a **forged** verdict is **a yaml `verdict` on a fulcrum that the newest verdict ledger row does not
prove.** only `rhx route.fulcrum.rule` writes a verdict, and it writes the ledger row first, so a
verdict with no matched row came from a hand edit.

a forged verdict reads as unruled at every gate, and the onStop linter holds the stop until the
driver sets `verdict: null` again.

## .refs
- src/domain.operations/route/fulcrum/isFulcrumVerdictProven.ts    # the proof
- src/domain.operations/route/fulcrum/asRouteFulcrumDisputeState.ts # the `forged` bucket
- src/domain.operations/route/fulcrum/getOneRouteFulcrumLintMessage.ts # the lint block

## .reason
- `term=route.fulcrum.verdict.forged._.choice.reason.md`
