# define.invariant.review.peer.level-unlock-on-budget-exhaustion

## .what

a reviewer that was SKIPPED for want of budget MUST read as `exhausted` (terminal) in the level
gate — on every later pass, whatever the artifact hash has done since.

## .kind

**nurture.** the ladder could have been built so `rejected` is terminal-for-unlock, and it was
not. we chose that a rejected reviewer holds the level above it, and this invariant is what keeps
that choice from a deadlock.

## .invariant

```
skipped for want of budget  ⟹  verdict = exhausted (terminal)
ran this pass               ⟹  verdict = rejected  (non-terminal)
```

the two are one pass apart, and the pass between them is the one that spends the last round. that
pass RAN, so it reads `rejected` — `define.invariant.review.peer.exhausted` owns that half, and
this invariant does not touch it.

`isReviewPeerVerdictTerminal` makes `exhausted` terminal and `rejected` non-terminal, so the
verdict is the entire mechanism by which a higher level opens.

## .why — the hash cannot carry "was it skipped?"

the obvious test for *"did it run this pass?"* is *"is there a review artifact at the current
artifact hash?"*, and it is wrong in one direction that matters:

| the reviewer | artifact at current hash? | truth |
|---|---|---|
| ran this pass | yes | ran |
| skipped, and the artifact moved since | no | skipped ✅ |
| 🔴 **skipped, and the artifact did NOT move since** | **yes** — its own stale rejection | **skipped** ❌ read as ran |

⇒ the third row is a **deadlock, and it is stable**: the reviewer reads `rejected`, `rejected` is
non-terminal, the level above never opens, and the driver cannot move the hash because the only
work left is at the level that will not open.

⚠️ **and it is reached by ordinary work, not by an edge case.** a driver who spends a reviewer's
last round, then re-arrives to answer a *different* reviewer's blocker, has not touched the
artifact — so the hash is unmoved and the third row is exactly where they land.

## .enforcement

the authoritative record is the `exhaustedReviewerSlugs` set that `runStoneGuardReviews` pushes to
as each level settles. read it FIRST, in every verdict computation:

```ts
const wasExhausted =
  exhaustedReviewerSlugs.includes(pr.slug) ||
  (!artifactThisPass && rounds >= pr.budget);
```

## 🔴 .the second clause is a floor, and `reviews` is not what its name suggests

the obvious in-process test for *"did it run this pass?"* is *"is it in the `reviews` array?"*, and
it does not work either:

> a level's settle pushes the artifact each member should **DISPLAY**. for a member skipped for
> want of budget, that is its own stale cached review — pulled by `reviewForDisplay` and merged
> through `artifactByIndex`.

⇒ **so a skipped reviewer IS in `reviews`**, and any `!reviews.find(...)` test reads it as a run.
name the variable `artifactThisPass`, never `freshReview` — the array is a render input, not a run
log.

the second clause survives only as a floor for a reviewer at a level that has not settled yet,
where the set cannot hold it. once the level settles it falls silent, and the set carries every
case.

⇒ **measured 2026-09-16.** disable the first clause, leave the second, and **8 assertions across
`[t2]`, `[t3]`, and `[t4]` go red** — the hash-CHANGED cases among them, which the second clause was
written to cover and does not.

## 🔴 .the judge is a SEPARATE process, and it has no set

`route.stone.judge` computes its own verdicts through `getAllReviewPeerMeterStatuses` with
`exhaustedReviewerSlugs: null`, because it runs as its own process and inherits no in-memory
record. there its fallback is the hash test, and **it must stay the hash test**:

```ts
: !hasReviewForCurrentHash && rounds >= reviewer.budget
```

⚠️ **do not "fix" the judge by a relaxation to a bare `rounds >= budget`.** it looks like the same
repair and it is a different defect: it reads a reviewer that ran and spent its last round as
`exhausted` **on the pass it ran**, which inverts `define.invariant.review.peer.exhausted` and
unlocks the level above a full pass early.

⇒ **measured 2026-09-16.** that exact relaxation moved `[t1]`'s judge reason from
`blockers exceed threshold (1 > 0)` to `review level 3 not yet run (still queued)` — l1 read
`exhausted` on the round it ran, level 3 read as unlocked-but-unrun, and the judge reported the
wrong cause. every assertion in `[t1]` still passed; only the snapshot caught it.

**the judge does not need the relaxation.** the deadlock above is a *level unlock* failure, and
unlock is decided in `runStoneGuardReviews` — by the time the judge runs, the higher level has
already poured and has its own artifact at the current hash.

## .the counter-argument

`define.invariant.review.peer.exhausted` says a review that RAN is `rejected`, never `exhausted`,
and it is right. this invariant does not weaken it — it governs the passes **after** the run, and
it defers to that invariant on the run's own pass via `!freshReview`.

## .what would overturn it

a design where `rejected` is terminal-for-unlock. that removes the deadlock outright and changes
what the ladder means: a rejected reviewer would no longer hold the level above it. it is a real
option and it is not the one we took.

## .the clamp

`blackbox/driver.route.peer-budget-exhaustion-unlocks-level.acceptance.test.ts` `[t4]` — an arrival
with **no artifact change**, after l1 is spent. it goes red under a hash-only test (l3 reads
`awaits arrival` forever) and green with the set read first.

⚠️ `[t1]` in the same file is the clamp on the opposite error, and it is a **snapshot** rather than
an assertion — which is why that snapshot must not be re-baselined without a read of its judge
reason.

## .see also

- `define.invariant.review.peer.exhausted` — the half this defers to
- `define.invariant.review.peer.passage` — pass ⟺ every peer guard terminal
