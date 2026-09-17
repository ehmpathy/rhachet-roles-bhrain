# fulcrum F7 — the per-reviewer timeout is wall-clock, and concurrency inflates what it measures

**rework** — clean · **status** — open · **confidence** — 🔴 **90%**, up from 78% — **the measurement
item 1 owed has been made**

## 🔴 .the measurement — 9 real lanes, concurrent, 2026-09-10

item 1 below asked the execution stage to *"record per-lane durations"* on a real concurrent run.
**it is made.** peer review iteration i001 on this very stone ran **nine l1 lanes**, and each wrote
`metrics.realized.json` into its own log dir:

| lane (spawn ms) | duration | input tokens | cost |
|---|---|---|---|
| 32-742 | 85.3s | 454,589 | $0.0656 |
| 32-837 | 🔴 **101.6s** — the slowest | 454,845 | $0.0670 |
| 33-160 | 63.6s | 449,480 | $0.0644 |
| 33-258 | 63.9s | 459,186 | $0.0660 |
| 33-522 | 85.2s | 462,199 | $0.0671 |
| 33-538 | 49.2s — the fastest | 448,896 | $0.0637 |
| 33-641 | 93.1s | 455,328 | $0.0661 |
| 33-692 | 86.7s | 477,262 | $0.0686 |
| 33-778 | 65.2s | 459,065 | $0.0647 |

### 🔴 acceptance 1, measured on a real level rather than on a fixture

| quantity | value |
|---|---|
| **sum of the nine durations** — what a serial level costs | **693.8s** ≈ 11m 34s |
| **level wall clock** — first spawn to last exit | 🔴 **101.7s** |
| **the ratio** | 🔴 **6.8×** |
| **saved, on one arrive** | 🔴 **592s ≈ 9m 52s** |

⇒ *"wall clock for a level approaches its slowest member rather than the sum of its members"* — the
wish's own words. **the level cost 101.7s against a slowest member of 101.6s.** the overhead of the
whole fan-out is **95ms**.

🟡 **and the fan-out is directly witnessed, not inferred**: nine distinct log dirs, nine distinct
pids (2908057–2908065), all spawned inside **1,036ms**. that is the `l1Peak` oracle's claim, made by
the real guard on a real stone rather than by a mock.

### 🔴 what it says about THIS fulcrum — the margin is 12.4×

| quantity | value |
|---|---|
| the bound | `PT21M` = **1,260,000ms** |
| the slowest lane observed, under 9-way contention | **101,611ms** |
| 🔴 **fraction of the bound consumed** | 🔴 **8.1%** |
| the multiplier a lane would need before it trips | 🔴 **12.4×** |

⇒ the fulcrum's own two worlds were: *"if 8-way contention adds 10%, `PT21M` absorbs it and this is
a non-issue. if it adds 300% … timeouts become common."* **the observed worst case sits at 8.1% of
the bound, so even the 300% world lands at 24% and trips nothing.**

⚠️ **the honest bound on this result, stated rather than smoothed:** it is the **concurrent** half
only. no solo baseline was run against the same artifact set, so **the contention multiplier itself
is still unmeasured** — I can say what a 9-wide lane costs and not what it would have cost alone.

🔴 **that turns out not to matter for the decision**, and this is the useful part: the multiplier was
only ever a means to answer *"does a lane trip the bound?"* **the margin answers that directly, and
it needs no baseline.** a lane would have to be 12.4× slower than its observed concurrent self —
never merely 12.4× its solo self — before `PT21M` bites.

⇒ so the deferral is no longer a bet between two worlds. **it is a measured margin**, and 78% → 90%.

### 🔴 a SECOND sample, from round i002 — and it nearly halves the margin

the next nine-wide level on the same host settled at `78508, 90839, 115781, 126004, 143385, 143837,
149217, 169450, 195456` ms.

| quantity | i001 | 🔴 i002 |
|---|---|---|
| slowest lane | 101,611ms | **195,456ms** |
| fraction of `PT21M` consumed | 8.1% | 🔴 **15.5%** |
| the multiplier before it trips | 12.4× | 🔴 **6.4×** |
| sum of durations | 2,428.6s | 1,212.5s |
| wall clock | 195.9s | 195.5s |
| ratio | 12.4× | **6.2×** |

🔴 **the same level, on the same host, ran its slowest lane 1.92× slower the next time.** ⇒ the
honest claim is a **range — 6.4× to 12.4×** — and the single number above was a best case reported as
the measurement.

⚠️ **the confidence holds at 90% rather than falls back.** a lane would still need **more than 540%**
inflation on the worse of the two samples before `PT21M` bites, which is the quantity this fulcrum's
two worlds were about, and 540% sits well clear of the 300% world it named.

🟡 **what the second sample changes is the PRECISION of the claim, not its direction** — and it
supplies a caution the first could not: **a level whose slowest lane swings 1.92× run-to-run is a
level whose worst case two samples do not bound.** reason from 6.4×, never from 12.4×.

### 🟡 and it prices F2's resource concern, which no measurement had reached

| quantity, across the nine concurrent lanes | value |
|---|---|
| input tokens in flight at once | 🔴 **4.12M** |
| cost of one 9-wide arrive | **$0.593** |

⇒ ~455k input tokens per lane corroborates radio task **#404**'s independently-measured ~355k target
base, from a second guard. **the multiplication F2 fears is real and now has a number** — what it
does not yet have is a ceiling, because nothing failed.

⚠️ **and nine is below ten, so `DEFAULT_LEVEL_CONCURRENCY = 10` did not bind here.** this run is
what F2's open number governs, and it is exactly the case c3's reconciliation table describes: at ten
or fewer members, `10` and unbounded are indistinguishable. **so this measurement prices the
behavior F2 ships and rules on F2 not at all.**

---

## .the mechanism

🔴 **found in self-review r3 (requirements), after the guard refused a hasty promise.** it is the
only hazard in this vision where **the feature itself manufactures the failure**, so it is stated
at length rather than filed as a note.

## .the mechanism

`runStoneGuardReviews.ts:74` —

```ts
const DEFAULT_REVIEW_TIMEOUT: IsoDuration = 'PT21M';
```

— and `:170` passes it per-reviewer into `runOneReview({ cmd, timeout, cwd })`. it is a
**wall-clock** bound on one lane.

every extant value of it — the `PT21M` default, and any `timeout:` an author has tuned by hand —
was calibrated under **serial** execution, where a lane runs alone with the whole machine and the
whole provider quota.

### 🔴 there are TWO such bounds per lane, and FOUR sites — corrected in r3's second pass

the first draft of this fulcrum named two sites. verified in the tree, there are four, and they
divide into **two independent wall-clock bounds** that both degrade under contention:

| bound | sites | what it guards |
|---|---|---|
| the **subprocess** bound | `runStoneGuardReviews.ts:74` (default) · `RouteStoneGuard.ts` `timeout?` (per reviewer) · 🔴 `RHACHET_REVIEW_TIMEOUT_MS` (env override, `runOneReview.ts:46-49`) | the reviewer child process |
| 🔴 the **fallback-brain** bound | `getReviewCountsViaBrain.ts:21` — `FALLBACK_BRAIN_TIMEOUT = 'PT21M'`, in-process, own env override | the sub-brain tally that **rescues** a lane whose stdout could not be parsed |

⚠️ **the second one is the worse of the two**, and it was invisible in the first draft. its own
`.why` states that a tight bound *"would spuriously malfunction the very reviews this fallback
exists to rescue"* — so contention squeezes the rescue path for the slowest lane, which is
precisely the lane most likely to need it.

⇒ under this wish, eight `rhx enroll claude` lanes share that machine and that quota. **each
individual lane gets slower in wall clock**, while the level as a whole gets faster. the timeout
measures the quantity that degrades.

## 🔴 .why it is severe rather than a nuisance — the failure spends money

a lane that trips its timeout does not simply retry. it exits without a parseable verdict, which is
a **`malfunction`** — and `isReviewPeerVerdictTerminal.ts:18-21` makes malfunction **terminal for
unlock**:

| step | what happens |
|---|---|
| 1 | contention pushes lane 7 past `PT21M` |
| 2 | lane 7 returns `malfunction` |
| 3 | l1 is now **terminal** (7 approved, 1 malfunction) |
| 4 | 🔴 **l3 opens and spends its opus budget** |
| 5 | the stone still cannot pass — a malfunction blocks passage |
| 6 | the driver diagnoses a reviewer that was never broken |

⇒ **the feature that makes the level faster can manufacture a malfunction that spends the expensive
level's budget on an artifact one lens never read.**

⚠️ and it lands squarely against the wish's own boundary — *"do not lower the bar to make the clock
look better."* this is the inverse and it is worse: **the clock genuinely improves while the bar
collapses silently**, because a timed-out lane looks exactly like a broken one.

## .the fork, stated fairly

| option | for | against |
|---|---|---|
| **leave the timeout as-is** ✅ | zero new surface; `PT21M` is generous, and most lanes finish far inside it; the contention multiplier is unmeasured, so a factor would be invented rather than derived | accepts a real hazard whose blast radius is a wrong money-spending decision |
| scale the timeout by the level's in-flight count | directly addresses the mechanism | 🔴 the multiplier is a **guess**. lanes contend on cpu, memory, and provider quota in different proportions per host — a wrong factor either masks real hangs or fails to help |
| make the timeout measure **provider time**, not wall clock | measures the quantity that should be bounded | a large change to `runOneReview`, well outside this wish |
| let a capped level be the answer | the valve already exists — an author who sees timeouts caps the level | puts a diagnosis on the author that the system could make |

## .taken, and why at the time

**leave it as-is, and declare the hazard loudly.**

- the contention multiplier is **unmeasured and unmeasurable today**, because concurrency does not
  exist yet. a factor chosen now would be an invention, and
  `rule.require.enumerate-before-you-name` applies to numbers as much as to words — i have one
  instance (this repo's 8-wide l1) and no measurement of what 8-way contention actually costs a lane
- `PT21M` is generous relative to a typical lane, so the margin absorbs a good deal of contention
- **the valve already exists.** an author whose level times out under fan-out can declare a
  `concurrency` — which is precisely the mechanism this wish adds

⚠️ **but "leave it" is only defensible if the hazard is visible**, which is why this fulcrum exists
rather than a silent decision. **a timeout-induced malfunction is indistinguishable from a genuine
one at the moment a driver reads it**, and the driver's own brief tells them to diagnose the
reviewer — which will find no defect, because there is none.

## 🔴 .what this round OWES, given the deferral

1. ✅ **DISCHARGED 2026-09-10 — see `.the measurement` at the head of this file.** nine real l1 lanes,
   concurrent, per-lane durations recorded from `metrics.realized.json`. the slowest consumed **8.1%
   of `PT21M`**, a **12.4× margin**.

   🟡 **the solo baseline is still absent, and it turned out to be the wrong ask.** the multiplier
   was only ever a route to *"does a lane trip the bound?"* — and the margin answers that with no
   baseline at all. ⇒ the debt is discharged by a **better** measurement than the one it named,
   which is worth recording: *"measure X against Y"* was one instance of *"bound the risk"*, and only
   the second was load-bearing
2. ⚠️ **the diagnosis is HALF reachable already — this debt was overstated and is now narrowed.**
   the first draft asked that a timed-out lane *"say so explicitly."* it already does:

   ```ts
   // runOneReview.ts:90
   stderr: `💥 malfunction: review timed out after ${formatTimeoutForHuman({ ms: input.timeoutMs })}`,
   ```

   with a `.why` that cites `rule.forbid.failhide` by name, and an acceptance clamp on it —
   `driver.route.peer-review-timeout.acceptance.test.ts:64` asserts the output contains
   `'timed out'`. ⇒ a driver reads *"timed out after 21 minutes"*, never a bare `malfunction`.

   **what remains owed is one field: the in-flight count.** the message names the bound and not the
   contention, so *"was this lane slow, or were seven of its co-members?"* is still a guess. add
   `under N-way concurrency` and the diagnosis closes

   🔴 **checked at execution, in a `behavior-declaration-coverage` self review: still absent, and
   deferred as DIRT rather than left silent.** the count is not available where the message is built
   — `asReviewSubprocessCapture` is a pure fold that knows no level — so it must be threaded through
   `runStoneGuardReviews` → `stepReview` → `runOneReview`, **two files this round's diff does not
   touch**, plus a re-cut acceptance snapshot.

   ⚠️ **the half that would make the clause TRUE is the measurement in item 1.** item 1's margin is
   now measured; **the inflation RATIO is not** — no solo baseline was taken, so there is still no
   evidence that contention is the cause of any given slow lane. ⇒ **measure the ratio first, then
   word the message against what it shows.**

   🔴 **and the fix SHAPE was wrong until 2026-09-11, which is what keeps it dirty.** the dream said
   *"the in-flight count at spawn"* — a number that is **confidently wrong in the one case the clause
   exists to explain**: a lane that spawns alone and dies 21 minutes later, with seven co-members
   aloft by then, reports `0 co-members`. ⇒ it must be a **live reader** — a closure over the
   bottleneck's `.active`, read at the instant of the kill — which makes it a contract change on a
   shared operation whose **second caller** (`review.by`'s `stepReviewBy`) runs no pour and must pass
   `null`, per `rule.forbid.undefined-inputs`.

   caught, per `rule.always.fix-forward-under-scouts-honor` — a dirt deferral owes a dream **and**
   this fulcrum row:
   [`v2026_09_09.fix.a-timeout-message-names-the-bound-and-not-the-contention`](../dreams/v2026_09_09.fix.a-timeout-message-names-the-bound-and-not-the-contention.md)

   🔴 **and a SECOND dream, found 2026-09-11 while that half was checked.** the obvious fallback for
   *"slow lane, or slow level?"* is the guard tree — settled lanes render `rejected [TIME]`, so a
   driver could compare. **they cannot:** `malfunction 💥` renders no duration at all, so the tree
   supplies **neither** term of the comparison. deferred because the render change re-cuts four of
   the 36 snapshots vision acceptance 2 froze:
   [`v2026_09_11.fix.a-malfunctioned-lane-renders-no-duration`](../dreams/v2026_09_11.fix.a-malfunctioned-lane-renders-no-duration.md)

   ⇒ **these are two halves of one diagnosability gap** — the message and the tree. each cites the
   other; the tree half is the cheaper of the two once a round is free to re-cut snapshots.
3. `1.vision.experience.case=9` names contention as a realistic cause of its `[t2]` malfunction, so
   the interaction is demonstrated rather than merely noted

## .why the confidence is 90% — 70% at first draft, then 78%, moved by findings that cut both ways

🔴 **78% → 90% was bought by one measurement**: the nine-lane level that produced the i001 reviews
ran its slowest member at **101.6s against a `PT21M` bound — 8.1%, a 12.4× margin**. contention
would have to inflate a lane by **more than 1,140%** to trip it.

🟡 **it is not 95%, and the ten points are the unmeasured ratio.** the margin answers the *hazard*;
it does not measure the *inflation*, because no solo baseline was taken. a level twice as wide on a
host under load is still unpriced — and that is the quantity item 2's message clause would name.

⚠️ the ledger below is the 70% → 78% move, kept because its rows still hold.

⚠️ it is still the fulcrum i am least sure of, and the reason is that **i cannot bound the risk**.

**what moved it, stated as a ledger rather than a conclusion:**

| finding | direction |
|---|---|
| a **third remedy exists** — `RHACHET_REVIEW_TIMEOUT_MS` lets an operator raise the bound with no code change and no re-declaration. the deferral rests on more than the level cap | ⬆️ **up** |
| the **failure is already legible** — the message says *"timed out after 21 minutes"*, clamped by an acceptance test. a driver is not sent to hunt a phantom defect from a bare `malfunction` | ⬆️ **up** |
| there are **two bounds, not one** — the fallback-brain tally shares the hazard, and it guards the rescue path for the slowest lane | ⬇️ **down** |
| the contention multiplier is **still unmeasured** | ⬇️ unchanged |

⇒ **the severity dropped and the surface widened.** they roughly cancel, so this lands at 78%
rather than at either extreme — and the taken decision survives both, which is the useful result.

if 8-way contention adds 10% to a lane, `PT21M` absorbs it and this is a non-issue. if it adds
300% — plausible where the bottleneck is provider concurrency rather than cpu — then timeouts
become common at exactly the widest levels, and the wish's flagship case (this repo's 8-wide l1) is
the one that breaks.

⇒ **i have no evidence to distinguish those two worlds**, and the deferral is a bet that the first
is likelier. that bet is stated rather than hidden, which is what separates a best-guess from an
oversight.

## .rework — clean

a timeout value, or a factor, in one place. reversible with a one-line change plus a snapshot
refresh. ⚠️ it does **not** turn dirty at execution the way F6 does, because no clamp will pin the
current value — but its *cost* rises, since the defect it guards would then be live.

## .where

- `runStoneGuardReviews.ts:74` — `DEFAULT_REVIEW_TIMEOUT`, and `:170`'s per-lane pass
- `RouteStoneGuard.ts:32-68` — the per-reviewer `timeout?` field authors tune
- 🔴 `runOneReview.ts:46-49` — `RHACHET_REVIEW_TIMEOUT_MS`, the env override (the third site)
- 🔴 `getReviewCountsViaBrain.ts:21` — `FALLBACK_BRAIN_TIMEOUT`, the second bound (the fourth site)
- `runOneReview.ts:90` — the timeout message, which already says *"timed out"*
- `driver.route.peer-review-timeout.acceptance.test.ts:64` — the extant clamp on that message
- `isReviewPeerVerdictTerminal.ts:18-21` — why a timeout escalates into a spend
- `1.vision.experience.case=9…` — `[t2]`, where the malfunction lands
- 🔴 **`inventory.of=fulcrums.case=F15…`** — the render interaction, below

## 🔴 .the interaction with the non-tty render — raised i009/r10, and it was unrecorded here

the reviewer's words, and the omission is exact:

> *"Neither F7 nor the render-deviation note mentions this interaction."*

⇒ **a lane may legitimately run for minutes toward `PT21M` under contention, and the slotted render
path emitted zero bytes under a pipe for that whole duration.** so the two deferrals compounded: a
long lane that is silent reads to a log consumer as a hang, and to a runner that reaps on log
inactivity as a dead job.

| the half | its disposition |
|---|---|
| the **silence** | ✅ **repaired at i009** — one announce per level, on genuine stderr, before any lane launches (`asReviewLevelPourAnnounce`) |
| the **reap** | 🔴 **open** — an announce at t≈0 does not move a reap window. carried as **F15** |
| the **inflation itself** | 🔴 **this row.** measured at a 6.4×–12.4× margin, and deferred on it |

🟡 **the compound does not move this row's confidence, and the reason is worth the line:** F7's 10%
is about the **inflation multiplier**, which is unpriced because no solo baseline was taken. the
render interaction changes what a silent lane *looks like* to an observer and changes the timeout
arithmetic not at all.

⇒ **so the interaction is a DIAGNOSABILITY compound rather than a severity one** — and that is why
it earns a cross-reference here and a fulcrum of its own rather than a re-price of this one.

## .the verdict

_open — and worth the council's attention despite the deferral, because it is the one hazard this
feature creates rather than inherits._
