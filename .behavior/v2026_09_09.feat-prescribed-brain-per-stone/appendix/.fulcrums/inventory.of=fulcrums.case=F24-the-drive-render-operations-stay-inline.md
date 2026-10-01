# fulcrum F24 — the drive render operations stay inline

**raised** 2026-09-17, on i033 `r004` (`arch-opport-decomposition`) nitpick.1
**rework** = 🔴 dirty · **status** = open · **confidence** = 85%

## .the fork, stated fairly

ten pure render operations sit as private closures inside `stepRouteDrive`'s 1,100-line body:
`formatRouteDrive`, `formatRouteDriveBlocked`, `formatRouteDriveMalfunction`,
`formatRouteDriveExhausted`, `formatRouteDriveMalfunctionEscalate`, `formatRouteDriveEscalate`,
`formatRouteDriveBlockReason`, `formatRouteDriveNudge`, `formatRouteDriveComplete`,
`formatRouteDriveUnbound`.

| | the choice |
|---|---|
| **taken** | leave all ten inline. this round extracts what its own diff added and stops there |
| **rejected** | extract all ten into `route/drive/` leaf files, 20 new files, within this round |

## .what was taken, and why

**leave them inline**, because the CLEAN half of the scouts-honor test fails outright and the failure
is not marginal: **not one of the ten is this feature's code.** every one predates `brain:`, and the
ask is aimed at the neighbours of the diff rather than at its content.

⇒ a 20-file restructure of the drive render surface, ridden in under a per-stone-brain change, is the
*smuggled refactor* `rule.always.fix-forward-under-scouts-honor` grades a **blocker**.

## .the counter-case, and it is real

the reviewer's argument holds on the merits, and three points of it are checkable rather than a taste:

1. **the convention already exists one directory over.** `drive/formatRouteDriveMixedHalt.ts` is a
   named file with a named test, and ten of its peers are closures. ⇒ the split is arbitrary today
2. **this very round extracted three of exactly this class** — `applyStoneBrain`,
   `composeStoneBrainRender`, `asRouteDispositions`. ⇒ the round demonstrated it agreed with the grain
3. **the render surface this feature touched is one of the ten.** `formatRouteDrive` is where the
   brain line lands, so the diff opened that closure and left it a closure

⇒ **so the honest read is that this round made the inconsistency one op sharper.** a reviewer may
fairly ask why the grain was right for three ops and not for the fourth the diff reached into.

## .why it is dirty

| | cost |
|---|---|
| files | **20 new** — ten ops plus ten tests |
| the orchestrator | restructured, and its every free variable lifted to an `input:` |
| blast radius | **every drive output in every repo** — the ten between them render the whole surface |
| a reversal | a re-inline of ten ops and a delete of ten tests |

🟡 **and the risk is not zero even though the ops are pure.** each closure reads variables from the
orchestrator's scope; each lift is a place to change behavior by accident.

⇒ **the mitigation is real, and it is stated rather than smoothed:** every byte the ten emit is pinned
by `__snapshots__/stepRouteDrive.integration.test.ts.snap`, so a faithful extraction is a **zero-diff**
snapshot run. that makes the work mechanically verifiable — cheap to *check*, never cheap to *do*.

## .where

- `src/domain.operations/route/stepRouteDrive.ts` — the ten closures
- `src/domain.operations/route/drive/formatRouteDriveMixedHalt.ts` — the peer that already conforms
- `.dream/v2026_09_17.fix.route-drive-render-operations-are-private-closures.md` — the work

## .confidence, and why

**85%.** what is measured: the count, the grain, the extant peer file, the snapshot coverage. what is
a judgment is whether *"the reviewer is right and the change is out of scope"* is the correct answer
to a nitpick a reviewer will raise again next round.

⚠️ **the residual 15% is one specific risk: this returns every round as long as the code stands.** a
nitpick that is correct and deferred is a nitpick that is re-raised, and four rounds of a re-raise
cost more attention than the extraction would have. ⇒ **a wisher who expects several more rounds on
this stone may fairly rule the other way.**

## .the verdict, once ruled

*(open)*
