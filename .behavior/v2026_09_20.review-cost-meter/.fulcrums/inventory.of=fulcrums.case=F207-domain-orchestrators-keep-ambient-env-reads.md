# F207 — domain orchestrators keep their ambient env reads, for one repo-wide pass

- raised 2026-10-10, from i035 r030 nitpick.3 `[nitpick][better]`: `stepRouteDrive` and
  `stepReflect` pass `process.env` / `process.cwd()` to their predicates instead of a caller's
  value, so a test must mutate the global
- rework: 🔴 dirty
- status: 🟡 **BEST-GUESSED — deferred; dream caught**
- confidence: **75%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — inject `env` into these two now** | their tests pass a literal env |
| **B — one repo-wide pass** | dozens of prod reads of `process.env` / `process.cwd()` sit in `domain.operations/`, most on main; two lifted sites leave every other test that mutates the global in place |

## .taken, and why

**B.** the predicates already take `env` as input, which is the seam a pass needs. a two-site lift
makes the codebase speak two dialects for one concern and buys no parallel-safe suite, since
`stepReview`, `runStoneGuardReviews`, and the timeout reads mutate the same global in their tests.

## .rework, and why

**dirty.** a context field threaded through each orchestrator and contract that reads process state.

## .confidence, and why it is not higher

the two sites the reviewer named are the ones this branch added; a reviewer can fairly say new code
should take the target shape even while the old does not.

## .where

`src/domain.operations/route/stepRouteDrive.ts` · `src/domain.operations/reflect/stepReflect.ts` ·
dream `.dream/v2026_10_10.refactor.domain-reads-process-state-through-context.md`

## .verdict

(open)
