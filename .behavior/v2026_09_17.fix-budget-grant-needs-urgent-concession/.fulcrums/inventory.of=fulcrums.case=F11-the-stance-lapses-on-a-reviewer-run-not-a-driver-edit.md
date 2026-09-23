# F11 · the stance lapses when the REVIEWER speaks again, never when the driver edits

- **rework** = clean · **confidence** = 90% · **status** = best-guessed

🔴 **this row was authored on a false premise and corrected at `r2` self-review.** it read *"the
order becomes `concede → budget → fix`, reversed from the wisher's `S11`"*, at 72%. the premise is
refuted by the operation it cited, and § *the correction* carries the record.

## .the fork

a grant is lifted by a **live** urgent concession. so: **what makes a stance lapse?** the answer
sets whether a driver may fix before it tops up, and the wisher's `S11` states a sequence that turns
on it — *drivers ask for more budget **after** their fixes.*

| option | what lapses a stance |
|---|---|
| 🔴 A | **a reviewer RUN that mints a new `.given` for that slug** |
| B | any artifact edit by the driver |
| C | a wall-clock or round-count window |

## .taken, and why

**option A, and it is read from the source rather than guessed.**

`getLiveReviewAbsorptions.ts:50-52` filters on one comparison:

```ts
pathGivenLatestBySlug.get(stance.reviewer) === stance.given
```

both sides are a **`.given` FILE PATH**. a given is written when the guard runs that reviewer — so
the key moves when **the lane speaks**, and at no other moment. its own `.note` at `:25-26` says
exactly this: *"the lane spoke again, so it re-raised (or dropped) the point on its own, and the
driver re-declares."*

⇒ **a driver's artifact edit mints no given, so it lapses no stance.**

## 🔴 .the consequence — `S11` is not reversed. it stands, unchanged

```
👍  concede urgent → fix → budget → re-arrive      # the stance is live throughout
```

the fix does not touch the key, so the grant lands. ⇒ the wisher's stated sequence works verbatim,
and the design imposes no new order on it.

## 🟡 .the residual constraint, which is real but narrow

the grant must precede the **next run of the lane that conceded** — never the fix.

| the lane's meter when the round runs | can the stance lapse before the grant? |
|---|---|
| 🔴 **exhausted** — the cell every refusal demo walks | **no.** the lane is skipped, so it mints no given. the stance cannot lapse |
| `live` — the `urgent × live` cell | yes: re-arrive, the lane runs, the stance lapses against its new given |

⇒ **at the cell this behavior exists for, the constraint is empty.** it bites only where a driver
holds an urgent concession on a lane with budget to spare, re-arrives, and *then* reaches for a
grant — which is `F10`'s already-named hole approached from the time axis.

## .the correction, and what it cost

| | the authored row | the corrected row |
|---|---|---|
| the premise | *"a driver's own artifact edit mints a new generation"* | ❌ **false.** the key is a given path; an edit writes none |
| the claim | the order **reverses** `S11` | ✅ `S11` stands verbatim |
| the demand it imposed | 🔴 a **rendered-copy requirement** — *"the halt that refuses a grant to a driver that just fixed must name the order, or this fulcrum ships as a trap"* | **withdrawn.** there is no such refusal to render |
| `1.vision.experience.case=2` | contradicted this row's order, in the same vision | ✅ **it was right all along** — the contradiction was the signal |

🔴 **the contradiction was visible inside the vision before the source was read.** `case=2` renders
`concede → fix → budget → re-arrive` and cites `S11`; this row rendered the reverse and cited the
same seed. ⇒ **two artifacts of one vision disagreed on a sequence, and neither cited the operation
that settles it.** that is the lesson worth more than the row.

## .rework, and why

**clean.** the correction deletes a copy requirement and adds none. no artifact was built on the
false premise beyond `case=7` `[t2]`, which is repaired in the same pass.

## .confidence, and why it is 90%

the predicate is two lines of shipped code, read directly, and its own `.note` states the rule in
prose that agrees with the code. **the 10%:** `computeUndeclaredConcerns` encodes the same rule
independently (`getLiveReviewAbsorptions.ts:28-32`), so a future divergence between the two is
possible, and the residual `urgent × live` constraint is argued rather than demoed.

⇒ **what would settle it:** a test that concedes urgent, edits the artifact, and asserts the stance
is still live. it is cheap, and the criteria stone owes it.

## .where

`1.vision.experience.case=2.the-lift.md` — the render that was right · `case=7` `[t2]` — repaired in
the same pass · `1.vision.yield.md` § *what is awkward* · `F10` — the `urgent × live` hole the
residual constraint approaches from the time axis

## .the verdict

_not yet ruled._
