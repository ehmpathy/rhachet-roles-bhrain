# F04 · a `better` concession no longer buys a confirm round

- **rework** = clean · **confidence** = 🔴 **70%**, down from 75% at `r3` · **status** = best-guessed

🔴 **this reverses a critipath the predecessor route shipped and demoed.**

## .the fork

`v2026_09_08`'s `case=6` is titled *"the concede that buys a round"* and walks
`concede → fix → budget → re-arrive` as the **intended** sequence for a `better` concession. its aha:

> *the top-up was never a favour asked of a human. it is the price of a round the driver decided it
> needs — and now the ledger says which rounds those were.*

`0.wish.md` req 4 forbids exactly that: *"a nitpick-only round can never be the concession that lifts
the refusal … if taste can fund a round, the loop has no floor."*

| option | the `better` concession |
|---|---|
| 🔴 A | **refused.** the fix ships; the lane never confirms it |
| B | earns **exactly one** confirm round, once per generation — a bounded carve-out |
| C | permitted freely — req 4 is read as concern-kind rather than severity (see `F06`) |

## .taken, and why

**option A.**

1. **req 4 is unambiguous**, and option B is the carve-out it forecloses. a bounded carve-out is still
   a floor at 1 round per generation per concession — and a driver may concede one point per
   generation indefinitely, so the bound is no bound.
2. 🔴 **the invariant already says it**: *"a `better` concession never earns an increased budget"*, and
   its enforcement line reads *"a `better` concession that earns an increased budget = **blocker**."*
   ⇒ option B is a graded violation of a shipped invariant.
3. **the loss is a confirmation, never a passage.** a `better` concession is shed from the residual
   tally (`getStoneConcededBetterConcernCounts`), so the stone passes on its own arithmetic. the trade
   is *good enough inside the budget*, which is the budget's declared purpose.

## 🔴 .the cost, stated plainly

| | before | after |
|---|---|---|
| the fix lands | ✅ | ✅ |
| the stone passes | ✅ | ✅ |
| **the lane that raised it confirms the fix** | ✅ | ❌ **never, for the life of the stone** |

⚠️ **the loss is permanent.** budget is cumulative rounds (`rounds >= budget`), so an artifact edit
mints a new given and restores no round.

🔴 **and `#458` §3a named the consequence before this wish existed:** *"the budget is what makes the
re-raise possible. remove the rounds and you remove the only mechanism that ever caught a token
answer."* ⇒ the same applies to a token **fix**. this design accepts that for `better` and refuses it
for `urgent`, which is where the harm test draws the line — the best defence available, and not a
complete one.

## 🔴 .the evidence added at `r3` — a THIRD shipped surface teaches option C

a repo-wide sweep found the absorption ack, `formatRouteGuardReviewPeerAbsorptionAck`. it renders the
instant a concession is recorded — **the exact event this gate reads** — and its `[case2]` snapshot
pins these bytes:

```
   └─ fix the blocker, buy the round, then re-arrive
      ├─ rhx route.guard.budget --for review --add 2 --peer ergonomist --stone 5.1.execution
```

🔴 **and `[case2] [t1]` is a NITPICK concede on a spent lane.** the suppress branch is METER-driven —
the test says so in its own comment — so **the command is printed there today**, and the driver is
told to *"buy the round"* in the plainest words anywhere in this codebase.

| what the surface shows | why it moves this row |
|---|---|
| the act is named **"buy the round"** | the budget is framed as the driver's to purchase, not a human's to grant |
| the branch reads the **meter** and never the **severity** | option A demands a severity branch on a surface that has one input and ignores it |
| it is **pinned in a test**, not incidental copy | a deliberate, reviewed render — this is a decision, not a drift |

⇒ this is the **third** shipped artifact that teaches the sequence option A refuses, after `case=6`
and `#458` §3a. ⚠️ **three surfaces agree with each other and disagree with req 4.**

## .rework, and why

**clean.** option B is one extra clause in the gate's disjunction plus a per-generation counter. to
reverse is additive, never a teardown.

## .confidence, and why it moved 75% → 70%

req 4 and the invariant agree, and they are both explicit — that has not changed.

**what widened the doubt at `r3`:** the count of shipped surfaces that teach the opposite went from
two to **three**, and the third is the most explicit and the most tightly coupled to this gate's own
trigger. a design that reverses one demoed critipath is a judgment; one that reverses a critipath, a
cited issue, and a pinned render is a judgment a council should make rather than a driver.

🟡 **the direction of the move is the point.** new evidence arrived, it cut against the taken option,
and the number went down. a confidence that only ever rises is a confidence that measures the
author's attachment rather than the claim.

⇒ **what would settle it:** the wisher confirms the confirm-round loss is intended, or rules option B.

## .where

`1.vision.experience.case=3.the-strand.md` — the demo · `1.vision.experience.dimensions.md` §2 ·
`1.vision.yield.md` § *what is awkward* · 🔴 `1.vision.yield.md` § *the change surface* → *the
absorption ack*, which carries the `r3` source read in full

## .the verdict

🔴 **RULED — option A, in BOTH halves, and by two separate settlements.**

### the design half — ruled by `S03`

`$route/.seeds/…case=S03…` states the rule this row groped toward:

> **inside the budget, `better` is enough. past the budget, only `urgent` is.**

⇒ **a `better` concession does not buy a round past the meter.** that is option A, stated
affirmatively rather than as a cost this design absorbs.

🔴 **and it dissolves the row's central worry.** the row's doubt was three shipped surfaces that
teach *"buy the round"* on a `better` concede. under `S03` those surfaces are not a rival design —
**they are correct inside the window and wrong past it**, and none of them reads the meter's end as a
boundary. ⇒ the disagreement was never about severity at all; it was about **where the window
closes**, and no surface asked that question.

### the render half — ruled by `S01`

`$route/.seeds/…case=S01…` puts the ack's copy in scope for **this** behavior. so the third surface
this row discovered stops to be evidence against the call and becomes a **deliverable of it**.

| the ack's branch | today | ruled |
|---|---|---|
| its input | the meter alone | 🔴 the meter **and** the severity |
| a `better` concede on a spent lane | renders *"buy the round"* + the command | 🔴 **renders no top-up at all** |
| a `better` concede with rounds left | renders no top-up (the term elides) | ✅ unchanged — correct inside the window |

⇒ the seam already exists: the operation takes a `severity` input this branch ignores.

## .the amendment

**confidence: 70% → RULED.** 🔴 **the row fell from 75% on evidence that the verdict re-classifies
as SCOPE.** each new surface it found was read as *"a fourth artifact that disagrees with us"*; every
one of them is now a line in the change surface.

🟡 **the class: a row that counts surfaces which teach the old behavior counts its own work items,
not its counter-evidence** — where the design's scope includes the copy. ⇒ the question that parts
the two is **is that surface in my diff?**, and this row never asked it. it asked *how many
disagree?*, which is the right question only for a surface the design cannot touch.
