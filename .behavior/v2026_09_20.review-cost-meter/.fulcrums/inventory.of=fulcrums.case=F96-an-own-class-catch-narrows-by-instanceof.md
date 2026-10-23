# F96 — an own-class catch narrows by instanceof, not by name

- raised 2026-10-05, by `arch-hazards-maintenance-review-ops` (nitpick.4), at i002.10f90
- rework: **clean** — one catch clause in one file
- status: 🟡 **BEST-GUESSED — keep `instanceof`**
- confidence: **85%**

## .the fork, stated fairly

`compileReviewPromptOrOverflow` catches `ReviewContextOverflowError` with `instanceof`. elsewhere
the repo reads error classes by name (`isErrorOfBadRequest`), because an `instanceof` check fails
across two copies of one class.

| option | the claim |
|---|---|
| **A — keep `instanceof`** | the class is this package's own, thrown by a direct synchronous call on the line above the catch; no second copy can reach the seam. the catch reads `figures` and `composition`, which only this class carries, so `instanceof` is what makes those reads sound |
| **B — read by name** | one idiom across the repo; robust if a realm hop is ever added between throw and catch |

## .taken, and why

**A.** the name read exists for a class raised through a dependency that loads its own copy of
`helpful-errors`. no dependency, subprocess or vm sits between this throw and this catch. a name
match would narrow the type to a class whose fields a foreign value of the same name need not hold,
so B trades a real type guarantee for a guard against a hop that cannot occur here.

## .rework, and why

clean. one catch clause; if a realm hop is ever introduced, the swap is a one-line change.

## .confidence, and why it is not higher

85%: a council may prefer one idiom repo-wide over the per-seam judgment, and accept the weaker
narrow for consistency.

## .where

- `src/domain.operations/review/compileReviewPromptOrOverflow.ts`

## .the verdict, once ruled

> _unruled._
