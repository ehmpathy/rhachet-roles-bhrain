# F30 — an inherited effort is unrecorded

**rework** = clean · **status** = ruled — option A · **confidence** = 85%

## .the fork

a brain is sticky (`F6`), and the drive names the inherited one from `DriveBrainInheritance { slug,
stone }`. an effort is equally sticky in the live session and persisted by neither field — so a drive
that dispatched `/effort medium` at stone 2 reaches stone 5 and says naught about the level.

| option | verdict |
|---|---|
| **persist the slug alone** | taken |
| A — add `effort` to `DriveBrainInheritance` | the honest record; a shape change to a persisted object |
| B — walk back over prior guards | a guard read per prior stone, per tick, for a value the dispatch held |
| C — read the live effort off the clone | no surface reports it (`F5`) |

## .taken, and why

the axis arrived after the record's shape settled. every extant state file lacks a new field, and the
under-report is a silence, never a false claim.

## .the counter-case

a silence about an effort reads as its absence, and the two are opposite states. `case=8` says the
record IS the deliverable, and the omission is worst where stickiness leaks most — across the
mechanical half of a route.

## .rework

clean — one field on one object, its projection in `setDriveEntryStone`, its read in
`applyStoneBrainOnEntry`. an absent field degrades to `null`, as `slug` already does.

## .where

`drive/DriveBlocker.ts` (`DriveBrainInheritance`) · `brain/setStoneBrain.ts` ·
`brain/asStoneBrainEffort.ts` · `drive/setDriveEntryStone.ts`

## .the verdict

ruled by the wisher — **parity with the brain**: the choice is recorded and rendered, so the effort is
too (`.seeds/inventory.of=seeds.case=S12-effort-parity-with-choice.md`). built as option A:

- `DriveBrainInheritance { slug: string | null; effort: string | null; stone }`
- `setDriveEntryStone` carries each axis on its own terms — a slug outlives an `/effort`; a level
  does not outlive a `/model`, since effort is model-scoped
- an older record with no `effort` reads as `null`; a record with neither axis fails loud
- clamps: `setDriveEntryStone.integration.test.ts` (the four-row carry table) ·
  `asDriveBlockerState.test.ts` · `applyStoneBrainOnEntry.test.ts`
