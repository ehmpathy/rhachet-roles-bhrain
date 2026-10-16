# seed S17 — a warmer keeps warm only where the driver is expected to DRIVE ON

## .said

> also, the warmer should halt if the route is completed OR blocked, too, btw

> cause we expect the driver not to be nudged

> so it should only keep-warm if we expect the driver to drive on

🟡 one typo repaired — *"halt of the route"* → *"halt if the route"*. no word else touched.

## .settled

the warmer's gate is **an expectation about the DRIVER, never a fact about the budget.** budget-left
is one input to that expectation and it is not the expectation itself.

### the predicate, stated positively

> **warm iff the driver is expected to drive on.**

that is the whole rule, and every gate condition is a way to answer it. the prior settlement (`S9`)
answered it with one input — *"rounds left means the prefix will be hit"* — and that input is
**necessary and not sufficient**: a route can hold budget and still be over.

### the two states a budget cannot see

| the route's state | budget says | the driver will | so the warmer must |
|---|---|---|---|
| mid-drive, rounds left | rounds left | re-arrive | **warm** |
| budget exhausted | exhausted | not re-run that lane | halt |
| 🔴 **completed** | may hold rounds | **not be nudged** | 🔴 **halt** |
| 🔴 **blocked** | may hold rounds | **not be nudged** | 🔴 **halt** |

⇒ the two new rows are the point, and neither is reachable from a budget read: a route that passed
its last stone, and a route halted on `--as blocked`, both leave the round allowance untouched. so a
budget-gated warmer keeps a prefix warm that nobody will ever read.

### 🔴 why *"nudged"* is the operative word

a completed route emits no next stone and a blocked route emits a halt — so in both states **no
mechanism will pull the driver back to that road.** the stophook does not re-emit, `route.drive`
names no next stone, and the guard is not re-driven.

⇒ a warmer is a bet on a re-read. where the engine itself has stopped to nudge the driver, that bet
has no counterparty, and every poke past that point is **spend against a round that will not come** —
which is the exact defect `S9` cited to reject a bare timer, reached through a different door.

🟡 so this does not amend `S9`'s arithmetic; it widens its trigger. `S9` established that a warmer
must never be speculative. this establishes that *budget-left* was too coarse a test of speculation.

## 🟡 .what this leaves open

the gate as SHIPPED is coarser still — *"a warmer spawns only where the review was run BY A GUARD"*,
recovered from the output path by `asReviewRunIdentity`, because `rhx review` holds no reference back
to the guard that drove it. that seam already blocks the budget read, and it blocks the passage read
by the same mechanism.

⇒ so the same dream carries both, and this seed sharpens what that dream owes: not *"read the
budget"* but **"read whether the driver is expected to drive on"** — which is `passage.jsonl` plus
the stone set, not the meter alone.

## .landed

- `0.wish` — bar 11's gate clause, and the `[wisher]` note on what the coarse gate does not close
- `.dream/v2026_09_24.feat.the-warmer-gate-reads-a-guard-run-not-a-guard-budget.md` — its subject
  widens from the budget to the drive-on expectation
