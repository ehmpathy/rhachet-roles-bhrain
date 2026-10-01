# F16 — an inherited brain is attributed to the stone that set it

**rework** = 🔴 dirty · **status** = ✅ settled 2026-09-17 — built · **confidence** = settled

## .the fork

`case=7` `[t2]` requires a stone with no `brain:`, after a switch, to name the brain it inherited and
the stone that set it.

- ship without it — the inherited brain is unattributed
- build the provenance state and render it

## .the best-guess, and why it lost

the best-guess was **ship without it**: `delDriveBlockerState` ran `fs.rm` on passage, the exact
boundary the record must cross, so a field on that state looked like no fix at all.

a peer reviewer raised it as a blocker — *"sticky-brain attribution (vision case=7) is not
implemented"* — and it was built. without it, `F6` ships the half that costs money and not the half
that makes the cost traceable, and `case=8`'s fourth obligation goes unmet.

the del was a defect, not a constraint: its own `.what` reads *"resets the drive blocker count to 0"*,
and the `fs.rm` over-reached that. ⇒ a dirty grade against a dependency's current behavior is worth
only as much as *"and may I change that behavior?"*

## .what shipped

| move | where |
|---|---|
| `DriveBrainInheritance { slug, stone }` on `DriveBlockerState` | `drive/DriveBlocker.ts`, `drive/asDriveBlockerState.ts` |
| written when a brain is requested, so its absence means naught was set | `brain/applyStoneBrainOnEntry.ts`, `drive/setDriveEntryStone.ts` |
| the `inherited` outcome, rendered as `brain = <slug>` in the where bucket | `brain/setStoneBrain.ts`, `drive/formatRouteDriveWhere.ts` |
| a per-route gate, so a route that declares no brain pays zero I/O | `brain/isRouteBrainDeclared.ts` |
| the del narrowed, so the record survives passage | `drive/delDriveBlockerState.ts` |

the clamp bites: with the preserve branch disabled, `delDriveBlockerState.integration.test.ts` went
5 passed / 2 failed — exactly the brain-survival rows. `case=10` stays byte-identical: the unlink
still runs when no brain was ever set.

⇒ the full entry: `../appendix/.fulcrums/inventory.of=fulcrums.case=F16-an-inherited-brain-ships-unattributed.md`
