# seed S9 — the budget already knows a round is due, so the keep-alive is gated on it

## .said

> ok, so did we catch a dream to keep the cache warm if there's still budget -> we know the
> driver will hit it, keep warm up to 3x? every 15min?

🟡 no word touched.

## .settled

a keep-alive is **conditional on the review budget left**, never a bare timer. three parts, and the
first is the one that makes the other two affordable.

### the trigger — the budget left IS the prediction

`route.guard.budget` holds a round allowance. so the engine already knows, with no forecast and no
heuristic, whether another round is due:

| the budget | what it means for the prefix |
|---|---|
| **rounds left** | a driver will re-drive this guard. the prefix **will** be hit |
| **exhausted** | the guard is done. the prefix will **never** be hit again |

⇒ the wisher's phrase names it exactly: *"we know the driver will hit it."* the keep-alive fires
only where that is true, so **no warmer is ever speculative.**

🔴 that is what parts this design from a bare timer. a timer warms every prefix on a clock — every
prefix whose guard already passed among them — which is spend against a round that will never come.
budget-gated, the engine warms only what it has already committed to re-read.

### the bound — 3 warmers, 15 minutes apart

```
t+15m  warm    t+30m  warm    t+45m  warm    then stop
```

🟡 **and 45m of coverage is the right window for a reason the census already measured**, not a
round number: reach held **90.0% at 20m**, decayed to **27.8% at 33m**, and was **0 at 66m**. so
the cliff sits between 33m and 66m, and a 45m cap spans it. the cap also bounds worst-case spend at
a known figure rather than an unbounded drip.

### the arithmetic, at k=3

from this repo's measured rates — `$0.2200/M` input against `$0.0070/M` cached, a **31.4×** spread
— on the worst observed miss (`i005 → i006`, prefix **55.3k tok**, prompt **~200k tok**):

| | figure |
|---|---|
| save, if the miss becomes a hit | `55,300 × $0.2130/M` = **$0.0118** |
| cost of 3 warmers | `3 × 200,000 × $0.0070/M` = **$0.0042** |
| **net** | **+$0.0076 · ~2.8×** |

⇒ profitable at 3, and the breakeven is `k < 30.4 · P/W` → **~8 warmers** here. so 3 is
deliberately conservative, with headroom.

## 🔴 .the refinement this seed exposes — warm the PREFIX, not the prompt

the arithmetic above replays the whole prior prompt: `W = 200k` tok to protect `P = 55.3k`. so each
warmer pays for **3.6× the bytes it protects**, which is the whole reason `k` is bounded at all.

but `getAllTargetsByCacheStability` already sorts the corpus so the stable files lead. **so the
shared prefix is PREDICTABLE without the next round's prompt** — it is the head plus the stable
head of the target list.

⇒ a warmer that replays only that predicted prefix cuts `W` toward `P`, which drives the breakeven
`k` far past 8 and makes the 3-warmer cap cheap rather than merely profitable.

🟡 it is a refinement, never a precondition. the whole-prompt replay works at k=3 today.

## 🟡 .what this does NOT settle

the gate under all of it is untouched: **is eviction LRU or FIFO-by-insert?** under LRU a replayed
read refreshes residency and every figure here holds; under FIFO it refreshes naught and 3 warmers
buy exactly zero. `probe.cache.eviction` answers it for about a cent, and it must run first.

## .landed

- `.dream/v2026_09_24.feat.a-prefix-keep-alive-could-halve-the-bill-if-eviction-is-lru.md` —
  amended with the budget trigger, the 3×/15m bound, and the prefix-not-prompt refinement
- `.agent/repo=.this/role=any/skills/probe.cache.eviction.js` — the gate this rests on
