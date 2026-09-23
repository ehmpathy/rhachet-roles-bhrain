# F20 — the repeatable-retry defect stays in its dream, and only the magnitude flake is repaired

| field | value |
|---|---|
| `rework` | 🟢 **clean** — a later fix is additive to a suite this behavior does not own; no assertion this behavior authored moves |
| `triage` | 🔴 **wisher** — a scope call, `F13`'s shape |
| `confidence` | 🔴 **40%** ⬇ — was 80%. 🔴 **the row's own escalation trigger fired** (§ *the trigger is MET*) |
| `status` | best-guessed, **and its rarity premise is refuted by measurement** |
| `opened` | 2026-09-19, at `5.3.verification`, while a snapshot flake in `review.by.guard-peer.acceptance` was repaired |
| `amended` | 2026-09-19, after a post-passage re-run measured the gate RED in **2 of 2** full acceptance runs |

## .the call

> **`when.repeatably` × `useThen` × `toMatchSnapshot` is broken in two directions at once, and that
> defect is RECORDED in a dream rather than fixed in this behavior.**

the dream carries the first-party evidence:
`.dream/v2026_09_19.fix.the-repeatable-retry-is-decorative-because-usethen-memoizes-across-attempts.md`.

## .what was found, in one line each

| defect | the evidence |
|---|---|
| the retry **never retries** — `useThen` memoizes, so all 3 attempts assert one result | the drive took **39480 ms**, then **128 ms**, then **13 ms** |
| attempts 2+ **assert naught** and report green — the snapshot key carries the attempt ordinal, so only attempt 1 ever holds a baseline | the same bytes were red at attempt 1 and green at attempts 2 and 3; `git diff` shows no `attempt 2` key was written |

## 🔴 .what WAS repaired, so the boundary is exact

**the two are different defects in one file, and only one of them was safe and clean.**

| | the magnitude drift | the retry defect |
|---|---|---|
| how often | 🔴 **every run** — `1 blocker` vs `2 blockers` on one fixture | 🔴 **every full run measured since** — see below. this cell read *"latent; surfaced once in 3 runs"* and that estimate is refuted |
| where the fix lands | two sanitizers **in this file** | `test-fns` semantics + a 4-case matrix |
| safe? | ✅ yes | 🔴 no — every LLM suite in the repo leans on that pair |
| clean? | ✅ yes | 🔴 no — 8 snapshot keys and the case docblock's stated matrix |
| verdict | **fixed** — `maskConcernMagnitudes` | **dreamed** |

⇒ `maskConcernMagnitudes` collapses a **nonzero** count to `[N]` and leaves a **zero** verbatim, so
`0 blockers` still proves an APPROVED verdict while a magnitude drift cannot fail the seam. the
suite ran **54 passed / 0 failed / 0 skipped, exit 0** at the moment of the repair — 🔴 **and it
does not hold. see below.**

## 🔴 .the trigger is MET — measured 2026-09-19, after the stone had passed

this row's own escalation clause reads: *"a second red on this suite in CI → the rarity argument
fails, and option C at least becomes owed."* **it fired.**

| # | run | scope | result |
|---|---|---|---|
| 1 | `2026-09-19T17-29-36Z` | full acceptance | 🔴 3599 passed · **2 failed** |
| 2 | `2026-09-19T17-53-32Z` | scoped to this suite | 🔴 52 passed · **2 failed** of 54 |
| 3 | `2026-09-19T18-52-35Z` | full acceptance | 🔴 3599 passed · **2 failed** |
| 4 | after the amendment above | scoped to this **case** | ✅ **15 passed · 0 failed** |

**every failure, every red run, is one case:** `[case-seam-pass-aggregation] … code is clean › [t0]
… attempt 1` — `the guard-tree stdout is stable` and `the captured peer artifact is stable`.

🟡 **run 4 is recorded because it is GREEN, and a row that cited only its reds would overstate.**
⇒ **3 red in 4 observations.** that is a high rate rather than a certainty, and it is what makes the
case red on a full run and green when a driver re-runs it to check — the worst shape a flake has,
since the check that would confirm it is the check most likely to clear it.

⚠️ **and it does not rescue the row.** *"red in 2 of 2 FULL runs"* is the figure the gate is graded
on, and a scoped single-case pass is not a gate.

### 🔴 and the drift is a VERDICT FLIP, which `maskConcernMagnitudes` was never built to absorb

| the baseline | what arrived |
|---|---|
| `approved` · `0 blockers ✓` | 🔴 `rejected` · `[N] blockers 🔴` |
| `judge.1 - allowed` | 🔴 `judge.1 - blocked` |
| `passage = allowed` | 🔴 `passage = blocked` + `reason = blockers exceed threshold ([N] > 0)` |

🟡 **the `[N]` is proof the repair WORKS.** the sanitizer collapsed the count exactly as designed;
what it cannot collapse is `approved` → `rejected`, and by design it must not — a mask that hid a
verdict flip would be a failhide.

⇒ **so the repair is not the defect and the row's split is still real.** what is refuted is the
row's **rarity estimate**, and that estimate is the whole of its argument for a deferral.

### 🔴 the surface is REPO-WIDE, and it was measured rather than inferred

the dream's second defect — *"only attempt 1 ever holds a baseline"* — is not local to this case.
a census of every snapshot baseline in `blackbox/__snapshots__`:

```
rhx grepsafe --pattern 'attempt [0-9]' --path blackbox/__snapshots__
  → 18 baselines, across 5 files
```

| the census | the count |
|---|---|
| snapshot baselines keyed `attempt 1` | **18**, in `review.by.acceptance`, `.guard-peer`, `.journey`, `.dispatch`, `.wrapper` |
| 🔴 baselines keyed `attempt 2` or `attempt 3` | 🔴 **ZERO**, repo-wide |

and `package.json:67` settles what that costs in CI:

```
"test:acceptance": "… jest … $([ -n \"${CI:-}\" ] && echo '--ci') …"
```

⇒ **CI runs jest with `--ci`, so an absent baseline is a hard FAILURE there, never a silent write.**

### 🔴 so the retry buys naught, and the mechanism is now exact

| criteria | what it needs | what it gets |
|---|---|---|
| `SOME` (CI) | any one of 3 attempts green | 🔴 attempts 2 and 3 have **no baseline** and `--ci` forbids a write ⇒ both fail by construction |
| ⇒ the net | *"pass if any attempt succeeds"* | 🔴 **collapses to "attempt 1 must pass"** |

**`rule.require.repeatable-for-llm-tests` exists to absorb exactly this flake, and for all 18
snapshot assertions it absorbs none of it.** the retry runs, costs its minutes, and changes no
verdict.

⇒ 🟡 **this REFINES the dream rather than contradicts it.** the dream read the local run, where an
absent baseline is written silently and attempts 2+ report an un-asserted green. under `--ci` the
same absence inverts to a guaranteed red. **both are the same root defect** — the attempt ordinal
in the snapshot key — and it is harmful in both directions.

### 🔴 what this costs

this row's `option A` bought *"one rare flake stays live on a suite this behavior barely touches."*
the measurement re-prices it three ways:

1. **a red acceptance gate**, in 2 of 2 full runs
2. **the `i004` guard walk does not run acceptance**, so twelve reviewers approved a stone whose
   gate was red, and the yield asserted the green
   (`5.3.verification.yield.md` § *the verdict*)
3. 🔴 **18 snapshot assertions repo-wide carry a retry that cannot help them**, so the rate at which
   any of them reds is the raw brain-variance rate, un-damped — ✅ **6 of the 18 are repaired here**;
   the residual 12 sit under 4 other suites and are `ehmpathy/test-fns#71`'s

⇒ **the deferral did not cost a rare flake. it cost the verification stone's own verdict, and the
census says the same exposure sits under 17 further assertions this behavior never opened.**

### 🔴 the provenance — this branch changed AUGHT observable in the red case

the stone's mandate says *"there are no prior failures"*, so this row does **not** use provenance as
an excuse. it is recorded because it decides **where the fix belongs**, which is the row's question.

```
git diff origin/main -- blackbox/__snapshots__/review.by.guard-peer.acceptance.test.ts.snap
git diff origin/main -- blackbox/review.by.guard-peer.acceptance.test.ts
```

| what the diff shows | consequence for `[case-seam-pass-aggregation]` |
|---|---|
| the snapshot moved in `[case-seam-findings]` and `[case-seam-malfunction]` **only** | its baseline is **byte-identical to main's** |
| the test body gained `maskConcernMagnitudes` and two docblocks | its case body, fixture, rubric, and brain are **byte-identical to main's** |
| 🔴 the sanitizer's regex is `\b(?!0\b)\d+ (blocker\|nitpick)s?\b` | it **skips zero by construction** ⇒ on a 0-count pass case it is the **identity function** |

⇒ **for this case, this branch is a no-op.** the identical brain call on `main` produces the
identical flip against the identical baseline. **the flake pre-exists this branch, and the fix lives
in a suite this behavior does not own.**

### 🔴 is there a change the DRIVER is permitted to make that closes it?

`rule.always.raise-a-blocker-a-taken-cannot-close`'s test, run per candidate:

| candidate | permitted? |
|---|---|
| fix `when.repeatably` to re-derive per attempt | 🔴 **no** — it lives in `test-fns`, another repo |
| drop the attempt ordinal from the snapshot key | 🔴 **no** — same, `test-fns` |
| hoist the snapshots out of `repeatably` (`option C`) | 🔴 **no, and on TWO grounds now** — see below. it is dirty **and it does not close the red** |
| re-snap the received | 🔴 **forbidden outright** — it would pin `rejected` as the baseline for a case named *"code is clean"*. a fake test (`rule.forbid.failhide`, `philosophy.verification-strictness`) |
| mask the VERDICT as the counts are masked | 🔴 **forbidden outright** — `maskConcernMagnitudes`'s own docblock, authored on this branch, states why: *"a ZERO count survives verbatim … a pass case whose brain raises a concern still fails its snapshot, **as it must**."* to mask it is to make a case named *"code is clean"* prove naught |
| sharpen the fixture so the rubric cannot bite | 🔴 **no** — a fixture tuned until a brain agrees is the same fake test, one hop out. ⚠️ **and it would lower a RATE rather than close a defect** — the exact deferral shape this board's own `F20` note forbids |

⇒ **every fix is either in another repo or is an unasked test change on a sealed route.** this row
is therefore handed up rather than absorbed, and the halt carries it.

### 🔴 .the sharper read — option C is not merely DIRTY. it does not CLOSE the red

> **measured 2026-09-20, from the red run's own snapshot diff** —
> `.log/…/2026-09-19T18-52-35Z.stderr.log:1001-1058`.

the diff is a **brain verdict flip**, not a render drift:

```
     ├─ r1: term-aggregation (l1, 1/3)
-    │   ├─ approved [TIME]          ← the baseline
+    │   ├─ rejected [TIME]          ← what the brain returned
-    │   ├─ 0 blockers ✓
+    │   ├─ [N] blockers 🔴
...
-    └─ ✓ judge.1 - allowed
+    └─ ✗ judge.1 - blocked
```

⇒ the brain graded `SRC_CLEAN_GENERIC` **dirty**, on a case whose name and fixture both say clean.

🔴 **and the snapshot is the ONLY assertion in that case that reads the verdict at all.** the three
that precede it check other things, and all three passed in the red run:

| the assertion | what it actually checks | red run |
|---|---|---|
| `useThen('… and approves')` | only that the drive **resolved**. its name says approves; its body asserts no verdict | ✓ |
| `then('… its reviewer row shows the slug')` | `stdout` contains `term-aggregation` | ✓ |
| `then('… IS a raw base review, NOT a review.by tree')` | the artifact's shape | ✓ |
| 🔴 `then('the guard-tree stdout is stable')` | 🔴 **the verdict, the counts, and the judge outcome** | ✕ |

**so option C's arithmetic:**

| | what option C does | what it does to THIS red |
|---|---|---|
| the retry | becomes honest — one drive, one baseline, no un-asserted green | ✅ a real repair of the **latent** defect |
| 🔴 the flake | the one drive still meets a probabilistic brain | 🔴 **untouched.** it reds at the same rate, and now **deterministically** on the drive that flips |

⇒ 🔴 **option C repairs defect 2 and absorbs defect 1 not at all.** only **option B** — re-derive per
attempt, so `SOME` can observe a second outcome — closes this red, and option B lives in `test-fns`.

🟡 **and option C's cost is larger than the fork table states.** the attempt ordinal is part of the
snapshot KEY, so to hoist is to rename every key it touches ⇒ **all 18 baselines across 5 files go
stale at once**, and under `--ci` a stale key is a hard failure rather than a silent rewrite. the
fork priced C as *"a four-case verdict matrix"*; the census prices it at **18 baselines, 5 files**.

⇒ **the refusal of option C is therefore no longer a SCOPE argument a council may simply overrule.**
a council that rules *"re-open the route and take option C"* would spend an 18-baseline rewrite and
**the gate would still be red**.

## .the fork, stated fairly

| option | what it does | what it costs |
|---|---|---|
| **A — repair the magnitude, dream the retry** (taken) | the permanent flake is gone; the latent one is recorded with its measurement | one rare flake stays live on a suite this behavior barely touches |
| **B — re-derive per attempt** | 🔴 **the ONLY option that closes the measured red** — the retry becomes real, so `SOME` can rescue a verdict flip | 🔴 the change lives in `test-fns`, and every LLM suite in this repo leans on `useThen`'s memoization |
| **C — hoist the snapshots out of `repeatably`** | exactly one baseline comparison, so no attempt reports an un-asserted green — 🔴 **and the red stays red** | 🔴 **18 baselines across 5 files**, not a four-case matrix. see § *the sharper read* |
| **D — both** | the pair is honest end to end, **and the red closes** | 🔴 B's blast radius plus C's, inside a verification stone |
| ✅ 🔴 **E — retry at the DRIVE layer** (RULED, shipped) | re-invoke the real guard subprocess per attempt, bounded at 3, until the case's own declared verdict class is reached. **the red closes, and `test-fns` is untouched** | one suite-local operation + one assertion per case + 6 key renames |

## ✅ .the verdict — 2026-09-20, and it fell OUTSIDE A–D

the wisher answered **"fix the flake; make it retryable"** and **"seed it to `test-fns` now"**, which
did not pick among A–D — it **dissolved** the fork by a fifth option the table never held.

| what shipped | measured |
|---|---|
| `driveGuardUntilVerdict`, the drive-layer retry | `25 passed · 0 failed · 0 skipped` (101s), against **192** skip-markers before |
| the clamp, proven to bite | honest predicate = **1** drive (~21s) · forced unreachable = **3** drives (~78s) |
| the harness defect, upstream | 🔴 **`ehmpathy/test-fns#71`**, with six falsifiable bars (B1–B6) |

⇒ **option B is not abandoned, it is DISPATCHED.** what changed is that it stopped to be this
route's blocker: the suite is green here, and the mechanism fix is owed by the repo that owns it.

### 🔴 .the lesson — the fork was bounded by the defect's own vocabulary

A, B, C, and D all vary **one** axis: *which of three nouns do we touch* — `when.repeatably`, the
snapshot key, the fixture. every noun came from the defect report.

⇒ **the live axis was LAYER — assertion · drive · harness — and the drive position was never a
row.** the fork looked exhaustive because its four options covered every *combination* of the three
nouns, which is a complete walk of the wrong dimension.

🟡 **the guard is `rule.require.enumerate-before-you-name`, one level out:** before a fork is handed
to a council, **state the axis its options vary on**. had this row declared *"axis = which noun"*,
the absent axis would have been visible in the same glance.

⚠️ **and no instrument on this route would have caught it.** the consistency sweep needs two
artifacts that disagree, and the yield, this row, and the dream all inherited the identical option
set. only a party outside that vocabulary could surface the fifth option — which is what happened.

🔴 **the fork's shape changed once the red was diffed: B is load-bearing and C is hygiene.** they
read as two routes to one destination and they are not — **C alone leaves the gate exactly as red as
it was.** that argument still holds; it simply graded the wrong option set.

## ⚠️ .why it is not 93%

the stone's own mandate is the strongest argument against this row, and it is quoted rather than
paraphrased: **zero deferrals**, and *"if a test is flaky — fix it. if a test fails for reasons
unrelated to your changes — fix it anyway."*

⇒ **this row defers a known flake, and the stone forbids a deferral by name.**

the counter, and a council may fairly reject it: the clause is discharged for the defect that was
**permanent** — the magnitude drift recurred on every run and is now closed — and the residual is a
**harness** property that no edit inside this behavior's blast radius can reach safely. the split is
real, and the stone's prose draws no such line.

🔴 **that counter rests on the word *latent*, and the word no longer applies.** the residual is red
in 2 of 2 full runs, so it is not a latent property of the harness — it is **a failed gate**. ⇒ the
counter is weakened at its root, which is why the grade fell 80% → 40%.

🟡 **and this is the second row on this board to reserve a call the stone would otherwise force**;
`F19` reserves the pty clamp on the same ground. a council that rules either way should rule both.
🔴 **their evidence has now diverged** — `F19`'s deferral is still un-refuted by measurement, and
this one's is not. a council may fairly split them where it would once have ruled them together.

## .what would move it

- 🔴 ~~a second red on this suite in CI~~ → **MET.** red in 2 of 2 full runs ⇒ **the rarity argument
  has failed, and `option C` is owed.** what this row still asks is no longer *whether* but *where*
  — in this behavior, or in a successor that owns the suite
- a council that rules the zero-deferral clause covers a **harness** flake → **option D**
- a `test-fns` release that re-derives a `useThen` value per attempt → **part B dissolves**
- a verdict that a `toMatchSnapshot` inside a repeatable block is forbidden repo-wide → **option C**,
  and the audit its dream names becomes the deliverable
- 🔴 a **third** consecutive red, or a red observed on `main` → the flake is not a flake at all, and
  the case's baseline is simply wrong for the brain that runs it

## ✅ .the residual this row carried — DISCHARGED 2026-09-20

it read: **the stone reads passed and its acceptance gate is red** — a state no fulcrum can settle
on its own, handed to the wisher as a passage question.

the wisher ruled it: **fix the flake, and make the retry real.** ⇒ the retry moved to the drive
layer, the gate measures **3572 passed · 0 failed · 0 skipped**, and the two halves of the state no
longer disagree. **no passage question survives.**

🟡 **one residual outlives the row, and it is not this stone's.** the mechanism defect is
`ehmpathy/test-fns`'s, tracked at `ehmpathy/test-fns#71` with six falsifiable bars, and 12
ordinal-keyed baselines across 4 other suites still sit under it. the workaround here is
consumer-local and does not generalize — which is why the dream stays open.

## .see also

`F13` — the scope-call shape this shares · `F19` — the peer deferral, on the same stone and the same
ground · the dream above, which carries the timings and the snapshot-key evidence ·
`blackbox/review.by.guard-peer.acceptance.test.ts` — `maskConcernMagnitudes` and its `.why` ·
`rule.require.repeatable-for-llm-tests` — the contract the pair fails to honor
