# rule.require.grade-a-concession-by-its-harm

> **a concession's severity is graded by the same harm test you grade a blocker by. `urgent` is a
> nameable shipped harm; `better` is every point that is not.**

`rule.forbid.overzealous-blockers` already gives you the one test that matters: **name the harm that
ships if this is not fixed.** this rule says that same test also decides a concession's severity — so
one harm test rules both seats, and a driver and a reviewer cannot reach opposite grades on one point.

## .the two severities, by harm

| the concession | the harm test | the severity |
|---|---|---|
| a defect in the closed set — security · safety · monetary · reputation · behavioral, with a nameable harm | you can name who suffers, and how | **`urgent`** |
| code idealism, maintenance, polish — a tidier shape, a clearer name, an absent guard on a case that cannot arise | you cannot name a shipped harm | **`better`** |

⇒ this is the mirror of the rule you already hold: a **blocker** is a point whose harm you can name;
an **`urgent` concession** is a conceded point whose harm you can name. same test, same closed set,
same answer.

## .why it matters to a reviewer

the budget is the maintenance floor (`philosophy.a-review-budget-balances-perfection-with-pragmatism`).
a concession's severity decides whether the budget hit needs a human:

- **all `better`, or none** → good enough, no human, the stone proceeds
- **≥1 `urgent`** → needs increased budget, and the driver owes its human a written why the stone
  bought it

🟡 **that warn is a sentence the driver writes, never a notice the engine sends.** no mechanism
mails anyone — the render asks, and a driver that reads *"the human is warned"* as already-done
writes naught, so the human meets the spend as an unexplained diff.

so a mis-graded concession is as expensive as a mis-graded blocker, in the opposite direction:

| the mis-grade | the cost |
|---|---|
| a `better` point graded `urgent` | it earns a round and a human's glance it did not warrant — the budget stops to bound aught |
| an `urgent` point graded `better` | a shipped harm slips past good-enough and evolves into a defect that reaches a user |

## .the test — for a reviewer who reads a concession

> **can you name the harm a user or an on-call engineer suffers if this ships?**

- yes, and it sits in the closed set → the concession is `urgent`; the grade holds
- no → the concession is `better`; an `urgent` grade here is the mis-grade this rule catches

⚠️ **a rule violation is not a harm, and correctness is not harm.** most concessions keep a codebase
workable — a cost the team pays and the user does not. that is `better`, and it evolves. only a
nameable shipped harm earns `urgent`.

## .enforcement

- a concession graded `urgent` with no nameable shipped harm = **blocker** (the mis-grade)
- a conceded point in the closed harm set with a nameable harm, graded `better` = **blocker**
- a `better` concession cited as a reason to increase the budget = **blocker**

## .see also

- `rule.forbid.overzealous-blockers` — the harm test this reuses, for blocker-vs-nitpick
- `philosophy.a-review-budget-balances-perfection-with-pragmatism` — the WHY the severity serves
- `define.invariant.review.peer.budget.urgent-earns-budget` — the law the grade feeds
- `rule.always.concede-with-a-severity` (driver) — the same test, from the driver's seat
