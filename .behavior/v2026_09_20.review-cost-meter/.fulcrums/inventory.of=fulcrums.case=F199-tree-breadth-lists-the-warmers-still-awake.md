# F199 — `--of tree` lists the warmers still awake, with a kill per lane

- raised 2026-10-09, from i034 r028 nitpick.1 `[nitpick][better]`: a detached warmer's pid prints
  only on the round that spawned it and on a later round of the same lane; a driver who cleared the
  terminal has no command that lists live warmers with their kill
- rework: clean
- status: 🟡 **BEST-GUESSED — deferred; overrule it to add the branch now**
- confidence: **80%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — a `warmers awake` branch at `--of tree` now** | built from `getOneReviewWarmerLive` and `asWarmerKillCommand`, one row per live lane, an acceptance case with one live record |
| **B — next round** | the spend is bounded (k pokes per lane per gap) and `--warmer` defaults `off`; the stop line already prints on every later round of the lane |

## .taken, and why

**B, for this round.** the branch is an addition to a published render with its own acceptance
case, and this round's repairs already move three render contracts. no harm ships: the spend is
capped by the plan, and the default spawns none.

## .rework, and why

**clean.** an added branch on one breadth; no extant row or flag changes.

## .confidence, and why it is not higher

it is the "stop it" half of vision case=7, so it is owed; the defer is of when, not of the cure.

## .where

`src/domain.operations/review/genReviewTreeReport*` · `src/contract/cli/review.ts` (`--warmer` help)

## .verdict

**repaired 2026-10-10 (i036 r028 nitpick.1).** `rhx review._.cost --of tree` now closes with
`emitReviewWarmersAwake`: a stderr `warn` that names each lane whose warmer still beats, with its
stop (`kill <pid>`, or the record path where an unknown pid lands). silent where none is awake.
clamped by `emitReviewWarmersAwake.integration.test.ts` (dedupe, lapsed, absent, unknown pid;
proved red with the dedupe removed). the `--warmer` help points at it.
