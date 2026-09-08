# seed S09 — the review budget is a METER, not a driver's lever

## .said — verbatim, 2026-09-07

> ok, so instead, should we udpate the route to make it so that the review budget is NOT robot
> addable? and instead just build the route with the expectation of non-convergence? (i.e., all the
> prose should expect the driver to converge, but we shouldn't hold everything up on infinite churn -
> whatever is solved within the budget is good enough)?

> i.e., make it a swithc, whether its robot addable or not?

> we can catch this as a followup dream

> but do you get what i mean? e.g., `rhx route.budget.uses allow|block` for robots. by default, only
> human -> respect the actual budget intended by the routes

> and have the routes NOT halt and NOT require additional human approval, given the expectation of
> non-convergence?

## .settled

**a budget a spender may top up at will is not a budget.** the route declares an intended number of
review rounds; if the driver can extend it, that number is a display rather than a bound, and the
loop has no terminal state but a human grant.

⇒ so the add is gated by a **permission meter**, not removed:

| level | default | effect |
|---|---|---|
| a human | always allowed | the budget is theirs to set and to extend |
| a robot | 🔴 **blocked** | it spends the budget the route intended, and no more |
| a robot, explicitly allowed | opt-in, per repo | the extant behavior, chosen rather than assumed |

**and the route is written to expect NON-convergence as an ordinary outcome.** the prose still asks
the driver to converge — that does not change. what changes is the terminal condition: *whatever is
settled inside the budget is good enough*, so an unconverged reviewer **ends the round rather than
holds the road** — no halt, and no second approval owed.

🔴 **the last clause is the load-bearing one.** a bound that converts churn into an escalation has
moved the cost from tokens to the human's attention, which is the scarcer of the two. exhaustion must
be a **pass**, not a **halt**.

## 🔴 .the property that must survive

the driver's obligation is to **answer**, never to **win** — `converge with reviewers` already draws
that line (*"articulate to converge, not to win"*). a bound on **rounds** is not a bound on
**answers**.

⇒ **cap the rounds; keep the debt.** a budget that ends the conversation while an unanswered critique
stands would re-open the exit `rule.forbid.unanswered-exits-from-a-blocker` exists to shut — *"let
the reviewer exhaust"* is listed there as forbidden precisely because a coast to the bottom is
cheaper than a reply.

## .landed

- `ehmpathy/rhachet-roles-bhrain#458` — dispatched at the wisher's ask, then **pruned** from
  `.dream/` on the rule that a delivered dream's tracker is its queue. ⚠️ the drift that rule warns
  of arrived within hours: a defect found in this seed's own clause 3 had to be written twice, and
  one of the two copies was always the stale one (`.dream/.readme.md`, the delivery ledger)
