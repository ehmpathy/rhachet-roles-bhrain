# F37 — the warmer's 45m window is a THIRD of the measured round cadence

| field | value |
|---|---|
| **rework** | 🟢 **clean** — the default plan is one constant, on an unreleased flag |
| **status** | 🔴 **OPEN** — the wisher's call, because the bound it questions is one they argued |
| **confidence** | **85%** that the window is mis-calibrated · **40%** on which fork repairs it |
| **where** | `src/domain.operations/review/warmer/asReviewWarmerPlan.ts` (`PLAN_OF_WARMER_DEFAULT`) · `0.wish` bar 11, bar 13 |

## 🔴 .the correction this row opens with

an earlier draft of this fulcrum concluded *"the warmer warms naught, and the `on` default is
indefensible."* **that conclusion was wrong, and the read that produced it was the exact defect this
drive's yield already names**: a figure was read off one surface and a cause was inferred with no
second read.

⇒ the wisher's question — *"did you prove the warmer ran?"* — is what caught it. it had **not** been
proven. the `⚠️ warm and cached NAUGHT` marker was read as *"a warmer ran and failed to warm"* when
what it states is narrower and exactly true: *a warmer ran for this lane at some point, and THIS run
served naught from cache.* the marker never claimed the two were adjacent in time, and they were not.

## .the fork, stated fairly

> **the default plan is `3x,15m` — a 45-minute coverage window. is that the right window?**

| fork | the case for it |
|---|---|
| **a — keep `3x,15m`** | `0.wish` bar 11's argument: *a warmer's total spend is BOUNDED before it starts. it exits when spent — it never polls for a round that may never come.* an unbounded poll on an eleven-lane guard is an unbounded bill |
| **b — widen the window** (`12x,15m` = 3h) | the measured cadence below. a window shorter than the gap it must span protects no round at all, so the bounded spend buys a bounded **zero** |
| **c — make the plan a BUDGET rather than a count** (`--warmer $0.50`) | the honest unit. a driver cares what it costs, never how many pokes; `k` is a proxy that hides the coverage question entirely |
| **d — gate the spawn on the DRIVER's expected return**, not a fixed count | what `0.wish`'s own amended gate clause asks for and the shipped code cannot yet reach (the review CLI holds no reference to its route) |

## 🔴 .the measurement — 2026-09-25

51 poke ledgers on disk. the warmer runs, and it runs correctly:

```
{"at":"<t+0s>","attempt":1,"act":"poke","measured":{"promptTokens":106895,"cacheGetTokens":27115,"hit":false,...}}
{"at":"<t+15m54s>","attempt":2,"act":"poke","measured":{"promptTokens":106895,"cacheGetTokens":101390,"hit":true,...}}
{"at":"<t+30m57s>","attempt":3,"act":"poke","measured":{"promptTokens":106895,"cacheGetTokens":101390,"hit":true,...}}
{"at":"<t+30m57s>","attempt":3,"act":"retire","why":"the plan is spent — 3 of 3 attempts",...}
```

(the ledger's clock stamps are masked to offsets from the first poke.)

⇒ pokes 2 and 3 serve **101,390 of 106,895 = 94.9%**. the pin holds, the LRU refresh holds, the
cadence holds. **the mechanism is sound.**

### .and then the round it was built for arrives hours late

offsets are from each round's own review.

| round | its warmer poked | retired at | next round | 🔴 COLD for |
|---|---|---|---|---|
| i006 | +18m · +33m · +49m | **+49m39s** | i007 @ +2h18m | **1h 29m** |
| i007 | +19m · +35m · +50m | **+50m42s** | i008 @ +3h56m | **3h 05m** |
| i008 | +19m (1 of 3, live) | — | — | — |

`0.wish`'s own decay census: **90.0% at 20m · 27.8% at 33m · 0 past 66m.**

⇒ every next-round review landed **1.4× to 2.8× past the point where reach measured ZERO**, onto a
prefix whose last touch was 1.5–3 hours earlier. a 0.0% is the census's own prediction, never a
contradiction of it.

### .so the observed round series has a cause, and it is not a reach defect

| round | cached | why |
|---|---|---|
| i002 | **28.5%** | the round arrived while lever **A**'s own warmth still stood — no warmer owed |
| i005–i008 | 0.0–1.7% | 🔴 the warmer **retired 1.5–3h before each round**, exactly as bar 11 designs it to |

## 🔴 .what this does to bar 11 — the bound and the benefit are the same clause

bar 11 reads: *"a warmer's total spend is BOUNDED before it starts — `k` pokes × lanes, declared up
front. it exits when spent — **it never polls for a round that may never come**."*

that clause was argued as a **safety** property, and the measurement shows it is also the **failure**
property. the two cannot be parted:

| the property | what it buys | what it costs |
|---|---|---|
| a bound declared up front | a spend a driver can refuse, and a plan a test can clamp | 🔴 a window that expires before a real round returns |
| a poll with no bound | coverage that actually spans a gap | an unbounded bill on an eleven-lane guard |

⇒ **the tradeoff is real and the wisher took the safe side of it deliberately.** what is new is the
number: the default sits at 45m and the measured cadence on this branch is **1h29m–3h56m**, so the
window is roughly a **third** of the gap it must span. that is not a wrong call; it is a call whose
input was never measured.

🟡 **and the driver's own verdict favours fork c or d over b.** to widen `k` repairs this branch's
cadence and hardcodes a new guess — the next branch's cadence is unmeasured too. a **budget**
(fork c) or a **route-state gate** (fork d) each make the plan a function of something real, and
fork d is what `0.wish`'s amended gate clause already asks for by name.

## .what the ledger still leaves open

poke **1** misses — 27,115 of 106,895 (25.4%) in the case above, 8,589 of 119,143 (7.2%) in another,
4,248 of 114,903 (3.7%) in a third. that is the **cross-process** reach, from a new process to the
replica the REVIEW warmed, and it is the one figure the clock census (90% at 20m) and the poke
ledger (~1 in 8 at partial depth) still disagree about by ~5×.

⇒ unchanged by this correction, and already caught with its two-arm instrument specified:
`.dream/v2026_09_25.fix.the-warmer-cost-bound-omits-its-own-measured-miss-rate.md`.

🟡 what this measurement DOES settle is that the disagreement is **not why the rounds read 0.0%**.
even a 100% poke-1 reach would have bought naught across a 3-hour gap.

## .what the branch does meanwhile

1. `0.wish` bar 11 gains the measured cadence beside its bound, so the tradeoff is stated with its
   input rather than as a principle
2. the `on` default **stands** — the spend is bounded, and a 45m window is right for a driver who
   re-arrives inside it. the defect is calibration, never the switch
3. the five warmer defects repaired this round stand regardless: a failhide and a race are defects
   whether or not the window is well-chosen

## 🔴 .fork b is TAKEN as a best guess — 2026-09-25

the wisher's direction was *"try and drive with the warmer live"*, which fork a cannot satisfy: at
`3x,15m` the warmer is dead by the hour the next round arrives, so no drive can be made with it live.
⇒ **`PLAN_OF_WARMER_DEFAULT` is now `12x,15m` — a 2h45m window**, which covers the measured 1h29m–3h05m
band and sits at `BOUND_OF_WARMER.pokesMax`.

| what the guess buys | what it costs |
|---|---|
| the first window with a chance of a return, so the payback question becomes ANSWERABLE | ~**4x** the spend: `~$0.56` a round across 11 lanes, against `~$0.14` |
| a live warmer at the next round, which is what the wisher asked for | the default now sits AT its own bound, so a wider window needs the bound moved too |

🟡 **the 4x is not 4x more waste.** the `3x` plan's spend was measured at **entirely** waste — every
round it covered read 0.0% — so this is the first spend that can return anything. and `--warmer off`
remains one token away.

🔴 **this does not close the fulcrum.** fork b is the guess a driver may make (`rule.always.defer-fulcrums-to-last`);
forks **c** (a budget) and **d** (a route-state gate) remain the better answers and remain the
wisher's, because each makes the plan a function of something measured rather than of a second guess.
⇒ what this drive adds is that fork a is now **refuted by measurement** rather than merely questioned:
a 45m window on this branch's cadence protects no round at all.

### what moved with it

| site | why it had to move |
|---|---|
| `PLAN_OF_WARMER_DEFAULT` | the constant itself |
| `asReviewWarmerPlan.test.ts [case1]` | it pinned `3x,15m` as the measured default — plus a NEW `then` that asserts the window covers the shortest observed gap |
| `runReviewWarmer.integration.test.ts [case9]` | it pinned the schedule with literals. 🔴 **now DERIVED** from the plan, with the window's arithmetic pinned as the one literal — a clamp that must be edited to follow its subject reports an edit rather than a defect |
| `review.ts` `--help` | it hardcoded `3x,15m` and would have drifted. 🔴 now interpolated from the constant (`rule.require.single-source-of-truth-for-render`) |

## 🔴 .the lesson, which is this drive's own, arrived once more

> *each artifact was checked to **work**, never checked to be **coherent with its neighbours**.*

the cost report and the poke ledgers are neighbours. the report was read, a cause was inferred from
its marker, and a fulcrum was filed on the inference. **the ledger sat on disk the whole time and
answered the question in four lines.**

⇒ the mechanical form: **a `⚠️` marker states a CO-OCCURRENCE. it never states a CAUSE.** to read a
cause off one is the same move as a `grep` that finds two words in one file and reports a relation —
*a search proposes; only a read disposes* (`rule.always.reuse-pavement-before-improvise`).

## .the verdict, once ruled

_(unwritten — the wisher's)_
