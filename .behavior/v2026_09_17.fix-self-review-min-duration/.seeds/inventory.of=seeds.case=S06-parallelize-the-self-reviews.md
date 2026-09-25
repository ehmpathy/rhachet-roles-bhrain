# seed S06 — keep the timer, and parallelize the self reviews

## .said

> keep the timer

> but lets make it possible to paralellize the self reviews, in case they want to fork and repair in parallel

🟡 two sends, one continued thought. surface repairs only: `lets` → `let's`, `paralellize` →
`parallelize`. the ask is unchanged.

## .settled

### 1. the timer stays — `F01` is closed

the third and final statement of it (`S02`, `S05`, `S06`). option **B** is ruled, and `F01` is
RESOLVED rather than best-guessed.

### 2. a driver may hold SEVERAL self reviews at once

the guard serves exactly one unpromised review per run today — `findNextUnpromisedReview` takes the
**first** unpromised slug (`.find()`), and `setStoneAsPassed` mints a trigger report for that one
slug alone.

⇒ so a stone with M self reviews is a strictly serial ladder: promise, re-run, promise, re-run.
the ask is that **all M be claimable at once**, so a driver may fork — a subagent per review — and
repair concurrently.

## 🔴 .the two asks are ONE change, and that is the result

the serial ladder and the hash key are the same defect seen from two sides, and the hashless
trigger report closes both:

| | today | after |
|---|---|---|
| **fork, then repair** | reviewer A's repair mints a new hash → reviewer B's clock restarts → B is refused for A's work | no hash in the key. A's repair is invisible to B's gate |
| **the M clocks** | slug `n`'s clock starts only when slug `n-1` is promised ⇒ **M × 30s, serially** | all M triggers mint together ⇒ **M clocks run concurrently, 30s total** |

🔴 **so today a fork is worse than useless — it is actively punished.** parallel repair is the
maximal generator of hash churn, which is the one input that resets every in-flight clock. the
wisher's two asks are not a settlement plus a feature; the feature was **blocked by the very thing
under settlement**.

## .the precedent this does not invent

the peer ladder already learned it. `setStoneAsPassed.ts:336`:

> *"it needs NO hash. under P2 the debt is keyed to the reviewer, so readiness does not depend on
> the current generation at all."*

and `getStonePromises.ts:12`: *"all promises are hashless (firm checkpoints that don't
invalidate)."*

⇒ **two of the three artifacts in this subsystem are already hashless, on a reason that applies
verbatim to the third.** the self-review trigger report is the straggler, not a new design.

## .what it opens

- how the guard presents M reviews at once rather than one — `F07`
- whether a promise may name several slugs, or stays one call per slug — `F07`
