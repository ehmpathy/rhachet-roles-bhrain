# howdoes: the review gates you drive within

**for future travelers.** the route engine enforces a small set of laws on every guarded stone. they
are not arbitrary — each is an **invariant** the system holds true by construction. a driver who
knows them reads any halt the guard prints, and knows what is required to clear it. this brief is the
map of the system you operate within.

⇒ the formal statements live beside this brief as `define.invariant.review.peer.*` (under the driver
role, so a driver boot holds them). this is the read for the driver: what each law means for YOU, at
the halt.

## .the gates, in the order you meet them

a guarded stone runs its reviewers, then holds a sequence of gates. you pass a stone once you clear
them in order:

```
run reviewers ─▶ 1. ABSORB gate ─▶ 2. .taken (feedback) gate ─▶ 3. threshold gate ─▶ PASS
                    (per concern)      (per reviewer)              (stone-wide tally)
```

⇒ all three gates are conditions of ONE root law, `passage`: `PASS ⟺ every guard terminal ∧ every
counted concern absorbed ∧ residual tally under allowance`. each gate below is a condition of it.

| # | the gate | what it demands of you | the law (a `passage` condition) |
|---|---|---|---|
| 1 | **absorb** | a disposition — `disputed` or `conceded` — on EACH concern a rejected reviewer raised | `absorb` (condition b) |
| 2 | **the `.taken`** | your argument to the reviewer, per reviewer — accepted only once #1 is done | `absorb` — the added gate (condition b) |
| 3 | **threshold** | the stone-wide tally of residual concerns falls under its allowance | `budget.urgent-earns-budget` (condition c) |

## 1. the ABSORB law — you absorb the feedback by a disposition on each concern

> **`feedbackAbsorbed(given) ⟺ every concern within it absorbed`**

to **absorb** a concern is to render its disposition with its argument. to absorb a reviewer's
feedback is the `.taken` — and it is **refused until each concern within it is absorbed**. the whole
is composed of its parts; you cannot answer the reviewer as a whole while a concern within it stands
un-absorbed.

⇒ what is required of you: one `--as disputed` or `--as conceded` per concern, THEN the `.taken`.
a fix is not an absorption — the debt keys to the concern, so declare on it.

## 2. the PASSAGE law — only `passed` is passage, and only when every gate is terminal

> **`PASS ⟺ every peer guard is terminal`**

a stone passes only when every reviewer reaches a terminal verdict — `approved`, `exhausted`,
`malfunction`, or a human `overruled`/`forgiven`. a `rejected` lane is NOT terminal; it holds the
road until you absorb its concerns and the tally clears.

⇒ what is required of you: work every reviewer to terminal before a human is pulled
(`rule.always.converge-to-terminal`). approval is permission; passage is your explicit `--as passed`.

## 3. the DISPUTABLE law — every concern that COUNTS is yours to dispute

> **a concern counts toward the tally ⇒ you MAY dispute it — approved lane, rejected lane, alike**

the threshold gate sums concerns **stone-wide**: an APPROVED lane's nitpicks still count against the
allowance. so a stone can be held by small nitpicks spread across approved lanes, each one under its
own lane's bar. you hold the lever to shed them.

⇒ **OWED ≠ PERMITTED.** you are FORCED to absorb only a **rejected** lane's concerns (gate 1). but
you MAY dispute ANY concern that counts — an approved lane's nitpick among them — to shed it from a
tally your own lanes pushed over the floor.

## 4. the EXHAUSTED law — a spent budget is terminal, but the debt survives it

> **exhaustion unlocks the LEVEL; it does not discharge the DEBT**

when a reviewer's budget runs out it goes `exhausted` — terminal, so the next level runs. but a
blocker it raised before its budget ran out is still owed a `.taken`. the debt keys to the reviewer,
never to the budget.

⇒ what is required of you: answer an exhausted reviewer's blocker even though it can never re-run.
your levers are a `.taken`, a budget top-up (if it must re-read to confirm), or — last — a human.

## 5. the BUDGET law — only an `urgent` concession earns more; `better` never does

> **a budget hit needs a human ⟺ a live `urgent` concession stands**

the budget is the maintenance floor. spend at least the budget, and what remains evolves later. a
concession graded `better` (code idealism, maintenance) is shed by the judge and passes — no human.
a concession graded `urgent` (a nameable shipped harm — security · safety · monetary · reputation ·
behavioral) warns the human and earns more budget.

⇒ what is required of you: grade every concession (`--severity better|urgent`), by the harm test —
name the harm that ships if unfixed. no nameable harm → `better`. never reach for `urgent` to buy a
round.

## .the one sentence to carry

> **absorb each concern, answer each reviewer, hold the tally under the floor — and only a human
> grants what only a human can.** the gates are the system; the invariants are why they hold.

## .see also

- `define.invariant.review.peer.absorb` — the composition law (gates 1–2)
- `define.invariant.review.peer.passage` — `PASS ⟺ every peer guard terminal` (gate 3, and the whole)
- `define.invariant.review.peer.absorption.disputable-regardless-of-verdict` — which concerns you MAY dispute
- `define.invariant.review.peer.exhausted` — a spent budget is terminal, the debt is not
- `define.invariant.review.peer.budget.urgent-earns-budget` — only `urgent` earns more
- `howdoes.a-concern-travels-from-reviewer-to-absorption` — the five words of the review conversation
- `rule.always.absorb-every-concern` — the conduct rule gate 1 enforces
- `rule.always.converge-to-terminal` · `rule.always.concede-with-a-severity`
