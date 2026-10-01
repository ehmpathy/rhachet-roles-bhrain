# F24 — the drive render operations stay inline

**rework** = 🔴 dirty · **status** = open · **confidence** = 85%

## .the fork

ten pure render operations live as private closures inside `stepRouteDrive`'s body —
`formatRouteDrive`, `…Blocked`, `…Malfunction`, `…Exhausted`, `…MalfunctionEscalate`, `…Escalate`,
`…BlockReason`, `…Nudge`, `…Complete`, `…Unbound`.

- **leave them inline** — this feature extracts what it added, and stops
- extract all ten into `route/drive/` — 20 new files

## .taken, and why

**inline.** not one of the ten is this feature's code; a 20-file restructure of the render surface
under a per-stone-brain change is the smuggled refactor `rule.always.fix-forward-under-scouts-honor`
grades a blocker.

## .the counter-case — real

- the convention exists one directory over: `drive/formatRouteDriveMixedHalt.ts`, and this feature
  added `drive/formatRouteDriveWhere.ts` beside it
- this feature extracted others of the same class (`asRouteDispositions`)
- the brain line lands in the drive render, so the diff reached into the surface and left its peers
  as closures

## .rework — dirty

20 files; every free variable lifted to an `input:`; the blast radius is every drive output in every
repo. every byte is pinned by `stepRouteDrive.integration.test.ts.snap`, so a faithful extraction is
a zero-diff snapshot run — cheap to check, never cheap to do.

## .confidence — 85%

the 15%: a correct, deferred nitpick is re-raised every round, and several re-raises cost more than
the extraction.

## .where

`.dream/v2026_09_17.fix.route-drive-render-operations-are-private-closures.md`

## .the verdict

open.
