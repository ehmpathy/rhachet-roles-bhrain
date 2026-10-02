# domain.term.choice.reason: route.stone.entry

## .etymology

`entry` reads directly from the wish's own bound language — apply the switch on stone ENTRY,
before any early return can bypass it. the mechanism it names is a state compare (recorded stone
≠ current stone), never a duration or an event log, so the word marks an EDGE.

rejected alternatives:

- `arrival` / `visit` — read as one-time events with no compare mechanism implied; either would
  suggest a log of every stone a driver has touched, where the real artifact is a single
  last-known-stone field checked against the present
- `start` — already claimed elsewhere in this repo for a route's own first stone (`route.drive`'s
  opening move), a different concept than a per-stone transition

## .disputes

none raised yet.

## .evidence

`DriveBlocker.ts:58` — the field's own doc: `.writer2 = setDriveEntryStone stamps it with the
stone whose brain was JUST [applied]`. `setDriveEntryStone.ts:7` names the field
`applyStoneBrainOnEntry`'s own `entered` boolean reads.

## .invariants

- an entry is recorded once per stone transition, never re-recorded on a same-stone tick
- an entry marks state on disk (`.route/.drive.blockers.latest.json`), never in memory alone, so
  a fresh session recognizes a stone it did not itself enter
