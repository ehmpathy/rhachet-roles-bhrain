# fulcrum F45 — the warmer is `on` by default, and on real guard rounds it saved naught

- rework = **clean** — the default plan is one constant in `asReviewWarmerPlan.ts`
- status = 🔴 **OPEN — the wisher's call.** `on` by default is a settled seed (`S13`); a driver may
  not overturn it, however strong the evidence
- confidence = 🔴 **90%** that the default costs money for no gain at this tree's round cadence ·
  🟡 **50%** that `off` is the right interim, rather than a repair of the window alone
- raised.by = self, the first time the new warmer section of `review._.cost --of tree` ran on this
  tree (`S19`)
- relation = 🔴 **this is `F37` priced.** `F37` found the window is a third of the round cadence;
  this row is what that costs, in dollars, on this tree

## .the evidence

`rhx review._.cost --of tree`, 2026-09-26, this worktree:

- poke spend **$1.74** over 181 pokes, 128 of them hit — a floor, since a ledger faulted (`F38`)
- 37 guard reviews followed a warmed run; their cache saved **$0.00**
- net **-$1.74**; verdict `⛔ loss` in all nine lanes that have a follower

🔴 **the loss is certain.** the amount saved is an upper bound on what a warmer bought, and the
bound is zero. no later round can make these 37 reviews have paid.

re-measured 2026-09-27, after i011, with the meter's divide defect repaired (the cost tool had
thrown on micro-precision bills, so the tree view could not run at all):

- poke spend **$3.32** over 445 pokes, 344 hit — still a floor
- 87 reviews followed a warmed run; the most their cache could have saved is **$1.19**
- net **-$2.13**; verdict `⛔ did NOT pay for itself`, and every lane with a follower is negative

⇒ the dogfood the wish asked for has now run across eleven guard rounds, and the answer holds: at
this route's round cadence the warmer spends ~2.8× the most it could save.

## .the cause — the window, not the prefix

a first draft of this row blamed a prefix or pin mismatch. the poke ledgers already refute that
(`F37`): a poke after the first reads **94.9%** of its prompt back, so the prefix and the pin both
hold. the warmer retires at `+45m`; the next round arrived at `+1h29m` and `+3h05m`. every follower
landed on a cache the warmer had let go — measured for those two gaps; the other 35 followers are
not yet timed one by one, which is the dream below.

🟡 the cost tool could not say so by itself — it reports a follower by ORDER, never by whether it
landed inside the warm window. that gap is what let the wrong cause be written here first:
`.dream/v2026_09_26.fix.warmer-value-omits-whether-the-follower-landed-while-warm.md`

## .the fork

### A — keep `on` by default, and fix the window (`F37` fork c or d)

a budget, or a route-state gate, so a warmer stays alive until the next round of its lane actually
arrives. the default then earns its keep. it still spends while that work is open.

### B — flip the default to `off` until a lane proves the warmer pays

one constant. stops a measured loss at once, on every hand review and every guard lane. the warmer
stays available by `--warmer on`. it overturns `S13`, so only the wisher may choose it.

### C — B now, and A as the path back to `on`

stops the bleed, keeps the repair owed. 🟡 the driver's lean, and it is still the wisher's call.

## 🟡 .why the second confidence is 50%

- a route-state gate may be cheap, and then `off` was never needed
- `S13` argued that a default is what governs the bill, and a warmer a driver must remember runs on
  none of the rounds that need it. that argument still holds once the window fits
- 🔴 a longer window also meets `F38`: a plan that outlives its keyrack unlock faults mid-plan

## .where

- `src/domain.operations/review/warmer/asReviewWarmerPlan.ts` — the default plan
- `.agent/repo=.this/role=any/briefs/research.review-cost-and-cache.md` § the warmer on real guard rounds
