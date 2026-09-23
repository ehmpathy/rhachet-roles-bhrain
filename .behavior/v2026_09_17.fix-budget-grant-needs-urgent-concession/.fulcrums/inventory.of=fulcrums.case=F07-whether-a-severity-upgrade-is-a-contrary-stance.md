# F07 · whether a driver may UPGRADE its own concession `better` → `urgent`

- **rework** = clean · **confidence** = 60% · **status** = ✅ **RULED — PERMITTED.** the re-grade is a
  re-thought; see `.the verdict`

🔴 **the lowest-confidence row on this board, and the one with the largest blast radius.** if the
upgrade stands, **the whole gate is one command wide.** ⇒ **it stands. it was ruled in.**

## .the fork

the gate reads `severity === 'urgent'` on a live stance. the driver **writes** that field:

```sh
rhx route.stone.set --stone <s> --as conceded --with <lane> --about <concern> --severity urgent
```

⇒ so a driver refused at `better` can re-run the identical command with `urgent` and the refusal
lifts. **the question is whether the engine may refuse the second write.**

| option | the second write |
|---|---|
| A | **permitted, silently** — the latest stance wins; the upgrade is a re-grade |
| 🔴 B | **permitted, and LOUD** — it lands, and the halt/judge renders that a grade was raised |
| C | **refused** — a severity is write-once per concern per generation |

## .taken, and why

**option B.**

1. 🔴 **option C is not implementable as stated.** ordinals renumber each generation
   (`rule.always.absorb-every-concern`: *"re-absorb what the given now says"*), so `blocker.3` at
   `i12` and `blocker.3` at `i13` are not the same concern. ⇒ a write-once key does not exist.
2. **the grade is the driver's to make, by design.** `rule.always.concede-with-a-severity` requires
   the driver to grade every concession and refuses an ungraded one. to then refuse a re-grade is to
   say the first grade was final — which contradicts a rule that exists to make the driver **think**
   at the moment of concession.
3. 🟡 **the extant defence is social, and it is already the invariant's stated defence.**
   `define.invariant…urgent-earns-budget` states the counter-argument itself — *"grade every
   concession urgent to buy rounds"* — and answers it with visibility, never a lock. this fulcrum
   does not weaken that; it inherits it.

🔴 **but the inheritance is where the honesty is owed.** today the invariant's visibility is a
**warn to a human**, and the warn is what bounds abuse. under `F03` the bot takes the round and the
human is only warned — ⇒ **the same visibility now guards a lever the bot pulls itself**, which is a
strictly weaker position than the invariant was written for.

## 🔴 .the cost, stated plainly

| | the gate's claim | what option B leaves |
|---|---|---|
| a bot cannot self-grant | ✅ it cannot type `--add N` freely | ⚠️ it can type `--severity urgent` freely |
| the bound is recorded | ✅ | ✅ — and the record is the whole defence |

⇒ **the gate converts a self-grant into a self-graded harm claim.** that is a real improvement — a
claim on the record, countable, attributable — and it is **not** the hard bound the wish's prose
implies.

## .rework, and why

**clean.** option B is the default behavior plus a render. to reach option C later is to add a key
and a refusal; to reach option A is to delete the render.

## .confidence, and why it is 60%

argument 1 is decisive against option C *as stated*, and no more than that — a **generation-scoped**
write-once key (one upgrade per `.given`) was never examined here and may well be implementable.
**the 40%:** the wisher wrote this wish precisely because a bot could raise its own bound, and this
fulcrum answers that a bot can still raise its own bound one flag over. ⇒ **a reader who accepts
every other row on this board may reject this one, and be right.**

⇒ **what would settle it:** the wisher rules whether a severity re-grade is legitimate re-thought or
the defect this wish exists to close.

## .where

`1.vision.experience.dimensions.md` §3 · `1.vision.yield.md` § *what is awkward*

## .the verdict

🟡 **NOT ruled — INFORMED, and its question is now sharper and smaller.**
`$route/.seeds/…case=S04…`.

the council settled that **the severity is the driver's own rank of the concession, by design.** the
gate reads a rank; it was never meant to read an external assessment.

### 🔴 what that does to this row's cost table

| this row said | after `S04` |
|---|---|
| *"the gate converts a self-grant into a self-graded harm claim … not the hard bound the wish's prose implies"* | 🟡 **the self-grade is the DESIGN, never its shortfall.** a self-graded claim on the record is what req 3 asked for |
| *"a bot can still raise its own bound one flag over"* | ✅ **still true, and it is no longer an indictment.** the flag is the rank, and the rank is the driver's |
| the 40% — *"the wisher wrote this wish because a bot could raise its own bound"* | 🔴 **re-read.** the wish objects to a bot that raises the bound **silently**; a graded, attributable rank is the remedy it asked for |

### 🔴 the question that SURVIVES, and it is the real one

`S04` says the rank is the driver's to assign. it says naught about a rank assigned **in response to
a refusal**.

> **is a re-grade taken after the gate refuses a re-thought, or a purchase?**

| it is a re-thought | it is a purchase |
|---|---|
| the refusal is the first moment the grade has a **consequence**, so it is the first moment it gets real thought | the grade was already made once, with the same facts in view. only the price changed |
| `rule.always.concede-with-a-severity` exists to make the driver **think**, and a refusal is a prompt to think | a driver that re-ranks under refusal has been paid to change its mind |

⇒ **that is a narrower fork than the row opened with, and a better one.** it is no longer *may a
driver grade its own harm?* — settled, yes — but *may a driver re-grade after a price is quoted?*

🟡 **and the answer may be cheap.** option C's generation-scoped write-once key was never examined;
a **refusal-scoped** variant is narrower still — one re-grade per concern per refusal, recorded — and
it bounds the purchase without a bound on re-thought.

## .the amendment

**confidence: 60%, held.** the grade is unchanged and **what it measures has narrowed**: it graded a
fork about self-grades, which `S04` closed; it now grades a fork about re-grades under refusal,
which no settlement touches. ⇒ **a row whose question shrinks should not inherit its old number**,
and this one does only because the residual fork is genuinely as open as the original was.

## .the verdict

✅ **RULED 2026-09-18 — the re-grade is PERMITTED. it is a re-thought, not a purchase.**

> a driver refused at `better` may re-absorb the same concern as `urgent` and take the round. both
> grades stand on the record, each with the driver's name on it.

⇒ the refusal-scoped write-once key sketched above is **dropped**. no freeze, no one-re-grade cap,
no contrary-stance check.

### 🔴 what this costs, stated plainly because it is the design's widest seam

> **the gate is one command wide.**

a driver that meets a refusal re-runs `--as conceded --severity urgent` and proceeds. ⇒ **the bound
is a claim on the record, never a lock** — which is what § *what is awkward* §1 of the yield already
says, now ruled rather than confessed.

### 🟡 why that is the right call anyway

1. 🔴 **a driver that looks again and finds real harm SHOULD say so.** a freeze punishes the honest
   re-read to catch the dishonest one, and the honest re-read is the more common act
2. **the harm set is closed** — security · safety · monetary · reputation · behavioral. a driver that
   cannot name one of those cannot write the grade, whatever the gate permits
3. **both grades are on the record.** a `better → urgent` flip on a refused concern is a two-row
   trail with one reviewer and one ordinal ⇒ **visible to any reviewer that looks**, which is the
   defence this design has and the only one it claimed
4. `rule.always.concede-with-a-severity` exists to make the driver **think** at the moment of
   concession. a rule that refuses a re-thought contradicts it directly

### 🔴 what it composes with — the product is now fully ruled

```
F07  ✅ permitted   one nitpick re-graded urgent  →  a warrant the driver minted itself
F10  🔴 NARROWED    × every EXHAUSTED lane        →  one warrant, N dry-and-exhausted lanes
F12  ✅ refused     × one stone only              →  the prefix sweep is closed
```

⇒ **`F12` closes its factor and `F10` narrows its own; `F07` leaves the first factor unbounded.**
the width that remains: *one self-minted warrant pays for every exhausted lane at the scoped level,
on one stone.* ⚠️ **that is materially narrower than the pre-council product and it is not zero**,
and a reader should hold the three together rather than one at a time.

### .what moves

| artifact | change |
|---|---|
| the gate | **no change.** naught is frozen; the predicate reads the latest stance as it already does |
| 🟡 the refusal copy | it must not read as an invitation. the *`better` is the right grade* line stays, and it carries the whole weight of discouragement the design has |
| the criteria stone | a clamp: concede `better`, meet the refusal, re-concede `urgent`, assert **both rows stand** in `passage.jsonl` — the trail is the defence, so it is worth a test |
