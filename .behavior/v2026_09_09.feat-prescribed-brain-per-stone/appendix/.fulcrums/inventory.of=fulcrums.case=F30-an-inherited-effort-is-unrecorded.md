# fulcrum F30 — an inherited EFFORT is unrecorded, so a sticky level renders as absent

**raised** 2026-09-25, at the execution stone — the `effort` axis made the record one field short
**rework** = ✅ clean · **status** = open · **confidence** = 85%

## .the fork, stated fairly

`F6` settled that a brain is **sticky**: a stone that declares none keeps the one a prior stone
dispatched, and the drive renders it with its attribution — *"brain = opus[1m], last set by
2.blueprint"*. that attribution is read off `DriveBrainInheritance`, which persists exactly two
fields: a `slug` and a `stone`.

🔴 **an effort is equally sticky in the live session and is persisted by neither field.**

⇒ so a drive that dispatched `/effort medium` at stone 2 and reaches stone 5 with no `brain:` renders
the brain it inherited and **says naught about the level it actually runs at**.

| | the choice |
|---|---|
| **taken** | persist the slug alone, and let the `inherited` arm carry no effort at all |
| **rejected A** | add an `effort` field to `DriveBrainInheritance` — the honest record, and a shape change to a persisted object |
| **rejected B** | re-derive the inherited effort by a walk back over the route's guards — a read of every prior guard on every tick |
| **rejected C** | read the live effort off the clone — no surface reports it (`F5` asks for the brain alone) |

## .what was taken, and why

**the argument is that the axis arrived after the record's shape was settled, and the under-report is
smaller than the churn of a persisted-shape change mid-stone.**

- `DriveBrainInheritance` is written into `DriveBlockerState`, which is read by every entry tick — a
  field added to it is a field every extant state file on disk lacks
- rejected B costs a guard read per prior stone, per tick, to recover a value the dispatch already
  held in hand
- rejected C is not available at any price today
- the under-report is a **silence**, never a false claim: the render omits the effort rather than
  reports a wrong one

## 🔴 .the counter-case, and it is real

**a silence about an effort is read as an absence of one, and the two are opposite states.**

`case=8`'s whole argument is that the record is what makes the cost claim provable. an inheritance
that reports `brain = opus[1m]` and omits the level lets a reader conclude the drive sits at the
brain's default — when it may sit at the `medium` a stone three back prescribed.

⚠️ **and the omission is worst exactly where the feature's value is largest.** `F6`'s stickiness is
what makes a rich brain leak forward across the mechanical half of a route; an effort leaks the same
way, and the record that would show it is the one field this fulcrum declines to add.

🟡 the counter to the counter: **no consumer reads an inherited effort today**, so the under-report
costs a reader's belief rather than a behavior. that is a real distinction and it is not a defense —
`case=8` says the record IS the deliverable.

## .why it is clean

one field on one domain object, plus its projection in `setDriveEntryStone` and its read in
`applyStoneBrainOnEntry`. the object is constructed at exactly one site and read at exactly one, and
an absent field on an extant state file degrades to `null` by the same nullable contract the `slug`
already uses for a brainless drive.

⇒ **no contract past this route moves, and no snapshot outside the brain suite shifts.**

## .where

- `src/domain.objects/Driver/DriveBrainInheritance.ts` — the two-field shape rejected A would grow
- `src/domain.operations/route/brain/setStoneBrain.ts` — the `inherited` arm, and the note that admits it
- `src/domain.operations/route/brain/asStoneBrainEffort.ts` — returns null on `inherited`, by the same bound
- `src/domain.operations/route/drive/setDriveEntryStone.ts` — the projection that would carry it

## .confidence, and why

**85%.** what is measured: the persisted shape, its single construct site, its single read site, and
that no consumer reads an inherited effort today. what is a judgment is whether a **silence** about a
sticky level is materially worse than the churn of a persisted-shape change — and that turns on how
often a route declares an effort at all, which nobody has counted because the axis is one round old.

⚠️ the residual 15%: a wisher may fairly rule that an axis added in the same round as its record
should be recorded in that round rather than earmarked, precisely because the churn is smallest
before any state file on disk carries the old shape.

## .the verdict, once ruled

*(open)*
