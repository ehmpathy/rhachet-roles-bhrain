# fulcrum F29 — `--warmer off` stops the spawn, and not the spender

- rework = **clean** — additive, one emit and one guard clause; no extant figure moves
- status = ✅ **RULED 2026-09-24** — **built the same hour it was found**
- confidence = ✅ **built**, clamp proven red
- raised.by = self, at the bar-by-bar thoroughness audit of the warmer

## .the cue that fired

the audit read each bar as THREE claims — its **name**, its **test**, and the **purpose clause**
that says what the bar is for. that read is what found `F27`, and it found a second instance
within the hour:

| bar 13 | verdict |
|---|---|
| the NAME — *"`--warmer off\|on\|<k>x,<m>m` parses, and `on` is the default"* | ✅ met — 18 assertions in `asReviewWarmerPlan.test.ts` |
| the TEST — *"`off` spawns no process"* | ✅ met — `off` yields a null plan, and no spawn |
| 🔴 the PURPOSE CLAUSE — *"any spender a driver cannot stop is a spender they will not enable"* | 🔴 **unbuilt** |

## 🔴 .the gap, precisely

`review.ts` gated the SPAWN and the WORD behind one condition:

```ts
if (warmerPlan && reviewed.outcome === 'reviewed')
  emitReviewWarmerSpawn({ … });
```

`--warmer off` yields `warmerPlan === null`, so the whole block is skipped. correct for the spawn;
🔴 **wrong for the silence.** the arc a cost-conscious driver actually walks:

| round | what they do | what happens |
|---|---|---|
| 1 | `rhx review …` at the default `on` | a warmer spawns, detached, 3 pokes over 45m |
| 2 | reads the bill, runs `rhx review … --warmer off` | 🔴 the round-1 warmer **pokes on, and bills on** |
| — | scans stdout for a cue | 🔴 **there is none.** the gate swallowed the word with the spawn |

⇒ **the driver takes the one documented lever and believes the spend stopped.** that is
`rule.forbid.failhide` at the exact surface this branch was opened to fix — an engine act that
spends real money with no word behind it.

🟡 and the pid that WOULD end it was printed by the round-1 spawn emit, which scrolled away rounds
ago. so the lever is reachable and the spender is not stoppable, which is the precise condition the
wish clause names.

## .the fork

### A — kill the live warmer where `--warmer off` is passed

🔴 **refused.** `off` asks for **no spawn**, never for a **reap**. to end another round's process on
the strength of this round's flag would kill a spender the driver may still want, and it makes a
read-shaped flag destructive (`rule.require.safe-by-default`).

### B — SPEAK, and hand the driver the kill (taken)

```
🦉 warmer: off — and a warmer from an earlier round is STILL awake
   ├─ reviewer: repo-rules
   ├─ pid: 1294886
   ├─ note: --warmer off stops the next spawn, never a live warmer
   └─ stop it: kill 1294886
```

the act stays the driver's; the surface owes them the fact and the fix
(`rule.require.errors-name-the-fix`).

### C — defer it as a dream

🔴 **refused, and the refusal is the fulcrum-grade part.** the reflex after `F27` was to reach for
a dream. the SAFE/CLEAN test says otherwise, and a `git status` is what settled it:

```
M  src/contract/cli/review.ts
?? src/domain.operations/review/warmer/
```

**every file is this branch's own.** no peer holds one. a deferral here would have been a deferral
on **no ground at all** — which is the failure `F27` recorded, one more time.

## .what closed

- `getOneReviewWarmerPid` — extracted from `genReviewWarmer`'s private copy, so the two callers
  cannot disagree about what "the pid" means (`rule.always.reuse-pavement-before-improvise`)
- `emitReviewWarmerDisowned` — speaks only where a warmer is **LIVE**, never on a stale pid file
- `review.ts` — a second branch beside the spawn gate, for the `off` case
- clamp **proven red**: silenced the emit → **4 of 6 failed**, and `[case2]`/`[case3]` — the two
  cases that EXPECT silence — stayed ✅, so the red was the defect and never a broken fixture

## 🔴 .the residual was deferred, and the deferral did not survive one grep

the first draft of this fulcrum left the **`found`** branch open: it states no bound, and by bar 14
`found` is the COMMON case across a route, so bar 11's *"declared up front"* was met on round 1 and
on no round after. worse, a driver who raises `--warmer 10x,5m` mid-route gets the round-1
`3x,15m` warmer **silently** — the asked plan discarded while *"already awake"* scans as
confirmation.

that was dreamed on a stated CLEAN objection:

> *"a fourth file in a directory whose contract (`NAME_OF_WARMER_ARTIFACT`) is asserted across two
> suites"*

🔴 **the ground was false, and one grep refuted it.** `NAME_OF_WARMER_ARTIFACT` appears in exactly
**two places, both inside its own file**, and in **zero** test files. there was no contract to
ripple through.

⇒ **that is the third deferral on this branch to rest on a claim nobody re-derived** — `F27`'s peer
collision, `F14`'s parser count, and now this. the first two were other people's claims inherited;
this one was **mine, written an hour earlier**. `rule.require.trust-but-verify` is not only for
inherited claims.

### so it was built, in the same round

| | |
|---|---|
| `NAME_OF_WARMER_ARTIFACT.plan` + `asReviewWarmerPlanPath` | `warmer.plan.json`, beside the pid |
| the write | in the SAME breath as the pid, so a later round cannot find one without the other |
| `getOneReviewWarmerPlan` | 🔴 `null` where absent — never `PLAN_OF_WARMER_DEFAULT`. it fails LOUD on a torn or shapeless file, so a corruption cannot read as *"a warmer from before this shipped"* |
| the render | three states as three: **agree** → state the bound · **differ** → name both, plus the kill · **unknown** → claim no bound |
| clamp **proven red** | collapsed `null` into the asked plan → **1 of 16 failed**, and it was exactly `[case5] it CLAIMS NO BOUND rather than guess one`. the agree and divergence cases stayed ✅ |

🟡 **the `[case5]` red is the one that mattered.** a `null` that falls back to the asked plan renders
a confident `3 pokes, 15m apart` about a process whose real plan nobody recorded — and it would
look *right*, because the asked plan usually IS the default. a wrong bound stated with confidence
is worse than the silence it replaces.

## .the lesson

**the three-part bar read is now 2-for-2**, and both hits share a shape: the name and the test were
built by the author who wrote the bar, and the purpose clause was the half that described what the
bar was FOR — so it scanned as prose rather than as a requirement.

⇒ **treat the clause after "so that" as a bar in its own right.** it is where both defects sat.

🟡 **and the second lesson is about the deferral, not the defect.** a SAFE/CLEAN test is only as
honest as the facts it cites. *"asserted across two suites"* was a plausible sentence that felt
like a check and was never run — the same shape as `F14`'s count and `F27`'s collision. ⇒ **a
deferral's ground is a CLAIM, and it owes the same verification any other claim does.**

## .see also

- `F27` — the same three-part read, one bar earlier, same day
- `F14` — *"a deferral was taken on a count nobody re-derived"*, the lesson this repeats
- `0.wish` bar 13 — the clause this discharges · bar 11 — the clause the residual closed
- `rule.require.trust-but-verify` — unpaid here on a claim of my own authorship
