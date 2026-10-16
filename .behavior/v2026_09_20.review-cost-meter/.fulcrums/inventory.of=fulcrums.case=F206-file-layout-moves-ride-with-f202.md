# F206 — the file layout moves ride with F202, later

- raised 2026-10-10, from i035 r031 nitpick.4 and r030 nitpick.5 `[nitpick][better]`:
  `genReviewGroveReport.ts` holds ten private procedures in 606 lines, and about eleven
  review-scoped operations sit flat at the `domain.operations/` root
- rework: 🔴 dirty
- status: 🟡 **BEST-GUESSED — deferred, with F202**
- confidence: **70%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — move now** | each grove procedure gets its own file and test; review-only root ops nest under `review/` |
| **B — move with F202** | F202 already moves the cost cli's rules and the warmer life into the domain; one layout pass touches each import once |

## .taken, and why

**B.** each move re-points imports across the route, review, and contract layers, and the root ops
are read by both `route/` and `review/`, so where each one nests needs a per-file caller census.
two moves of the same imports in two passes is the churn F202 already defers.

the one small part that was clean landed now: `onProgress` on `genReviewGroveReport` is
`OnReviewGroveProgress | null`, never optional (`rule.forbid.undefined-inputs`).

## .rework, and why

**dirty.** a dozen files moved, every importer re-pointed.

## .confidence, and why it is not higher

`asRouteKey`'s defect is testable only through the disk fold while it stays private; that one
transformer may earn its own file sooner.

## .the pass also owns, from i038 r031 nitpick.1

the parent `review/` imports its child `meter/` for shared vocabulary — `CompiledInputRows`,
`asFigureHuman` / `MARK_OF_ABSENT`, the `asTargetLocus*` transformers, `getOneLocusChars`,
`getOnePromptSectionCharsFromCompiled`. the same pass lifts them to `review/`, and its exit test is
a clamp that greps the parent for `review/meter/` imports.

## .where

`src/domain.operations/review/grove/genReviewGroveReport.ts` · `src/domain.operations/*.ts` ·
the ten parent files of `review/` that import `review/meter/`

## .verdict

(open)
