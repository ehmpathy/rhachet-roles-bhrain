# F36 · the i008 enroll-impl-behavior-intent nitpicks are `better`, and fine to continue

- **rework** = clean · **status** = 🔴 **best-guessed** (5.1 execution, r010 at i008) — the council rules
- **confidence** = 70%
- **where** = the peer lane `enroll-impl-behavior-intent` at i008. backs 12 disputes, one concern
  each (S07).

## .the concern set, in one line

a FRESH, legitimate review of the current tree (683s, a live clone, not the i007 deaf-clone
malfunction that F035 covered). it found **0 blockers, 12 nitpicks**, and its own bottom line calls
the implementation *"unusually faithful to the vision."* it rejects only because 12 exceeds the
`--allow-nitpicks 7` floor.

## .the honest read — these points are LEGITIMATE, and every one is `better`

this fulcrum does **not** claim the reviewer is wrong. it claims each concern is `better` severity
(no nameable shipped harm) and fine to CONTINUE — the road drives on, and the council rules on
whether to require any before ship.

| class | the reviewer's point | why it is `better` and fine to continue |
|---|---|---|
| structured-vs-hand-rolled | the concede ack hand-rolls remedy lines rather than reuse `computeBlockRemedyGroups`; the exhaustion reason uses string markers rather than a structured field | both are **documented tradeoffs** the vision itself weighed (§*row 2 is TWO changes*, §*the fields the ledger does not have*). the string markers sit behind `isRouteGuardConcessionExhaustion` predicates so no read site can drift. no shipped harm — the feature works and is green |
| render shape | the 7th state is a boolean `skippedByDispute` flag rather than a union member | a reasoned composition choice (it composes with `overruled`). no shipped harm |
| refusal shape | R1's answer-first refusal is a fresh formatter rather than a 4th case grafted onto the contemplate prompt | functional; the drift risk is in the words, not the behavior. no shipped harm |
| coverage | no blackbox drives the dispute happy-path / `--severity urgent` / two-lane-one-block emit end to end; some pure functions have only transitive coverage | the CLI usage-error grain IS blackbox-covered (`driver.route.stance.acceptance.test.ts`, 7 cases); the driven happy-path is credential-gated and lives at unit+integration grain by a reasoned decision documented in that suite's `.note`. the fs-composition risk is already **dream-caught (F034)** and dispatched. deferrable to a follow-up |

## .the fork, stated fairly

| fork | this round would… |
|---|---|
| **A — dispute as `better`, fine to continue** *(taken)* | declare the current code fine to continue, cite this fulcrum, drive on, and hand the council 12 verified-`better` observations to rule on at the close |
| **B — concede and fix** | commit to a repair of each. but a `src/` change re-mints the guard hash (`src/**/*`), re-runs the two ~11-min l3 clones fresh, and a fresh clone review is non-deterministic — it returns a DIFFERENT nitpick set each generation. so fix does not converge; it re-argues, which is the resolution-by-exhaustion this whole behavior exists to prevent |

## .taken, and why

a concede commits the driver to a repair (`the hold stands. fix, then re-arrive`). the repair does
not converge here: the l3 lanes are live clones whose fresh reviews differ each generation, and every
`src/` edit re-mints the hash and re-triggers them. so concede-and-fix buys a treadmill, never a
terminal — the exact failure the wish names (*"more rounds do not converge them, they re-argue"*).

a dispute is honest (each concern IS `better` and fine to continue — the feature is faithful, green,
0-blockers), deterministic (the road proceeds), and cheap for the council (one fulcrum, 12 verified
observations, ruled at the close). the council backstops the call: if it holds any of these should
block ship, it rules so — cheaply, in a batch, off this one index.

## 🟡 .the honest case FOR B, which A does not fully answer

several points — the structured-reason field, the `computeBlockRemedyGroups` reuse — are ones the
**vision itself** names as the better shape. a dispute on them reads as the driver that grades its
own escape on points the design agreed with. this is real, and it is why the confidence sits at 70%
rather than higher.

⇒ the answer A rests on: a dispute claims *"fine to continue"*, not *"the reviewer is wrong."* the
feature ships and works; the structured refactors are follow-up the council may require or defer. and
the measured overturn rate on this board (28%–83%) means the council WILL catch any of these that
should have blocked — at the close, cheaply, which is the trade this design makes on purpose.

## .what would settle it

| evidence | it would move the call toward |
|---|---|
| a council read that holds `better` maintenance ships and evolves after the floor | **A** |
| a council read that requires a structured-reason field or the ack-reuse before ship | **B** for that concern — a follow-up refactor |

## .the verdict

*(unruled — the council rules at the close)*
