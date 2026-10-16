# F17 — two behavior levers shipped on byte counts alone

| | |
|---|---|
| **rework** | clean / 🔴 dirty — the tail flip is a one-line reorder; the new-file representation is 🔴 dirty (it changes what every reviewer reads) |
| **status** | OPEN — a wisher call, **owed a row since 2026-09-20** |
| **confidence** | 🔴 55% that ship-then-verify is right here, 90% that the byte measurements are sound |
| **raised** | i019, by `enroll-impl-behavior-intent` — the **third** time this drive's own deferral criterion fired |

## .the fork

two of the four cheapen levers changed **what a reviewer reads** and were argued on **bytes
alone**. each is a real fork, and both were best-guessed toward *ship it*:

| lever | the byte argument, measured | the behavior question, unmeasured |
|---|---|---|
| **D — the tail emits `target` then `conversation`** | +31.1pp cache on a 12-target corpus | does a reviewer still recall the conversation when it no longer sits last? 🔴 one fixture **regressed 81.9% → 70.1%** |
| **B — a new file's body carried ONCE (diff dropped)** | −792.7k chars, ~39.7% of the pre-lever prompt | does a reviewer cite lines as accurately without the `+` prefix that marks them new? |

### the fork, stated fairly

**ship now, verify at `5.3`** — what was taken. the byte win is large, measured, and
immediate; the behavior risk is bounded by the fact that a reviewer still receives every line
either way. a verification stage with a live brain is the only place the A/B can run at all.

**hold until measured** — the road not taken. a reviewer that misses a defect *still returns a
well-formed verdict*, so the failure mode is **silent** — no instrument on this branch can see
it, and a regression would ride into every lane on the ladder before anyone noticed.

## 🔴 .why the second half of that fork is stronger than it looks

every other clamp on this branch measures a quantity that **announces itself when wrong** — a
sum that goes negative, a share that trips a bound, a cost that renders absent. these two do
not. ⇒ **the one failure mode this branch cannot detect is the one these two levers risk**,
and that asymmetry is why the row exists rather than a shrug.

## .why it was best-guessed rather than halted

`rule.always.defer-fulcrums-to-last` — and the rework grades split:

- **D (the tail order)** is **clean**: one reorder in `compileReviewPrompt`, no caller touched.
  a reversal is a revert
- 🔴 **B (the new-file representation)** is **dirty**: `isTargetDiffSent` is now read by the
  renderer **and** the census, and `[case2]` clamps its absence. a reversal moves the decision,
  two readers, and a clamp

⇒ so B is the half that earns the row most, and a dirt deferral owes a fulcrum by
`rule.always.fix-forward-under-scouts-honor`'s own text — *"a dream alone reports the work and
hides the call."*

## .what the A/B needs, so the council is not handed a wish

| | |
|---|---|
| **D** | two runs of one lane over one corpus, tail-first vs tail-last, same brain, same targets. compare concerns raised, and whether any cites the conversation |
| **B** | two runs over a corpus with ≥1 new file, diff-dropped vs diff-carried. compare whether cited line numbers land on the right lines |

both need a **live brain** — which is a verification-stage act by construction, the same
constraint that holds `case=6 [t3]` open.

## .where it lives

- `src/domain.operations/review/compileReviewPrompt.ts` — the tail order
- `src/domain.operations/review/isTargetDiffSent.ts` — the new-file decision, and `[case2]`
- `1.vision.yield.md` → `[wisher]` — both questions, stated with their crossover conditions
- `.dream/v2026_09_19.feat.the-tail-order-trades-31pp-of-cache-for-target-recency.md`
- `.dream/v2026_09_20.verify.a-new-files-representation-was-chosen-on-bytes-not-behavior.md`

## 🔴 .the meta-lesson — this drive's criterion has now fired three times, at three peer rounds

the sweep at i010 found **eight dirt deferrals and one fulcrum between them**, and listed four
as *"real judgments, no peer has re-raised them, so a row would dilute the council."* the
stated trigger was **a peer who re-raises it**.

| when it fired | the row it produced | what it cost |
|---|---|---|
| i012 | `F10` | one round of `enroll-impl-behavior-intent` |
| i014 | `F14` | one round of `enroll-impl-arch-defects` |
| **i019** | **`F17`** | one round of `enroll-impl-behavior-intent` |

⇒ **three for three, and every one landed on a peer rather than the driver.** the trade the
i012 note called *"cheap, and not free"* has now been paid three times at the same price.

🔴 **so the honest read has moved.** at one occurrence the criterion was defensible; at three
it is a policy with a measured cost and no measured benefit — the *"quieter index"* it buys was
never worth a round, because a council skims rows and a lane spends a whole round to find one.

⇒ the correction is mechanical, and it belongs to the next drive rather than this one: **a
dirt deferral gets its row when the dream is caught, never when a peer finds it.** the sweep is
a `Glob` for `SAFE — no` / `CLEAN — no`, which this inventory already named as the detector and
then used as a queue rather than as a trigger.

🟡 **one of the four listed at i010 is still unrowed**, after `F9`, `F10`, `F14`, and this.
