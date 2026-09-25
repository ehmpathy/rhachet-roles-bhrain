# seed S14 — the freshness bar measures against the trigger

**status** live · **rules** `F02` → **the trigger's mtime** · **utterance** 1 · **on** 2026-09-18

## .said

> yeah, from trigger

## .settled

**the `X` in *"an mtime greater than X"* is the trigger report's mtime — the moment the review was
asked for.** an articulation counts as fresh when it was written **after the ask**, never merely
after some other file.

⇒ so the freshness bar reads: `articulation.mtime > trigger.since.mtime`.

| the candidate operand | what it would have meant | verdict |
|---|---|---|
| 🔴 **the trigger's mtime** | *"you wrote this after you were asked"* | ✅ **taken** |
| the artifact's mtime | *"you wrote this after the artifact last changed"* | 🔴 refused — see below |
| a fixed wall-clock age | *"you wrote this recently"* | refused — it expires a valid articulation for no reason |

## 🔴 .why the artifact's mtime would have re-created the round's own defect

the intuitive alternative reads well and is a trap: *"surely the review should postdate the artifact
reviewed."* **it would restore, on a new axis, exactly the harm this round exists to remove.**

- a driver reviews, finds defects, and **repairs the artifact** — as the guard's own prompt instructs
- the repair advances the artifact's mtime **past** the articulation they just wrote
- ⇒ their honest review is now graded **stale**, and they must rewrite it to say the same words

**that is the hash-key defect with a timestamp in place of a hash.** the driver who does the work is
charged for it; the driver who edits naught is not. ⇒ the operand is refused for the same reason the
hash key was, and the parallel is exact rather than merely suggestive.

## .the concept, stripped of this round

> **measure freshness against the ASK, never against the SUBJECT.**

an artifact under review moves **because** the review works. so any bar that measures a review
against the artifact it reviews penalizes the review for its own success.

⇒ the ask is the right operand because it is the one event in the interaction that the driver's own
diligence **cannot** advance. **a bar is only fair when the party under it cannot move the goalpost
by good work.**

## 🟡 .what this makes heaviest elsewhere

the bar reads `trigger.since.mtime`, so **whatever invalidates the trigger sets what this bar
measures against**. a trigger never invalidated writes its mtime once per `(stone, slug)`, and the
bar then compares every future articulation against a frozen instant.

⇒ so this answer depends on the rewind's removal of the trigger, and the two must ship together.

## .landed

- `.fulcrums/inventory.of=fulcrums.case=F02-what-x-the-mtime-bar-measures-against.md`
- `.fulcrums/inventory.of=fulcrums.case=F10-what-invalidates-a-hashless-trigger-report.md`
- `1.vision.experience.case=6.the-stale-articulation-predates-the-ask.md`
- `1.vision.experience.dimensions.md` · `1.vision.yield.md`
