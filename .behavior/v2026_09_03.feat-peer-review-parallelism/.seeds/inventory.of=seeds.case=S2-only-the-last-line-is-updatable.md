# seed S2 — only the last line is updatable

## .said — verbatim, unedited

> how does the stdout vision conform to the fact that we can only overwrite the last line in a review spinner?

> and we require the spiinner to say how long all has been inflight

> but only the last line can have a spinner

> and we want to know how many are left too

> but only the last line is updatable

⚠️ **typos and repetition preserved** (`spiinner`; the last-line constraint stated three times). the
repetition is itself the record — it was restated because the draft in front of the wisher broke it
each time.

## .settled — the concept, stripped of this route

**a terminal progress render owns exactly one mutable line: the last one.** every line above it is
sealed the instant it is written and can never be revised.

⇒ therefore a live status display for **N concurrent tasks** is not N spinners. it is **one spinner
that aggregates**, and it must carry:

| field | why it is owed |
|---|---|
| an **elapsed for the whole group** | not any one task's clock — *"how long all has been inflight"* |
| a **count of what remains** | *"how many are left"* |
| a **position that is always last** | the only place a mutable line may sit |

and completed work **appends above** the status line, which then redraws in place.

🔴 **the consequence that matters: multi-line cursor math is not needed for live multi-task
feedback.** the aggregate-tail design delivers it with a single `\r`, inside an append-only
discipline. a per-task spinner is what forces cursor-up redraw — so the cost that makes such a
renderer *"the costliest piece"* is an artifact of the per-task shape, not of live feedback itself.

## .landed

- `.behavior/v2026_09_03.feat-peer-review-parallelism/1.vision.yield.md` — `.what the driver actually watches`
- `.behavior/v2026_09_03.feat-peer-review-parallelism/1.vision.experience.case=8.the-onlooker-sees-several-in-flight.md`
- `.behavior/v2026_09_03.feat-peer-review-parallelism/.fulcrums/inventory.of=fulcrums.case=F4-the-renderer-is-subordinate.md`
