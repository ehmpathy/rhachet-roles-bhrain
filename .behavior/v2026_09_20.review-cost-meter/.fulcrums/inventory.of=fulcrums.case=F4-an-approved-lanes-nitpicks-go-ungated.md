# F4 — an approved lane's nitpicks go ungated

- **rework** — clean (move 1) · 🔴 **dirty** (move 2)
- **status** — OPEN — move 1 deferred to a dream; move 2 is a wisher call
- **confidence** — 85% that move 1 is right · 🔴 **45%** that move 2 is right at all

## .the fork

a peer lane that approves with nitpicks mints no `.taken` debt, so the entrance gate does not
fire — and `--as absorbed` replies *"no concern to absorb, no response needed"*. the reviewer
re-raises every unanswered nitpick regardless.

two moves are available, and they are **not** a package:

| move | what it does | rework |
|---|---|---|
| **1. fix the reply** | stop the affirmation; report the unanswered nitpick count instead | clean — one seam, no contract change |
| **2. gate it** | extend the entrance-gate debt to an approved lane's unanswered nitpicks | 🔴 dirty — changes the passage contract |

## .taken, and why at the time

**move 1: yes, deferred to a dream.** the reply actively pulls a driver toward the defect, and
the repair is a one-line change at the seam that emits it. no judgment is owed.

**move 2: NOT taken, and raised here rather than guessed.** it would hold a stone on a point
the judge has already allowed — the budget explicitly permits nitpicks (`--allow-nitpicks 7` on
this very stone), and `philosophy.a-review-budget-balances-perfection-with-pragmatism` says the
floor is deliberate. to gate every nitpick would make the allowance a lie.

⇒ but the counter is real: **an unanswered nitpick costs a full review round**, measured at two
rounds and four lane-runs on this stone. the allowance is meant to let a nitpick *ship*, not to
let it *re-raise*, and those are different things the engine cannot currently tell apart.

🟡 a third shape exists and was not designed: gate on the **re-raise**, not the raise — refuse a
round only where a nitpick appears twice with no `.taken` between. it targets the actual cost
and leaves the first-raise allowance intact. it is also the most work.

## .rework, and why

**move 1 is clean** — the absorb handler's output, one call site, no contract or snapshot ripple
beyond its own.

🔴 **move 2 is dirty** — it changes what `passage = allowed` means. the judge, the entrance gate,
the budget semantics, and every passage snapshot move together, and a driver mid-route on any
branch inherits the new refusal. that is a teardown to reverse, which is why it is not
best-guessed.

## .confidence, and why it is low

**45% on move 2** — the argument cuts both ways and neither side is weak. the budget's whole
purpose is to let cosmetic points pass; the re-raise cost is real and measured. **I cannot
defend either verdict at 93%**, and the call is a product judgment about what a review round is
*for*, not an implementation detail.

## .where

- `src/domain.operations/route/` — the `--as absorbed` handler (move 1); the entrance gate and
  `getLatestPeerGivensPerSlug` (move 2)
- the dream: `.dream/v2026_09_21.fix.an-approved-lanes-nitpicks-have-no-taken-gate.md`
- the record: `rule.always.converge-with-reviewers.via-a-taken-per-point.example=the-approved-lane-that-re-raised.md`

## .the verdict

*(unruled)*
