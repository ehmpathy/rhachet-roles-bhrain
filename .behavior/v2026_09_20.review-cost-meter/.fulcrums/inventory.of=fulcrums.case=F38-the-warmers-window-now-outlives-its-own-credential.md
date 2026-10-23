# F38 — the warmer's window now outlives its own credential

- **case** = F38
- **title** = the warmer's window now outlives its own credential
- **rework** = **dirty**
- **status** = DEFERRED — dreamed, wisher call owed
- **confidence** = **70%**

## .the fork, stated fairly

`F37` widened the default plan from `3x,15m` (45m) to `12x,15m` (2h45m), because a 45m warmer
retired hours before the round it existed to protect. the first live read of a 12-poke ledger shows
the next constraint: **the keyrack unlock is session-scoped (~9h) and the detached warmer cannot
renew it.** two of five recorded attempts were `act: "fault"` — `ConstraintError: extended keyrack
not found` — so the prefix went unprotected for 30 minutes in the middle of its own plan.

three forks, and they do not rank cleanly:

| fork | what it does | what it costs |
|---|---|---|
| **a — halt on a credential fault** | the loop exits, writes `act: "retire"`, `why: "credential expired"`, and the `run` render states it | the prefix still goes cold; the ledger merely stops to lie about why |
| **b — renew the unlock** | the warmer holds, or re-acquires, its own credential | 🔴 a detached background process that renews its own credentials is a **different security posture**, and the unlock is yubikey-gated |
| **c — clamp the plan to the credential's residual life** | at spawn, `pokes = min(declared, floor(left / every))`, with the clamp printed in the banner | needs a keyrack surface that reports residual life — **unconfirmed to exist** |

## .taken, and why at the time

**deferred — no fork taken.** a dream carries the full argument; no code changed this round.

the reason it is not a best guess: **fork b is a product decision, never a driver decision.** a
warmer that renews its own credential spends money on a cadence under a credential the human did
not re-authorize, which is a materially different product than the one `0.wish` bar 11 bounds
(*"a warmer's total spend is BOUNDED before it starts"*). to pick b silently would settle by side
effect a question the wisher reserved.

🟡 **a and c compose and would be small** — one branch in the loop's catch, one clamp at plan time.
that is the likely first pass, and it is still not taken here because c rests on an unverified
premise about the keyrack's surface, and `rule.require.trust-but-verify` puts the check before the
edit rather than after it.

## .rework, and why

**dirty.** it reaches past the warmer into the keyrack's contract, which lives in another repo
(`ehmpathy/rhachet`). fork b changes a security posture; fork c depends on a surface that may not
exist. neither is a rename or a swapped default — each ripples out of the diff this branch holds.

## .confidence, and why it is low

**70%**, and the absent 30% is one unchecked fact and one unmade call:

- 🔴 **the keyrack's residual-life surface is unverified.** fork c is named as *"probably the right
  first move"* on the strength of a surface nobody has confirmed. if it is absent, c collapses into
  a request to another repo and the order of the three changes
- the **frequency** is unmeasured: one ledger, one occurrence. a 9h credential against a 2h45m plan
  fails only when the review lands in the last 2h45m of an unlock — plausibly uncommon, and the
  sample here is **n = 1 lane-day**
- 🟡 and the one observation is **confounded**: an unrelated `git.repo.test` run at 23:46 re-unlocked
  the keyrack, which is why attempt 4 succeeded. so even the recovery shape is not clean evidence

## .where

- the ledgers: `.log/bhrain/review/2026-09-25T22-57-44-*/warmer.pokes.jsonl`, attempts 2–3
- the plan: `src/domain.operations/review/warmer/asReviewWarmerPlan.ts` — `PLAN_OF_WARMER_DEFAULT`
- the loop that would carry fork a: `src/domain.operations/review/warmer/runReviewWarmer.ts`
- the dream: `.dream/v2026_09_26.fix.a-detached-warmer-outlives-the-keyrack-unlock-it-spawned-under.md`

## .the verdict, once settled

_open — no wisher verdict yet._

## 🟡 .what this does NOT put in question

`F37` stands. the same ledger measured its repair at work: `arch-hazards-maintenance` pokes 3, 4,
and 5 each hit **95.2%** at **$0.0020** against a **$0.0244** cold poke — 12× cheaper, on a prefix a
45m plan would have abandoned hours earlier. **the credential bound is the next limit in the chain,
never a refutation of the last one.**
