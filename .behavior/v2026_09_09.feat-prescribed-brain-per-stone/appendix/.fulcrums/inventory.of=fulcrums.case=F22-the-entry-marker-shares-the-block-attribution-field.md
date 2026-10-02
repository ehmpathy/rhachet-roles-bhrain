# F22 — the brain entry marker SHARES `DriveBlockerState.stone` with push-block attribution

- raised 2026-09-16, at peer review i022 (`enroll-impl-arch-defects` nitpick.3)
- rework = 🔴 **dirty**
- status = open
- confidence = **70%** — the lowest open call on this route

## .the fork, stated fairly

`DriveBlockerState.stone` now serves two unrelated concerns, with two writers and one reader:

| role | op | what it says by `.stone` |
|---|---|---|
| writer 1 | `setDriveBlockerState` | *"which stone attributed the current push-block streak"* — its historical job |
| writer 2 | `setDriveEntryStone` | *"the stone whose brain was just dispatched"* — this feature's entry marker |
| reader | `applyStoneBrainOnEntry` | the **entry edge**: `stateBefore.stone !== stone.name` |

> **split it** — add a distinct `brainEnteredStone`, so each concern owns a field
> **or keep it** — one field, one comment that names all three relations

## .what was taken, and why AT THE TIME

**kept, with the relation documented on the object** — `DriveBlocker.ts:13-32` names writer 1,
writer 2, the reader, and the dream it collides with, in the type's own header.

the reasons, in the order they weighed:

- **the read semantics are identical, and that is not a coincidence.** both writers stamp
  *"the stone this file last saw"*. the entry gate wants exactly that, which is why `F7` found the
  field usable at all rather than had to add persistence
- **a split adds a second field to a PERSISTED record**, so it touches the object, both writers,
  the reader, `asDriveBlockerState`'s parse, and the snapshot — for a hazard that is today a
  **maintenance** concern rather than a live defect
- **it collides with an OPEN dream on the same field.**
  `.dream/v2026_09_09.fix.drive-blocker-count-never-resets-on-stone-change.md` would reset `count`
  when `.stone` changes. ⇒ **to split the field now would fork that dream** — its author would
  inherit two fields and have to decide which one gates the reset, with no context for why there
  are two

## 🔴 .why the rework is DIRTY

`DriveBlockerState` is written to disk (`.route/.drive.blockers.latest.json`) and survives a
session. so a split is not a rename:

- a state file written by the old shape is read by the new one, and `brainEnteredStone` is absent
  → the entry gate reads `undefined !== stone.name` → **true on the first tick after the upgrade**
  → one redundant dispatch per route in flight. benign under `F14`, and still a behavior change
  nobody asked for
- the snapshot that pins the record's shape moves with it
- ⇒ **reversal is a teardown of a persisted contract, never an edit**

## .the counter-case, stated as strongly as it deserves

🔴 **the lane's argument is good, and it is the one I would expect to prevail at a council.**

> *"the domain object's own comment is admirably honest that this one on-disk field now serves two
> unrelated concerns … that is a decompose-for-recompose smell stated in its own words: two
> independent dreams now collide on one field. Given this feature is the second writer to land, this
> was the natural point to split."*

three things it has right:

1. **a comment is not a constraint.** it names the relation and enforces naught — a future writer
   who never opens the type can still break the reader
2. **the cost only rises.** a third writer makes the split dearer, and the field has gone from one
   writer to two in one feature
3. 🔴 **"the second writer to land" is the honest moment.** a shared field deferred at its second
   writer is a shared field deferred forever, and the dream collision argues *for* the split as
   easily as against it — the next contributor could just as well want two clean fields

⇒ what the counter does **not** have: a live defect. the two writers agree on the value's sense
today, so the hazard is that they might stop to — a maintenance-class concern, and
`rule.forbid.overzealous-blockers`' own line (the lane graded it a nitpick itself).

## .where it is

- `src/domain.operations/route/drive/DriveBlocker.ts:13-32` — the documented relation
- `src/domain.operations/route/drive/setDriveBlockerState.ts` — writer 1
- `src/domain.operations/route/drive/setDriveEntryStone.ts` — writer 2
- `src/domain.operations/route/brain/applyStoneBrainOnEntry.ts:56-58` — the reader

## .the verdict, once ruled

*(open — no wisher has ruled on this)*

## 🟡 .the process note this row exists to record

`rule.always.fix-forward-under-scouts-honor`: **a deferral for DIRT owes a dream AND a fulcrum.**
this deferral had a dream in the neighbourhood (`count-never-resets-on-stone-change`) and **no
fulcrum**, so the *judgment to defer* was unrecorded while the *work* was half-recorded.

⇒ and that dream is not this one's record: it is about the **count reset**, and this is about the
**field split**. a nearby dream reads as coverage and is not.

⚠️ **this is the third instance of the class `F20` and `F21` already name** — a cost or a shared
field deferred with a note in the code and no fulcrum. the note is real; a council cannot read code
comments.
