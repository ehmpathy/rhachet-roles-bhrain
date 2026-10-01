# domain.term: route.stone.entry

term.chosen   = entry
term.kind     = noun
term.boundary = route.stone   # the edge a driver crosses when its current stone changes
term.synonyms.forbidden:
- arrival
- visit
- start

## .what

a **route.stone.entry** is the edge a drive tick crosses the moment its recorded stone differs
from the one it is on now. it is a compare, not a count or a timestamp: `applyStoneBrainOnEntry`
reads the last-recorded stone from `DriveBlockerState.stone`, compares it to the current stone,
and treats a mismatch as the entry — the signal that gates a fresh `onStop` brain dispatch.

- a same-stone tick is NOT an entry — no re-dispatch, no re-mark
- the marker (`setDriveEntryStone`) writes on the entry alone, so the block count still holds

## .refs

- src/domain.operations/route/brain/applyStoneBrainOnEntry.ts
- src/domain.operations/route/drive/setDriveEntryStone.ts
- src/domain.operations/route/drive/DriveBlocker.ts

## .reason

see the ref-level cluster beside this choice:

- `term=route.stone.entry._.choice.reason.md` — why `entry` over `arrival`/`visit`/`start`
