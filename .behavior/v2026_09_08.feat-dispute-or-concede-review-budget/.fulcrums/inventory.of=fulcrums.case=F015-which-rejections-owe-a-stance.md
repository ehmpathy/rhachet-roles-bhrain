# F15 · which rejections owe a stance — blocker-driven only, or any that holds the road?

- **rework** = clean · **status** = 🔴 **WISHER-RULED — B, 2026-09-10. A was REVERSED** ·
  **confidence** = **85%** → **wrong**
- **filed as** `…case=F015-a-stance-answers-a-blocker-driven-rejection.md`, renamed once the call it
  asserted was overturned — the slug stated a verdict the entry no longer holds

**raised at `review.self r4`**, when `computeReviewPeerVerdict` was finally opened rather than cited.

## .the fork

`computeReviewPeerVerdict.ts:64-65`:

```ts
const passesThresholds =
  input.blockers <= allowBlockers && nitpicks <= allowNitpicks;
```

**two axes.** `F12` settled that the stance predicate keys on the **verdict** rather than a raw
blocker count — and the verdict carries a nitpick axis that the debt predicate
(`getAllRouteGuardReviewPeersUncontemplated.ts:31`, `blockers > 0`) does not have at all.

| fork | a stance is owed when… | what it costs |
|---|---|---|
| **A — narrow** | the verdict is `rejected` **and** blockers exceed their allowance | answer-first holds. a second predicate returns, which is what `F12` removed |
| **B — wide** | the verdict is `rejected`, on either axis | one source of truth. 🔴 **breaks answer-first** — see below |

## 🔴 .why this is not a hypothetical — and it is WIDER than one guard's config

**this route's own guard** (`1.vision.guard:13`):

```
--allow-blockers 0 --allow-nitpicks 7
```

⇒ a lane with **8 nitpicks and 0 blockers** computes `rejected`, and `blockers > 0` reads it
**clean**. the two predicates diverge **here**, on the stone in front of you.

🔴 **and the divergence is the DEFAULT, never a config choice.** verified at `review.self r4`:

- `getReviewedJudgeThresholds.ts:14` returns `null` when a guard declares no `reviewed?` judge
- `computeReviewPeerVerdict.ts:55-56` then defaults **both** allowances to `0`
- ⇒ `nitpicks <= 0` fails at **one nitpick**

| a 1-nitpick, 0-blocker lane, on default thresholds | reads |
|---|---|
| `computeReviewPeerVerdict:64-65` | 🔴 **`rejected`** |
| `getAllRouteGuardReviewPeersUncontemplated:31` — `blockers > 0` | **clean**, no `.taken` owed |
| `runStoneGuardReviews:430` — `cachedReview.blockers === 0` | **skipped every round**, no budget spent |

⇒ **one nitpick is enough.** the `--allow-nitpicks 7` guard makes the case visible; it does not make
it possible. **this is the ordinary configuration, and it holds a stone with no debt and no cost.**

## 🔴 .why fork B breaks the design's own sequence

the design's core order is **answer, then declare**. invariant 2 mechanizes it: *a stance at
`unanswered` is refused.*

but a nitpick-only lane **owes no `.taken`** — the contemplation gate's own comment says so:
*"clean + nitpick-only need no taken."*

| step | a nitpick-only lane |
|---|---|
| is it `unanswered`? | **no** — it owes no answer, so it never enters the debt set |
| does invariant 2 fire? | 🔴 **no.** the guard it was written to be has no grip here |
| does invariant 1 fire under fork B? | ✅ yes — the verdict is `rejected` |

⇒ **a stance would be demanded with no prior answer**, which is precisely the shape
`0.wish.md:85-87` forbids (*"do not weaken the `.taken`-per-`.given` requirement"*) and precisely
what invariant 2 exists to prevent. **the invariant does not catch it because the debt predicate and
the verdict predicate disagree about what counts.**

## 🟡 .the case for fork B — stated, then RETRACTED on evidence

it read as though B carried the **wish's own argument**:

> ~~a nitpick-driven rejection **also** holds the stone, and today it **also** ends by exhaustion.~~

🔴 **the second clause is false, and `runStoneGuardReviews.ts:427-456` is why.** the cache-skip runs
**before** the exhaustion check — its own comment insists on the order — and it keys on the **raw**
count:

```ts
if (cachedReview && cachedReview.blockers === 0) { … continue; }   // :430
```

⇒ a **0-blocker, 8-nitpick** lane is skipped every round, **and its budget is never consumed.** it
cannot exhaust. so a nitpick-only rejection does **not** end by the mechanism the wish attacks.

| how a rejection ends today | blocker-driven | nitpick-only |
|---|---|---|
| the driver answers it | ✅ a `.taken` | 🔴 no debt is owed |
| the budget runs out | ✅ the wish's target | 🔴 **impossible** — cache-skipped at `:430` |
| **the driver repairs it** | sometimes | ✅ **the only path** — the fix moves the hash, the cache misses, the lane re-runs |
| a human overrules the level | ✅ | ✅ |

⇒ **the wish attacks resolution-by-exhaustion. a nitpick resolves by repair, which is convergence.**
so B's headline argument does not reach this case, and **A is materially stronger than when this row
was first written.**

⚠️ **one clause of B survives:** A re-introduces a second predicate — *"verdict is rejected, and also
check blockers separately"* — which is the shape `F12` exists to remove. that is a real cost, and it
is the reason this row is not at 93%.

## 🔴 .taken: fork A — and why a GUESS is owed here rather than an abstention

this row first read *"OPEN — not best-guessed"*, on the ground that I benefit from the narrower
obligation. **that was over-cautious, and the rules say so plainly.**

`rule.always.defer-fulcrums-to-last` maps *"open, rework **clean**"* → **best-guess, note why, flag
for the end**, and reserves the halt for a **dirty** rework with no defensible guess. this row is
`clean` and the guess is defensible. ⇒ **an abstention here is not extra rigor; it is the
`--as blocked` shape applied to a clean fork**, which that rule forbids.

**taken: A — a stance answers a BLOCKER-driven rejection. 85%.**

the 15%: A carries the second-predicate cost `F12` was written to remove, and the case turns on
*what a stance is for*, which is the wisher's to define.

⚠️ **and the caution that produced the abstention is still on the record and still correct** — I
benefit from A, and a driver's best-guess on the prior route was reversed 28–83% of the time. ⇒ that
is an argument to **flag it loudly**, which the triage table does, never to decline the call:

- it is the **narrower** obligation, so it is the one that costs me less
- the measured record says a driver's best-guess on a call like this is **reversed 28–83% of the
  time** (`1.vision.yield.md` § *what is awkward* § 7)
- and it turns on what a **stance is for** — a scope question, which
  `rule.always.raise-a-blocker-a-taken-cannot-close` files as the wisher's

🟡 **and the prior route's F11 lesson cuts the other way here, which is why the abstention was
wrong.** its question was *"is this a fork at all, or a lever I hold?"* — and F11's failure was to
**over-file** a lever as a fulcrum, never to under-file one. ⇒ this row is a real fork, so it earns
a row; a real fork with clean rework earns a **guess** beside the row, and the council overrules it
in one line if I am wrong.

## .what would settle it

one question to the wisher: **"is a stance a formal answer to a DEFECT claim, or to any verdict that
holds the road?"**

- a defect claim → **fork A**, and answer-first holds unchanged
- any verdict → **fork B**, and invariant 2 needs a third clause so a nitpick-only lane owes an
  answer before it owes a stance

## .where

`1.vision.yield.md` § *the contract* invariant 1 · `F12` (the predicate this refines) ·
`1.vision.experience.dimensions.md` § C

## 🔴 .the verdict — B, and the wisher reframed the question rather than picked a side

> *"nah, they only need to dispute if they want that review excluded from the judges counts,
> right?"* — the wisher, 2026-09-10

**fork B: a stance is owed wherever the verdict holds the road, on either axis.** and the reason is
not that B's arguments beat A's — it is that **both forks answered the wrong question.**

| the question each fork answered | |
|---|---|
| A and B, as argued above | *"which KIND of rejection deserves a formal answer?"* — a question about **defects** |
| 🔴 the wisher's | *"what is a dispute FOR?"* — and the answer is **exclusion from the judge's tally** |

⇒ once a dispute is *"the lever that drops a review from the count"*, the predicate is not a
judgment call at all. **it is whatever the judge counts.** and the judge counts nitpicks:

```ts
if (input.totalNitpicks > input.allowNitpicks)
  return { passed: false, reason: `nitpicks exceed threshold (…)` };
```
— `computeReviewThresholdVerdict.ts:23-27`

**so a nitpick-only rejection holds the stone, and the driver must have a lever for it.**

## 🔴 .and the entry's case AGAINST B was a category error

this entry's §*why fork B breaks the design's own sequence* is the argument that produced the wrong
call. it reads: *"a stance would be demanded with no prior answer, which is precisely the shape
`0.wish.md:85-87` forbids."*

**it is not.** the boundary forbids a dispute that **SKIPS an owed answer** — *"a `<dispute>` is a
verdict on the disagreement; it does not discharge the duty to answer each point."*

| the state | is there a duty to discharge? | does the boundary bind? |
|---|---|---|
| a blocker-driven rejection, no `.taken` | ✅ yes | ✅ **yes** — invariant 2 refuses the stance (R1) |
| a nitpick-only rejection | 🔴 **no.** naught is owed | 🔴 **no** — there is naught to discharge |

⇒ **I conflated *"the gate does not fire"* with *"the gate is bypassed."*** a gate that finds naught
to catch is not a defeated gate; invariant 2 passes **trivially**, which is the correct outcome.

🟡 **the tell I had and did not read:** the entry's own table states *"is it `unanswered`? **no** — it
owes no answer"*, then two lines later calls that a breach of the answer-first rule. **the premise
and the conclusion are in the same table and contradict each other.**

## 🔴 .what B WINS that neither fork's argument mentioned

this entry files, at its end, an *"extant defect this surfaced, and does not own"*: a nitpick-only
lane over its allowance holds a stone with **no debt, no budget cost, and no remedy line** —
cache-skipped at `:430`, never exhausted, never named by the contemplation gate.

🔴 **that defect is an artifact of fork A.** under B the dispute IS the absent remedy, and the
stranded lane has a driver-owned lever for the first time.

⇒ **so A did not merely pick the narrower obligation — it preserved a trap and then filed the trap
as somebody else's problem.** the `.dream/` that section calls for is **retired by this verdict**,
and its section is corrected below.

## ✅ .and B's own stated cost turned out to be zero

the 15% was: *"A carries the second-predicate cost `F12` was written to remove."* ⇒ **B carries no
such cost.** it is `F12`'s single verdict-keyed predicate, unmodified — the very shape `F12` argued
for. **the fork I took was the one that re-introduced the second predicate, and I priced that as
B's flaw.**

## 🔴 .the mechanism the verdict hands the design — and it is REUSE, never new code

the tally already has an exclusion filter, and its `.why` is this design's own argument in the
engine's words:

> *"keeps only the review files whose level was NOT overruled by a human … a level the human
> overruled is forgiven — **its blockers must not gate passage**"*
> — `getNonOverruledReviewFiles.ts:7-12`

| | the forgive | the dispute |
|---|---|---|
| who declares it | a **human** | the **driver** |
| its grain | a **level** | a **lane** |
| what it does | drops those review files from the tally | 🔴 **the same** |

⇒ **a dispute is the driver's forgive, at lane grain.** the operation is one filter with a second
exclusion source, never a new passage gate — and `route.ts:1397-1406` is the one call site.

🟡 **this reframes the design's central claim in the engine's own vocabulary.** *"the hold lifts for
that lane"* is an outcome; **the mechanism is that the lane's counts leave the tally**, and the
stone then passes because the totals fall under the allowance. ⇒ `1.vision.yield.md` §*the contract*
now states it that way.

## ✅ .and it honors the wish's boundary MORE plainly than the prose did

*"do not remove the peer review. the reviewer still runs and still renders a verdict … never whether
one happens."*

⇒ under a tally exclusion the review **runs**, its file is **written**, its verdict is **rendered**,
and the artifact **persists for the council**. only the **count** is dropped. ⇒ **not one property
of the review is removed** — the boundary's literal text, met by construction.

## 🔴 .the walk agreed with fork A — and that AGREEMENT was the strongest evidence against it

this section read *"the 120-cell walk already encodes fork A — no cell moves"*, and offered that as
*"a real check on it: the fork was settled by an argument about mechanisms, and the walk — built
before those mechanisms were read — agrees."*

🔴 **the walk did not corroborate the call. it inherited its premise.** axis B's `clean` was defined
as *"the latest given raises **0 blockers**"* — the **raw blocker count**, which is fork A's
predicate written into the coordinate system. so the grid was **built** on A and then cited **as
independent evidence for** A.

⇒ **a walk can only check a call it was not derived from.** this one shared A's one load-bearing
assumption, so its agreement carried no information at all — and it read as a second, independent
witness, which is what made it persuasive.

🟡 **the tell was on the page and I read past it.** `F12` had already ruled that *"the stance
predicate keys on the **verdict**, never on the raw count"* — **and axis B still keyed on the raw
count.** the grid was one ruling behind its own design, and the two files never met.

### what actually moves — axis B, two values re-defined

| value | was | is |
|---|---|---|
| `clean` | the latest given raises **0 blockers** | 🔴 the lane's **verdict does not hold the road** |
| `answered` | a `.taken` exists **and** `--as contemplated` has run | 🔴 the verdict holds the road and **no answer is outstanding** — either the `.taken` is written, **or none was owed** |

⇒ **a nitpick-only rejection therefore sits at `answered`, by construction** — it owes no answer, so
none is outstanding. `enter × answered × live` is already **forbidden** (`R4`, `case=2`), so the
halt fires and the stance is demanded. **no cell's verdict moves, and no cell is added**; two
definitions widen, and the nitpick lane lands where it always belonged.

🟡 **`R2` needs no second message after all.** its *"no verdict stands to answer"* is now exactly
true of every lane it refuses, since a nitpick-only rejection is no longer `clean`. ⇒ the extra copy
line this section once owed at 5.1 is **retired** — the re-definition fixed the message by fixing
the coordinate.

## ✅ .the extant defect this surfaced — and the VERDICT gave it an owner

🔴 **read the section below as the case AS FILED under fork A.** every measurement in it holds; its
conclusion — *"this predates the wish and is not this behavior's to fix"* — does not. **under fork B
this behavior fixes it**, because the dispute is the driver-owned remedy the section says the halt
lacks. ⇒ the `.dream/` it calls for is **not owed**, and `case=10` demos the repair.

### the case as filed

**a nitpick-only lane over its allowance can hold a stone with no debt and no budget cost.** it is
cache-skipped at `:430` (raw `blockers === 0`), so it never re-runs and never exhausts; it owes no
`.taken`, so the contemplation gate never names it; and its verdict is `rejected`, so the judge holds
the stone.

⇒ the escape exists — **repair the nitpicks**, which moves the hash and misses the cache — but the
halt that reports it has no remedy line for it, because every remedy the emit knows is a budget or a
human. **this predates the wish and is not this behavior's to fix.** ⇒ owed a `.dream/` at 5.1,
beside the contemplation-gate predicate defect already caught there.

🔴 **and the default-threshold measurement above raises its severity.** the dream must not be
written as *"a guard that raises `--allow-nitpicks` can strand a lane"* — **a guard that declares no
`reviewed?` judge at all strands one at a single nitpick.** the wide config is the visible case; the
default is the common one.

## .see also

`F12` — the predicate keys on the verdict, and its *"it costs naught today"* claim is corrected by
this row · `F14` — the other axis nobody gates · `F04` · `F13`
