# fulcrum F3 — key the debt to the latest given per slug

- **rework** = **clean** — the key lives in one pure function (`## .rework, and why`, below)
  ⚠️ 🔴 **this field was authored `dirty` on 2026-09-08 and corrected the same day, by the sweep that
  added it.** the error was a wrong TEST: *"it reverses a prior author's written decision"* is a
  statement about **consequence**, and `dirty` measures **what a reversal cannot restore**. ⇒ the
  entry's own body said `clean` all along, and so did the summary — **the new field was the sole
  dissenter, and it was mine**
- **status** = ✅ **RULED 2026-09-08 — taken.** the wisher's words are in `.the verdict`
- **confidence** = ✅ **95%** — 88% → 78% (a discharge path proved unreachable) → 80% (doubt 3
  measured) → 95% (**doubt 2 dissolved**: path 1 is unilateral, so the absent no-actor path costs
  one file and one command). residual = doubt 3's `i1000` bound
- **where** = 🔴 `git show HEAD:src/domain.operations/route/guard/review/peer/getRouteGuardReviewPeerContemplationStatus.ts` **lines 82-84** — the rationale this reverses, **verbatim**:

  > *"givens are filtered to the CURRENT iteration hash so a stale prior-iteration given can never
  > block forever; a taken pairs a given by (slug, hash)."*

  ⚠️ **this field cited the live tree's `:84` until 2026-09-08, and that citation is now
  unfollowable.** it was accurate when written — but **this branch rewrote that comment IN PLACE**,
  so the line number survived while its content did not. `:84` now holds the *replacement*, which
  reads *"exactly TWO paths discharge a debt."* ⇒ **a wisher who followed it to check whether a prior
  author really wrote a guarantee would have found the text that replaced it, and no trace of the
  original** — it survives nowhere in `src/`, only in git.
- **found** = 1.vision

## .the fork, stated fairly

the debt must stop being keyed to `(slug, hash)`. three candidate keys:

- **latest given per slug** — for each reviewer, read only its most recent given. a `.taken` at
  that given's hash discharges it.
- **any unanswered given, ever** — union every given a reviewer ever wrote; each needs its own
  `.taken`. maximal strictness.
- **latest given per slug, plus a floor** — as the first, but a debt older than N iterations
  expires.

## .taken, and why at the time

**latest given per slug.**

- it preserves the property the hash filter was written for. `getRouteGuardReviewPeerContemplationStatus.ts:84`
  states its purpose: *"a stale prior-iteration given can never block forever."* a latest-per-slug
  read keeps that, because a reviewer that re-runs clean replaces its own latest given, and the
  debt clears with no `.taken` at all.
- **any-given-ever** breaks it. a blocker from iteration 3 would still demand an answer at
  iteration 30, even after the reviewer withdrew it twice. that is the eternal block the original
  author feared, and it would be a real regression.
- **the floor variant** buys no property the first lacks, and adds a tunable nobody can set from
  evidence.

it also repairs a second, opposite defect for free: an answered critique stays answered across an
edit, rather than a turn to `stale` that demands a re-articulation the reviewer never asked for.

## .rework, and why

**clean.** the key lives in one pure function
(`getAllRouteGuardReviewPeersUncontemplated`) plus one communicator
(`getAllRouteGuardReviewPeerGivensAtHash`). both are read by a single orchestrator. to swap the key
touches three files and no contract.

## 🔴 .the third discharge path does not exist — caught by the wisher, 2026-09-07

the `.taken` above rests on this clause: *"a reviewer that re-runs clean replaces its own latest
given, and the debt clears with no `.taken` at all."*

**it is unreachable, and one question found it:** *"how could we ever reach this? didnt we block
re-entry if the .taken is omitted?"*

verified at `setStoneAsPassed.ts:332-337`. the entrance gate is **stone-level and unscoped**, and it
returns before any reviewer runs:

```ts
const unforgivenAtEntrance = await getStoneGuardReviewPeerUncontemplatedUnforgiven({
  stone: stoneMatched, route: input.route,
});
if (unforgivenAtEntrance.length > 0) { return genStoneGuardBlockedEmit({ ... }); }
```

⇒ **while a debt stands, no reviewer speaks.** a reviewer that cannot run cannot supersede its own
blocker. a clean re-run is a **consequence** of path 1 or 2, never an alternative to them.

| | claimed | actual |
|---|---|---|
| discharge paths | 3 | **2** |
| require an actor | 2 of 3 | **both** |
| a path that clears itself | 1 | 🔴 **none** |

⚠️ **P1 and P2 are order-coupled, and that order is what removes the third path.** the vision states
they are coupled and does not walk the interaction with the entrance gate. **the two halves were
argued separately, and the defect lives only in their product.**

### what this changes, and what it does not

**the fork's verdict stands.** `any-given-ever` and the `floor` variant are both still worse, for the
reasons given, and this correction touches neither.

**the price changes.** the prior filter cleared a stale given with **no actor**. under the delivered
pair, a stale given is answered or overruled — there is no wait-it-out. the cost stays bounded because
path 1 is always open and a moot critique is refuted in three lines, but the guarantee is narrower
than this entry claimed.

⇒ the code comment at `getRouteGuardReviewPeerContemplationStatus.ts` asserted three paths and now
asserts two. **a false comment in shipped code is the `rule.forbid.failhide` shape at the doc grain**
— it read as a checked guarantee while a third of it was unreachable.

## .confidence — 🔴 **80%** — was 88%, then 78%

the 22% doubt:

1. the hash filter was **deliberate**, with a stated rationale in its own `.why`. the original author
   had a reason I read from a comment rather than from them. this is Q1 to the wisher.
2. 🔴 **the replacement guarantee is weaker than this entry claimed when it scored 88%.** two
   actor-driven paths, and none that clears itself. to delete a safety valve is a larger change than
   recorded, and the entry that argued for it was wrong about its own replacement.
3. ✅ ~~"latest" rests on the zero-padded `i` segment as a total order (A1). that holds for every
   filename `asStoneGuardCounter` writes; a legacy un-padded name on a live route would break it.~~
   🔴 **MEASURED 2026-09-08, and it closes IN THE CALL'S FAVOUR** — see below.

### 🔴 doubt 3 was measured 2026-09-08, and it closes

**two checks, one of the corpus and one of the writer:**

| the check | result |
|---|---|
| un-padded names in this route's 679 peer artifacts — 1-digit `i[0-9].` and 2-digit `i[0-9][0-9].` | **0 and 0** |
| ⚠️ the **control** — 3-digit `i[0-9][0-9][0-9].` | ✅ **matches**, so the two zeros are evidence rather than a broken pattern |
| the writer — `asStoneGuardCounter.ts:13-16` | `padStart(3,'0')`, and its own doc names it *"the single source of the pad width"* |

⇒ **the order does not rest on convention; it is guaranteed at the one site that writes the segment.**
a legacy un-padded name cannot be produced by current code, so the risk is confined to artifacts
written before that transformer existed.

#### ⚠️ but the same read found an upper bound A1 does not state

`asStoneGuardCounter.ts:10` says it plainly: *"width 3 supports up to 999 rounds/reviewers."*
`padStart(3)` is a **no-op** above 999 — `String(1000).padStart(3,'0')` is `'1000'`, four chars — so
at i1000 lexical order and numeric order part again, and **`i1000` sorts BEFORE `i999`.**

⇒ **A1 claims a total order without qualification; the true claim is a total order *under 1000*.**
the bound is documented at the writer and absent from the assumption that leans on it. ⚠️ remote —
this stone reached i029 — but *"the driver is stuck in a non-convergent loop"* is the exact scenario
this whole route exists to fix, and it is the one that grows iteration counts.

⚠️ **the corpus half is n=1 route**, and it cannot see a route whose artifacts predate the
transformer. ⇒ it narrows the doubt rather than closes it in full.

⇒ **78% → 80%.** a modest move, because doubt 3 was never the heavy one — **doubt 2 is, and it is a
fact rather than a doubt.**

⚠️ **doubt 2 is a fact rather than a doubt, and it cost 10 points.** the number is not lower because
the alternatives remain worse and path 1 remains always open — **the call still looks right, on a
thinner argument than it had.**

## .where

- `1.vision.yield.md` § "P2 — key the debt by reviewer"
- `1.vision.experience.case=1.the-closed-escape-hatch.md` § "the coupling that makes it work"
- `1.vision.experience.case=2.the-answered-critique.md` `[t4]`
- `getRouteGuardReviewPeerContemplationStatus.ts:84` — the rationale this reverses

## .the verdict

🔴 **RULED 2026-09-08 — TAKEN. and the wisher's second sentence dissolves doubt 2 rather than
accepts it.**

> *"we already commited to this"*
> *"the answer is that they write a taken. and then its unblocked. right?"* — *"simple as that."*

**right, and verified.** `setStoneAsContemplated.ts` needs a `.taken` on disk and a valid slug, and
no other input. no human, no reviewer round, no budget, no quota. ⇒ **path 1 is unilateral and
always open**, so *"blocks forever"* was never a reachable state; it was a state that costs the
driver one file and one command.

### 🔴 why doubt 2 was mis-scored — the valve and the hatch are ONE filter

doubt 2 read *"to delete a safety valve is a larger change than recorded."* it is the **same
filter**, seen from two sides:

| the filter cleared… | which reads as |
|---|---|
| a **stale** given, with no actor | 🦉 a safety valve |
| an **unanswered** given, with no actor | 🔴 the escape hatch this whole route exists to close |

⇒ **there was never a version that keeps one and drops the other.** doubt 2 mourned the valve
without noticing it was the hatch, and priced a tradeoff that does not exist.

⚠️ **the correction at 78% still stands and is not undone** — the third discharge path really is
unreachable, and this entry really did claim it. what changes is the **weight**: an absent
no-actor path is a cost only if the actor-driven path is expensive, and it is not. **⇒ 80% → 95%.**
the residual 5% is doubt 3's `i1000` bound, which is real, documented at the writer, and unrelated
to this fork.
