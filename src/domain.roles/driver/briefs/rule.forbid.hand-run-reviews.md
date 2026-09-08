# rule.forbid.hand-run-reviews

> **a driver never runs `rhx review` by hand. a review is summoned by the guard, or it does not
> happen.**

no scoped re-run, no diagnostic sweep, no "second opinion", no probe. the flag set does not matter
and the motive does not matter. **the invocation is the violation.**

## 🔴 .why — it defeats the budget system, which is the whole scarcity the ladder runs on

`route.guard.budget` bounds how many rounds each reviewer gets. that bound is what makes a review
round **cost** something, and the cost is what forces convergence rather than an endless re-roll.

> **a hand-run review draws no budget.** it is free, unlimited, and invisible to the meter.

⇒ so a driver with this habit has an **uncapped** review supply beside a capped one. every argument
the ladder makes about scarcity — *spend it, converge, exhaustion is terminal* — is void for a
driver who can summon a free lane whenever the metered one says no.

## 🔴 .the second harm — the party under review picks its own reviewer

a hand-run invocation lets the driver choose the **rubric**, the **bind**, the **brain**, and the
**focus**. every one of those changes what the review can see or conclude.

| the guard's lane | a hand-run review |
|---|---|
| rubric, bind, brain, focus — all declared in the `.guard` | **all chosen at the prompt, by the driver** |
| costs a budget round | costs zero |
| mints a `.given` the judge tallies | mints no artifact the engine reads |
| its verdict gates the stone | its verdict gates naught |

⇒ **this is the identical defect `rule.forbid.commits-the-route-did-not-ask-for` names**, one step
further along: a commit changes *what the reviewers can see*; a hand-run review changes *who reviews
and under what terms*. both are a review-scope change made by the party under review, and **no
reviewer consented to either.**

⚠️ **and a favourable read is one flag away.** narrow the bind, swap the brain, drop the `--goal`
— the same rubric returns `0/0`. a driver need not intend to shop for that to be what the artifact
is worth.

## 🔴 .the third harm — its verdict discharges no debt, so it is not even useful

a hand-run review writes no `.given`. so:

- it **cannot** be answered by a `.taken` — there is no given to answer
- the judge **cannot** tally it — `getAllRouteGuardReviewPeerGivens` reads the `.reviews/peer/` tree
- the contemplation gate **cannot** see it

⇒ **a clean hand-run verdict moves the stone's state not at all.** it produces a document that reads
like evidence and functions as none — worse than an absent document, because a later reader (or a
later driver) mistakes it for a review that happened.

## .what to do instead — the lever is the GUARD

| the situation | the sanctioned move |
|---|---|
| a lane **overflowed** its context window | 🔴 `rhx route.mutate.guard` — narrow that lane's `--paths-with`, or trim its `--conversation`. **then let the guard run it** |
| a lane's bind is **wrong** | the same. the bind is a guard field, and the guard is the driver's to edit |
| a lane is **out of budget** | `rhx route.guard.budget --for review --add N` |
| you want a lane's rubric applied to a **different** corpus | that is a new lane. add it to the guard |
| you want a **second opinion** | `rule.always.get-a-second-opinion-before-foreman` — enroll a peer ROLE, never a hand-run lane |

⇒ **every real need behind a hand-run review is served by a guard edit**, and a guard edit keeps the
result inside the budget system where it counts, gates, and can be answered.

## .the test

> **"am I about to invoke `rhx review`?"** — yes → 🔴 **stop.** the answer is a guard edit.

there is no second question. the rule carries no carve-out for a diagnosis, a probe, or a sweep.

## ⚠️ .the prior guidance this REVERSES, and why it read as reasonable

`rule.always.diagnose-reviewer-malfunctions` carried a recipe for exactly this — a scoped
`rhx review` as the remedy for an overflowed lane — and it was followed on
`rhachet-roles-bhrain` @ `beav/fix-contemplation-gate-on-entrance`, at scale: a nine-lane sweep,
hand-run, producing nine verdicts the engine never read.

**the argument for it was not silly.** an overflowed lane returns terminal and unlocks the next
level, so a driver who merely files the overflow removes a lens from the drive. that harm is real.
🔴 **the recipe answered it with an instrument outside the system** — and the same harm has a
remedy inside the system, which is the guard edit that makes the lane fit.

⇒ **the recipe existed because the guard-edit lever was absent from the owner table.** a driver who
believes the bind is not theirs will reach for the only tool left. fix the ownership, and the
hand-run loses its motive.

## .enforcement

- a `rhx review` invoked by a driver, for any reason = **blocker**
- a scoped re-run cited as a spent lever in a blocker artifact = **blocker** (it is no lever)
- a hand-run verdict cited as evidence that a lane is clean = **blocker** (it gates naught)
- an overflowed lane left unrepaired because the guard edit was believed to be the wisher's =
  **blocker** (`rule.always.spend-own-levers-before-escalation` — the guard is yours)

## .see also

- `rule.forbid.commits-the-route-did-not-ask-for` — the same defect one step earlier: the party
  under review changes what the review sees
- `rule.always.spend-own-levers-before-escalation` — `route.mutate.guard` is the driver's lever
- `rule.always.diagnose-reviewer-malfunctions` — the overflow cause, with the guard-edit remedy
- `rule.always.get-a-second-opinion-before-foreman` — the sanctioned way to get another read
