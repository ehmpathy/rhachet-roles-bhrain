# fulcrum F1 — keep the exhaustion behavior change

- **rework** = clean
- **status** = ✅ **answered out loud, as the wish asked — it was never a question.** ⚠️ the summary's
  main table read `open` for this row until 2026-09-08 while its own wisher-asks table read
  `answered`; **the two disagreed inside one file**
- **confidence** = 90%
- **found** = 1.vision

## .the fork, stated fairly

under a reviewer-keyed debt, a reviewer that exhausts its budget with a blocker unanswered keeps
that blocker alive. the driver must answer it or a human must overrule.

- **keep it** — exhaustion stops as a free exit. costs: a class of stone that used to sail through
  now halts, and some of those halts will reach a human.
- **carve it out** — forgive the debt of an exhausted reviewer automatically. costs: the
  "manufactured exhaustion" defect that `rule.always.converge-to-terminal` names stays
  structurally free, and a driver can still reach the exit once it spends the budget down.

## .taken, and why at the time

**kept.** the free exhaustion exit is the same defect class the whole behavior exists to close — a
cheap door beside the honest one. to carve it out would shut the edit door and leave the budget
door open, so a driver's cheapest path would still avoid the conversation.

it is safe because three **discharge** paths remain: **answer it**, the **reviewer withdraws its
own blocker** on a later round, or a **human overrule**.

### ⚠️ a LEVER is not a DISCHARGE — this line read "top the budget up" and was wrong

**corrected 2026-09-06**, and the correction earns a note because a peer review pointed at this
exact inconsistency and blamed the wrong side of it.

| | what it is | examples |
|---|---|---|
| a **lever** | what the driver can spend | an answer · **a budget top-up** |
| a **discharge** | what clears the debt | an answer · the reviewer's own withdrawal · an overrule |

⇒ **a budget top-up is a lever, never a discharge.** it buys a *round* in which the reviewer may
withdraw; it clears no debt by itself. spend it and write no answer, and the stone is still held.

#### 🔴 the evidence is a test on this branch, never an argument

`setStoneAsPassed.exhausted.integration.test.ts` `[case3]` exists precisely to settle this, and its
title states the outcome:

> `[case3] 🔴 a budget top-up does NOT discharge a debt — it only buys a confirmation round`

its three steps are snapshotted, and `[t1]` is the decisive one:

> `[t1] 🔴 the driver tops the budget up and re-enters, with NO answer written`
> `then: 🔴 matches snapshot — a topped-up reviewer, still held by the debt`

#### the peer opinion that found it, and why its proposed fix was inverted

`.review/peer-opinion.harness-key-demand.md` (2026-09-04) graded this branch against
`rule.always.spend-own-levers-before-escalation` and raised a blocker: that
`1.vision.experience.case=5.the-debt-outlives-exhaustion.md` `[t2]` contradicts **this** line of F1.

**the contradiction was real and the diagnosis was inverted.** the peer proposed that `case=5`
move to match F1. `[case3]` proves the opposite: **`case=5` was right and F1's line was loose**, so
F1 is what moved.

⚠️ **the peer's deeper concern still holds and this correction does not soften it.**
`rule.always.spend-own-levers-before-escalation` is right that a driver must **spend** the budget
lever before any escalation. what is corrected is the claim that the spend, by itself, discharges.
**the driver still owes the top-up before the ask; it simply also owes the answer.**

## .rework, and why

**clean.** the carve-out is one predicate in the pure filter — forgive a slug whose reviewer is
exhausted. no caller changes, no contract changes, no data migrates.

## .confidence — 90%

the 10% doubt: I cannot measure how often a stone exhausts a reviewer while a blocker is
unanswered. if that is common, this converts many stones into human escalations at once, and the
first week would feel like a regression even though it is the intent.

## .where

- `1.vision.experience.case=5.the-debt-outlives-exhaustion.md` — the demo
- `1.vision.yield.md` § "the exhaustion change is KEPT"
- the wish's own § ".the HOW is yours" asked for this to be decided out loud

## .the verdict

_unruled._
