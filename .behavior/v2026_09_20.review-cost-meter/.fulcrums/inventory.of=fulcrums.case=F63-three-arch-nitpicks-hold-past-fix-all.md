# fulcrum F63 — three arch nitpicks hold past "fix all"

- rework = 🟡 **mixed** — clean for nitpick.9 and nitpick.10's remainder; 🔴 **dirty** for nitpick.2
- status = 🟡 **BEST-GUESSED 2026-09-28 — fix seven, hold three, each by name**
- confidence = 🟡 **80%**
- raised.by = peer lane `enroll-impl-arch-defects-review-ops`, i014 r027 (0 blockers, 10 nitpicks, all `[nitpick][better]`)

## .the fork

the directive for this round is to fix every concern. seven of ten were fixed in code. three
resist a clean fix, so each is held here rather than conceded and left undone:

| option | cost |
|---|---|
| **A** — force all ten into code this round | nitpick.2 lifts the tally stack (`getReviewCounts`, `…ViaBrain`, `…ViaRegex`, their errors and tests) out of `route/` — a cross-module move under a cost-meter wish. nitpick.10's remainder turns a sync findsert async across 16 call sites |
| **B** — fix what is clean; dispute the one that is no defect; defer the dirty with a dream (taken) | each hold is a judgment, hence this row |

## .per concern

| concern | disposition | why |
|---|---|---|
| nitpick.2 — `runOneReview` imports from `route/guard/review/` | 🟡 **disputed** | the five imports are on main; this branch touched only the error headers in that file. the lift is `F53`'s class — extant, and a refactor the wish did not open |
| nitpick.9 — a parent SIGKILL between plan rename and pid write leaves the lock on a dead parent | 🟡 **disputed** | already cured. the child tethers itself at boot: `getOneWarmerTetherVerdict` reads the parent's claim as `claim`, and `review._.warmer.ts` runs the same idempotent handoff on its own pid before any spend. a later round reads the child's pid, never the dead parent's |
| nitpick.10 — `child.pid` read as spawn success | 🟡 **half repaired, half deferred** | the `'error'` listener landed: an uncaught spawn error crashed the review after its verdict. the boot-health wait is deferred — dream `v2026_09_28.fix.a-warmer-spawn-should-confirm-the-child-booted`. a dead-at-boot child spends naught and is respawned next round |

## 🟡 .why 80%

- a council may prefer nitpick.2 as a concession with a dream. the edge is real; only the vehicle
  is disputed. either way the rework is a relabel
- nitpick.9's refute rests on the child's boot landing inside the claim window, which
  `getOneWarmerTetherVerdict`'s own note argues and no test times

## .where

- `src/domain.operations/review/runOneReview.ts:6-14`
- `src/domain.operations/review/warmer/getOneWarmerTetherVerdict.ts`, `src/contract/cli/review._.warmer.ts:125-158`
- `src/domain.operations/review/warmer/setReviewWarmerProcess.ts`
- dream: `.dream/v2026_09_28.fix.a-warmer-spawn-should-confirm-the-child-booted.md`
