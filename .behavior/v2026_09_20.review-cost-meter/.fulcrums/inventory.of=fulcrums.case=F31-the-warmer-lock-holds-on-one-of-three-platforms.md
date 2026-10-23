# F31 — the warmer's per-lane lock holds on ONE of three platforms

- raised = 2026-09-24, in peer review i004 `r7` (`arch-hazards-behavior`, nitpick.1)
- rework = 🔴 **dirty**
- status = 🟡 **BEST-GUESSED — option A: defer, dream + row in the same act**
- confidence = 🟡 **78%**

## .the fork

`F30` closed bar 15's purpose clause by an identity check: `process.kill(pid, 0)` answers
*"does SOME process hold this pid?"*, and a read of `/proc/<pid>/cmdline` answers *"is it
OURS?"*. the second read is **linux only**.

so the question this fork reserves is not whether `F30`'s fix was right — it is:

> **does a lock that holds its stated guarantee on one platform of three ship as-is, with
> the degradation stated, or does it owe a portable mechanism before it ships?**

| | option A — ship, state the degradation | option B — recast on an advisory lock |
|---|---|---|
| mechanism | pid file + liveness probe + `/proc` identity, refute-only | `flock` (or `O_EXCL` + heartbeat); the kernel releases it on exit |
| macOS / windows | falls back to the pre-`F30` behavior — a liveness probe over a recycled number | ✅ identical to linux |
| staleness | possible, and bounded by the refute-only rule (it can free a latched lane, never latch one) | ✅ impossible by construction |
| cost | zero — shipped | a dependency node core does not carry, **or** a heartbeat protocol; 4 source files + 4 integration suites |
| who may rule it | the driver | 🔴 **the wisher** — a new runtime dependency is theirs to approve |

## .what was taken, and why AT THE TIME

**option A.** three reasons, in the order they weighed:

1. 🔴 **the fallback errs in the safe direction.** `isPidOurWarmer` REFUTES on identity and
   never CONFIRMS on it, so an unreadable `/proc` reads as OURS. the failure it can produce is
   a **cold lane** (bar 15), never a **duplicate spender** (bar 14) — and the duplicate is the
   worse of the two, because it bills.
2. **option B is not a driver's call.** it needs `proper-lockfile` / `fs-ext`, or a heartbeat
   protocol invented here. a dependency is the wisher's to approve
   (`rule.always.spend-own-levers-before-escalation`), and a heartbeat is a new hazard surface
   in a detached, unattended spender.
3. **the degradation is already stated in the code**, with the textbook alternative named. so
   what was missed was never a note — it was a **record**, which is what this row and its dream
   now are.

## .the rework, and why DIRTY

| | |
|---|---|
| **safe?** | 🔴 **no.** it swaps the idempotency key of a spender that runs detached against a live provider with real money at stake. the current direction of failure is deliberate; a recast can fail the other way, and the failure is silent by construction — nobody observes a warmer that never spawned |
| **clean?** | 🔴 **no.** a dependency or a heartbeat protocol, plus `genReviewWarmer`, `isReviewWarmerAlive`, `emitReviewWarmerSpawn`, `emitReviewWarmerDisowned`, and four integration suites — none opened by this branch's stone |

⇒ both answers are `no`, so `rule.always.fix-forward-under-scouts-honor` names it a dirt
deferral, and a dirt deferral owes **both** artifacts: the dream records the work, this row
records the call.

## 🟡 .the confidence, and why it is not higher

**78%.** the three reasons above hold, and two doubts remain:

- 🔴 **the platform census is a claim, not a measurement.** *"macOS and windows"* names where
  `/proc` is absent; nobody measured how many travelers actually drive from one. if the answer
  is zero, the row is noise; if it is most of the org, option A shipped a guarantee that holds
  for the driver who wrote it and nobody else
- 🟡 **`F30`'s own ground expired within hours**, and this row inherits its shape: a deferral
  that rests on *"a dependency is the wisher's"* is a **principle** ground rather than a
  schedule one, so it does not perish on a clock — but it does perish the moment a wisher is
  asked and answers. ⇒ **the trigger is an ask, and the ask has not been made**

## .where

- `src/domain.operations/review/warmer/isReviewWarmerAlive.ts` — `isPidOurWarmer`, the
  `procRoot` default, and the `raw === null ⇒ true` refute-only rule
- `src/domain.operations/review/warmer/asReviewWarmerPaths.ts` — the pid path under
  `.agent/.cache/`, which is what makes staleness a multi-day window
- `.dream/v2026_09_24.feat.the-warmer-lock-degrades-to-a-bare-pid-probe-off-linux.md`

## .the verdict

_(unruled — the council's)_

## .see also

- `F30` — the row this one is the residual of: the identity check that closed bar 15 on linux
- `F27`, `F29` — the two warmer rows whose deferrals ran out the same day. this one differs in
  kind: its ground is a **dependency approval**, which does not expire on a clock
