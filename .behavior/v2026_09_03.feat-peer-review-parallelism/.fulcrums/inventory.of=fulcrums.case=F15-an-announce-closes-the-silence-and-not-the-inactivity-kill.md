# fulcrum F15 — an announce closes the SILENCE and not the inactivity KILL, and this round stops at the silence

- **case** = F15
- **title** = an announce closes the silence and not the inactivity kill, and this round stops at the silence
- **rework** = **clean**
- **status** = OPEN — deferred, dream caught
- **confidence** = **89%**
- **raised** = 2026-09-13, at i009 r010 (`enroll-impl-behavior-intent`, point 1) — **the reviewer named the harm; this row records what the repair does and does NOT reach**

## 🔴 .why this row exists — the repair closes a DIFFERENT harm from the one the reviewer cited

i009/r10 raised the non-tty silence and named a concrete harm, quoted:

> a CI runner that reaps a job with no output for N minutes

⇒ the repair landed — one `🦉 l1 pours 4 lanes` line per level, on genuine stderr, before any lane
launches. **it closes the silence and it does not close that kill**, and the arithmetic says so
plainly:

| | when it writes | what a reaper sees after it |
|---|---|---|
| the landed announce | **once, at t≈0** | 🔴 naught, for up to `PT21M` |
| a heartbeat at 30s | every 30s | a line, always inside any reap window ≥1min |

⇒ so a reader can now part *"this level is slow"* from *"this level never began"* — which is the
defect that shipped. **a reaper still kills the job**, because a reaper measures the quiet *after*
the last byte and the announce moves that instant by milliseconds.

⚠️ **the distinction is recorded because the repair would otherwise read as complete.** the reviewer's
point cited one harm; the fix answers an adjacent one, and a round that reports *"point 1 —
repaired"* with no further word leaves the cited harm live and unnamed.

## .the fork, stated fairly

| the option | what it costs |
|---|---|
| **A — the one-time announce only** ✅ | the silence closes; the reap window stays open |
| **B — add a heartbeat at a cadence decoupled from `SPIN_MS`** | a new timer, a new lifecycle to tear down, a new stream contract, and a cadence nobody has picked |
| **C — un-gate the extant spinner under a pipe** | 🔴 **refused by measurement** — `SPIN_MS` is 80ms against `PT21M` ⇒ **~15,750 lines** on one level. `genContextCliEmit [case10]` clamps its absence |
| **D — raise `RHACHET_REVIEW_TIMEOUT_MS` so lanes finish inside a reap window** | 🔴 inverts the dependency — it bends the review bound to fit a runner's, and it is the operator's dial rather than this code's |

🟡 **C is the option the reviewer's frame invites and the one already refused on the record.** the
tradeoff had been priced as a binary — spam or silence — and A is the third term neither arm held.
⇒ that is the i009 point's real content, and it is why A landed rather than merely got argued.

## .taken, and why at the time

**A.** three reasons, and the third is the one that makes B a judgment rather than a ride-along:

1. **A is O(1) and B is O(duration).** the announce's whole claim is that it costs one line per
   level. a heartbeat re-opens the volume question A was chosen to avoid, at a number nobody has set
2. 🔴 **the cited harm does not land on this repo's CI.** walked 2026-09-13 — this repo runs
   **GitHub Actions** (`.github/workflows/`: provision, publish, release, review, test), and GitHub
   Actions has **no log-inactivity timeout**. that reap behavior is a CircleCI-class property. ⇒ the
   harm is real **for a runner this repo does not use**
3. **the cadence is unpriced.** 30s gives 42 lines over `PT21M` and is defensible; so is 60s, and so
   is *"only while a lane is inflight"*. that is a contract decision, and a contract picked
   mid-execution to close a nitpick is the shape this round spent four fulcrums to learn to refuse
   (`rule.require.enumerate-before-you-name`)

⇒ the arithmetic that bounds the whole fork, in one row each:

| cadence | lines over `PT21M` |
|---|---|
| `SPIN_MS` = 80ms (option C) | 🔴 **~15,750** |
| 30s (option B, candidate) | **42** |
| once (option A, landed) | **1** |

## .rework, and why it is CLEAN

a heartbeat is additive at the same site the announce already occupies — `runStoneGuardReviews`
holds the level's roster and its pour boundary, and `console.error` is already the stream in use
there. no caller hardens against the announce, and no snapshot reads it (verified: `Grep` for
`pours` across `blackbox/__snapshots__` returns no match, because the line goes to genuine stderr
while `route.ts:980` hands the emit `process.stdout`).

⇒ so B lands later as a timer plus a teardown, with the announce untouched beside it.

## 🔴 .it is the F11/F12 shape INVERTED — the fix is clean and the CONTRACT is not

three rows on this board now read `rework = clean` with a deferred fix. F15 is the first whose dirt
sits in neither the implementation nor the blast radius:

| case | what its dirt was |
|---|---|
| **F11** | the blast radius — four snapshot files re-baselined |
| **F12** | the blast radius — four **frozen** oracles |
| **F14** | the implementation — a module lift, which then decayed and flipped |
| 🔴 **F15** | 🔴 **the CONTRACT** — the cadence is a number nobody has chosen, and the code is trivial |

⇒ 🔴 **so `fix = not clean` is THREE verdicts under one word, not two.** this inventory's own result
was that an implementation cost decays while a blast radius does not. **a contract gap decays on
neither axis** — it stays exactly as expensive until someone rules the number, and no growth of the
diff makes it cheaper or dearer.

⚠️ **the practical consequence: F15 must NOT be re-priced each round.** F14's lesson was that an
implementation deferral goes stale; applied blindly here it would produce a round that re-reads a
trivial diff, finds it still trivial, and lands a cadence the wisher never picked.

## .confidence, and why it is not higher

**89%.** the 11% is two doubts:

1. 🔴 **a runner this repo does not use today is a runner it could use tomorrow.** reason 2 above is
   a fact about the current `.github/workflows/`, and a migration to a reaper-class runner would make
   the cited harm land here with no code change at all. the defer is sound **against the present CI**
   and its premise is one line of config away from false
2. **the announce may be enough in practice even on a reaper-class runner**, and that is unmeasured.
   a level whose lanes each seal a settled block emits bytes as members land, so a 4-lane level is
   quiet only between its last launch and its first settle. ⇒ the true reap exposure is the **longest
   inter-settle gap**, not `PT21M`, and nobody has measured it

🟡 **doubt 2 would RAISE the number and is recorded anyway**, because a fulcrum that lists only its
own supports is `rule.forbid.obfuscation`'s selective-citation shape.

## .where

- `src/domain.operations/route/guard/review/asReviewLevelPourAnnounce.ts` — the landed option A, and its `🟡 .bound` names this fulcrum
- `src/domain.operations/route/guard/genContextCliEmit.ts` — `drawStatus`'s `.why`, where the spam arithmetic that refuses C lives
- `blackbox/driver.route.peer-concurrency.acceptance.test.ts` — the two wire clamps
- `.behavior/v2026_09_03.feat-peer-review-parallelism/1.vision.experience.case=8.the-onlooker-sees-several-in-flight.md` — the corrected `[case2]`/`[t1]`, plus the stream table
- `.dream/v2026_09_13.feat.a-piped-log-emits-no-heartbeat-after-its-announce.md` — the caught work

## .what would overturn it

**a measurement, and it is the F10/F12 shape rather than the F2 shape** — a traveler can run it with
no wisher present:

| the probe | if it says |
|---|---|
| does this repo's CI reap on log inactivity? | ✅ **yes** ⇒ the cited harm lands here, and B is owed in the round that finds it |
| what is the longest inter-settle quiet gap on a real level? | 🔴 **longer than the reap window** ⇒ B is owed even on a runner that reaps generously |
| — | **shorter than any plausible window** ⇒ A is sufficient and this row closes |

⇒ the second probe is the valuable one, and it is **cheap now that concurrency exists** — the i001
and i002 nine-wide levels already recorded per-lane durations for F7's margin, and the gaps fall out
of the same data.

🟡 **it was not run in this round** because its outcome changes no act this round may take: B needs a
cadence, and a cadence is a contract. **it is owed by the round that picks the number**, and it is
stated here so that round does not re-derive the question.

## .the verdict, once ruled

— unruled.
