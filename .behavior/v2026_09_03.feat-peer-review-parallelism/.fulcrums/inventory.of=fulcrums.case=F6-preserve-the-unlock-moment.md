# fulcrum F6 — preserve the unlock moment, though two open tasks call it a defect

**rework** — clean · **status** — 🔴 **SETTLED by the wisher, 2026-09-08** · **confidence** — n/a

## 🔴 .the settlement — and the expiry is DISCHARGED

seed **S5**, verbatim:

> *"yeah, agreed. it should show as rejected, not exhausted, if it ran that round."*

⇒ **preserve. the invariant is upheld by the same person who raised #420 and #422 against it.**

🔴 **this was the one fulcrum on the board with an EXPIRY** — clean today, dirty once execution lands
clamps that pin the unlock moment. **it is now ruled before execution begins**, so the reversal cost
it warned of is never incurred. that is precisely what `.the expiry` asked for, and it paid out.

⚠️ **the settlement upholds `define.invariant.review.peer.exhausted` on its RATIONALE, not on its
authority.** the wisher agreed once the argument was on the page. ⇒ that is evidence for the
conclusion-only defect this fulcrum already recorded, not against it.

### what this round now OWES — confirmed rather than hedged

the three duties below were written as a precaution — *"to preserve is not to ignore."* the
settlement makes them owed:

1. name the between-groups gate evaluation in the execution yield, as the natural home for the
   eventual repair
2. do **not** entrench it — no new caller may depend on a level's verdict that is one pass stale
3. 🔴 **carry a clamp that pins the current unlock moment** — so any future change is a **deliberate**
   snapshot change rather than an accidental one

### 🔴 and one half of #420 stays OPEN

*"in no case should it silently degrade to a hard human-only block"* is an **ergonomics** complaint
about the halt message. the invariant governs what a verdict READS and is silent on what the driver
is TOLD. ⇒ **it must not be closed by this settlement.** out of scope for this wish; owed its own
route.

---

## _the record as it stood — superseded above_

**rework** — clean, with an expiry · **status** — open · **confidence** — 93%

⚠️ **confidence raised from 80% in self-review r1.** the behavior turns out to be a **declared
invariant** with its own brief and a dedicated acceptance clamp — not an undiscovered defect. see
`## the behavior is a DECLARED INVARIANT` below.

## .why this fulcrum exists

the human pointed at the radio queue: *"a few folks have complained about this defect already."*
two open tasks, both filed within two days of this round, describe the **same** root behavior —
and both live in the exact code path this wish restructures.

| task | filed | the complaint |
|---|---|---|
| [#422](https://github.com/ehmpathy/rhachet-roles-bhrain/issues/422) | 2026-09-03 | *"exhaustion is recognized **one arrive LATE**. the arrive that spends the last budget still shows the lenses as `rejected` and the next level as `awaits l1 terminal`. the NEXT arrive — free, every lens cached — flips them to `exhausted / terminal` and engages the next level on its own."* |
| [#420](https://github.com/ehmpathy/rhachet-roles-bhrain/issues/420) | 2026-09-03 | *"the moment the L1 reviewers `exhausted`, the ladder should have **instantly kicked off the L3 reviewers** — not halted here as a hard blocker."* … *"in **no** case should it silently degrade to a hard human-only block."* |

⇒ both reduce to one sentence: **a level that becomes terminal within a pass does not unlock the
next level in that same pass.**

## .the mechanism, verified

it is not the loop structure. it is the verdict predicate at `runStoneGuardReviews.ts:397`:

```ts
const hasReviewForHash = review?.hash === input.hash;
const wasExhausted = !hasReviewForHash && rounds >= pr.budget;
```

on the pass that spends the last round, the review **did** run for this hash, so
`hasReviewForHash` is true, so `wasExhausted` is false, so the verdict reads `rejected` — not
`exhausted`. only on the *next* pass (review cached, no fresh run) does it read `exhausted`.

⇒ #422's *"one arrive late"* is exactly this, and #422 already records the correct driver
workaround: **arrive again; it is free, because every lens is cached.**

## 🔴 .the behavior is a DECLARED INVARIANT, not an undiscovered defect

found in self-review r1, and it is the decisive fact for this fulcrum.

`define.invariant.review.peer.exhausted` states it outright:

```
ran → NOT exhausted
skipped due to budget → exhausted
```

and gives the rationale: **`rejected` = the review ran and produced blockers, so the driver must
respond. `exhausted` = the review was skipped, so the budget is spent and the level unlocks.** on
the pass that spends the last round the review *did* run and *did* produce blockers — so a driver
still has something to answer. to read `exhausted` there would claim "skipped" about a review that
ran, and would open the expensive level while fresh unaddressed blockers sit on the cheap one.

it is also **already clamped**, by a dedicated acceptance test whose docblock spells out the
three-round sequence verbatim:

> `blackbox/driver.route.peer-budget-exhaustion-unlocks-level.acceptance.test.ts:23-31`
> *"round 2/2: l1 runs, rejected → l3 still awaits (terminal computed AFTER run)"* …
> *"invariant (define.invariant.review.peer.exhausted): 'exhausted' only when review was SKIPPED,
> never when it ran"*

⇒ **#420 and #422 are not reporting an undiscovered bug. they are disputing a settled invariant.**
that is a different act with a different route: per `im_an.obsessive_learner.for.domain.invariants`,
a dispute belongs in the invariant's own litigation record, not folded into an orthogonal
concurrency wish.

**confidence raised 80% → 93%** on this basis. to preserve a declared, clamped invariant while
restructuring the function around it is not a judgment call; it is the only defensible move.

## ⚠️ .and why it got re-litigated twice in two days — the brief is conclusion-only

stated in fairness to #420 and #422, because their frustration is legitimate.

`define.invariant.review.peer.exhausted` carries `.what` / `.invariant` / `.why` / `.detection` /
`.consequence` / `.enforcement`. per the learner's own shape for an invariant brief it omits
**exactly the fields a re-litigation needs**:

| owed | present |
|---|---|
| `.kind` — nature or nurture | ❌ |
| `.scope` — what it does NOT cover | ❌ |
| `.the counter-argument`, stated fairly | ❌ |
| `.what would overturn it` | ❌ |
| `.the litigation` — who argued what | ❌ |

⇒ *"a conclusion with no argument attached will be re-argued."* two people re-argued it within two
days. **the omission is the cause, and it is caught as a dream rather than repaired here.**

## 🔴 .the half of #420 the invariant does NOT answer

do not let the invariant settle more than it covers. #420 makes **two** complaints:

| the complaint | the invariant |
|---|---|
| *"the moment the L1 reviewers exhausted, the ladder should have instantly kicked off the L3"* | ✅ **answers it.** that is the declared behavior, and it is correct |
| *"in **no** case should it silently degrade to a hard human-only block"* | ❌ **silent.** the invariant governs what a verdict READS. it is quiet on what the driver is TOLD to do next |

the second is an ergonomics complaint about the halt message, and `rule.always.spend-own-levers-before-escalation`
names the likely cause: the guard renders *increase budget* and *approve as-is* as peer branches,
so a driver reads two human remedies where only one is. **that is a real and separate issue**, out
of scope for this wish, and it should not be closed by the invariant that answers #420's first half.

## .the fork, stated fairly

this wish moves the gate from **per-reviewer, inside the loop** to **between level groups**. same
code path. so the round must decide:

| option | for | against |
|---|---|---|
| **repair #420/#422 while in here** | the restructure puts the gate exactly where the repair belongs — a between-groups evaluation runs *after* the group has fully settled, which is the vantage from which "did l1 just become terminal?" is answerable in-pass. the repair would be nearly free | 🔴 the wish's boundary is explicit: *"do not change the level ladder. levels remain ordered and gated; only intra-level execution changes."* and it would render the 36-snapshot diff unreadable — no one could tell which delta came from concurrency and which from the unlock change |
| **preserve the unlock moment exactly** ✅ | honors the declared boundary; keeps the snapshot diff attributable to one cause; leaves #420/#422 as the separately-scoped tasks they already are | ships a restructure that *touches* a known defect and deliberately leaves it — which will read as an oversight unless it is declared |

## .taken, and why at the time

**preserve it exactly, and declare it loudly.**

- the wish drew this boundary by name. `rule.require.wish-outcome-over-proposal` makes `.what` /
  `.acceptance` authoritative, and the boundary section is part of that.
- 🔴 **the snapshot argument is the decisive one.** 36 peer acceptance snapshots encode the current
  unlock moment. a change that alters both *what runs concurrently* and *when a level unlocks*
  produces a diff where every delta has two candidate causes. that is precisely the change a
  reviewer cannot audit — and this wish's acceptance 2 asks that the gate be shown *unchanged*.
- #420 and #422 are already **filed, owned, and scoped**. they are not lost by this deferral.

## 🔴 .what this round OWES them, even so

to preserve is not to ignore. the restructure must leave the repair **cheaper**, and say so:

1. the between-groups gate evaluation is the natural home for the eventual repair — name it in the
   execution yield so #420/#422's implementer finds it
2. do **not** entrench it further — no new caller should come to depend on a level's verdict
   being one pass stale
3. carry a clamp that pins the current unlock moment, so the eventual repair is a **deliberate**
   snapshot change rather than an accidental one

## .why the confidence is 93%

⚠️ **it was 80% until self-review r1.** at 80% the argument rested on the wish's stated boundary
plus snapshot attributability — both good reasons, both arguable, and neither able to say the
behavior is *right*. the discovery that it is a **declared invariant with a named brief and a
dedicated clamp** replaces "the wish told me not to" with "the behavior is correct and was
deliberately chosen." that is a categorically stronger footing.

⚠️ **what keeps it short of certain:** the wisher raised #420/#422 in this round, and to point at
complaints while a round restructures that code path could reasonably mean *"and repair it while
you are in there."* i read it as context rather than instruction — and now with a stronger reason
than before, since the "repair" would overturn a declared invariant rather than fix a bug.

⇒ **this remains the one fulcrum i would like ruled early rather than at the council** — but the
question has changed shape. it is no longer *"do we fix this defect now?"* It is *"do we overturn
`define.invariant.review.peer.exhausted`?"* — and that is a decision for the invariant's own
litigation record, not for a concurrency wish.

## .rework — clean, with an expiry

clean today: it is a decision about *when* verdicts are computed in the new structure.
⚠️ it turns **dirty** once the execution stage lands clamps that pin the unlock moment — reversal
would then mean a second pass to re-cut tests and re-baseline snapshots.

## .where

- `runStoneGuardReviews.ts:375-412` — `computeVerdicts`, and `:371`'s `wasExhausted`
- `runStoneGuardReviews.ts:530-541` — the gate this wish relocates
- `1.vision.experience.case=4.the-gate-holds-between-levels.md`

## .the verdict

_open — flagged for an early rule, ahead of the council._
