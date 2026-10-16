# seed S16 — the clock counts from the last REAL review, so a poke can be skipped

archived verbatim, before distillation (`rule.always.archive-the-wishers-words-verbatim`).

## .the utterance

> the warmer needs to count its execution attempts with a counter that starts from the last time
> the nominal review ran

and, on what to do when one ran too recently:

> if normal review ran within its duration, then skip that round and reschedule to ensure its
> again the `$duration` away from last run of reviewer

and the reason, in four words:

> to minimize redundant warms

## .what it did

🔴 **it moved the clock's origin off the warmer and onto the LANE.** every earlier draft counted
from the moment the warmer spawned. this counts from the last time **any act at all** refreshed
that prefix — and a nominal `rhx review` is one of those acts.

```
sinceTouch <  cadence   ⇒  DEFER, and re-aim at lastTouch + cadence
sinceTouch >= cadence   ⇒  poke
```

`sinceTouch`, never `sinceSpawn` and never `sincePoke`.

## 🔴 .why the genus had to be named

the defer rule cannot be stated without a word for *"any act that refreshes residency"*, because
it has two members that share no other name:

| the species | who sends it | what it wanted |
|---|---|---|
| a **poke** | a `warmer` | residency, and no output |
| a **nominal review** | `rhx review` | a verdict — residency is a side effect nobody asked for |

⇒ with no genus the rule must be written twice, and the second clause is the one an author
forgets. the utterance's *"from the last time the **nominal** review ran"* is what forced the
word: `touch`.

## 🔴 .the argument that makes it a law rather than a convenience

under LRU a read refreshes recency, and **a replica has no idea whether the read it served was a
warmer's poke or a driver's review.** the two are indistinguishable at the only layer that
matters.

⇒ so a clock that counted one and not the other would model a distinction the cache does not
make. the genus is not a nicety of prose; it is the grain the system beneath actually operates at.

## 🟡 .why DEFER and not SKIP

a skipped round would burn an attempt from a budget declared up front (`k` pokes), so a lane that
happened to be reviewed often would exhaust its warmer and send no poke at all.

⇒ a deferral is **not an attempt**. it re-aims the next wake at `lastTouch + cadence` and spends
no budget — which is what makes *"minimize redundant warms"* an economy rather than a cap.

## .the lesson

**the four-word reason carried more than the two-sentence mechanism.** *"to minimize redundant
warms"* is what identified the cost, and the cost is what settled that the clock reads the lane
rather than the process.

## .landed in

- `src/domain.operations/review/warmer/getOneWarmerWakeVerdict.ts` — `sinceTouchMinutes`
- `src/domain.operations/review/warmer/getOneReviewerLastRunAt.ts` — the review-species read
- `term=prompt.cache.touch._.choice._.md` — the genus this forced
- `0.wish.md` bar 16
