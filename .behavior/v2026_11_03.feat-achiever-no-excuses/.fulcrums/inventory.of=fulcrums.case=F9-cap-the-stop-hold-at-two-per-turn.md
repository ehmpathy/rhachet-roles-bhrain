# F9 — cap the stop hold at two per turn

- fork: (a) no cap: every onStop hold exits 2 for as long as its cause stands; (b) cap the hold at two per turn, then pass the stop with a note that names the held cause
- taken: (a) in the blueprint `.caveats`, left open with no row; ruled (b)
- why (b): an uncapped Stop hold that exits 2 can loop a clone that cannot reach the move it names, such as a dispatch whose owner is offline. nheuron's stop gates cap at two, and `razor.hold.check` lands with the same cap. two holds give the clone two turns to cure or dispatch; the note keeps the cause in view when the third stop passes
- rework: clean — one counter in the hook and one test case
- risk: none — a counter in a local hook state file; it touches no credential and writes no prod
- confidence: 100% — ruled by the director. before the verdict the blueprint's call sat under 93% with no row, which `rule.always.itemize-the-fulcrums-you-best-guess` forbids; this row repairs that
- where: `src/contract/cli/goal.ts` (the onStop halt of `goal.triage.infer` and `goal.triage.next`); the 5.1 plan in `3.3.1.blueprint.product.yield.md` (`.codepath tree`, `.the two clamps`)
- verdict: ruled 2026-11-20 by the director (nheuron.direction.rhachet-accelerate) — cap at two per turn, then pass with a note; the cap and its clamp land in 5.1 (uladkasach/nheuron, tree direction/rhachet-accelerate, `.route/v2026_10_18_directive_acceleration/verdicts/2026-11-20.rhachet-roles-bhrain.beav.feat-achiever-no-excuses.3.3.1.blueprint.coach.md`)
