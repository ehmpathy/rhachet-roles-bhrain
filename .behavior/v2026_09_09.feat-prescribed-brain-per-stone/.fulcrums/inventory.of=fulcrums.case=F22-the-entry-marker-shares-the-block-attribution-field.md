# F22 — the entry marker shares `DriveBlockerState.stone` with push-block attribution

**rework** = 🔴 dirty · **status** = open · **confidence** = 70%

## .the fork

| role | op | what `.stone` means to it |
|---|---|---|
| writer 1 | `setDriveBlockerState` | the stone that attributed the current push-block streak |
| writer 2 | `setDriveEntryStone` | the stone whose brain was just dispatched |
| reader | `applyStoneBrainOnEntry` | the entry edge: `stateBefore.stone !== stone.name` |

- **split** — a distinct `brainEnteredStone`
- **keep** — one field, the relation documented on the type

## .taken, and why

**keep**, documented in `drive/DriveBlocker.ts`'s header.

- both writers stamp *"the stone this file last saw"* — the entry gate wants exactly that (`F7`)
- a split touches a persisted record, both writers, the reader, the parse, and the snapshot, for a
  maintenance hazard with no live defect
- it collides with `.dream/v2026_09_09.fix.drive-blocker-count-never-resets-on-stone-change.md`, which
  resets `count` on a `.stone` change — a split forks that dream

## .rework — dirty

the record persists across sessions. an old file read by a new shape lacks `brainEnteredStone`, so
the gate fires on the first tick after upgrade: one redundant dispatch per route in flight — benign
under `F14`, still an unasked behavior change.

## .the counter-case — likely to prevail

- a comment names the relation and enforces naught
- the cost only rises — the field went from one writer to two in one feature
- a shared field deferred at its second writer is deferred forever

what it lacks: a live defect — the two writers agree on the sense today.

## .the verdict

open — rule it first; `F21` and `F23` land inside whichever contract it picks.
