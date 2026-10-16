# fulcrum F49 — five new files export more than one operation, and seven carry `write*`/`render*`

- rework = 🔴 **dirty** — every importer rewired by hand; the verb half reaches two files on main
- status = 🟡 **BEST-GUESSED 2026-09-26 — option B, defer + dream**
- confidence = 🟡 **75%**
- raised.by = peer lane `arch-opport-decomposition` (approved), nitpicks 1–3, round hash `f9989f17260b48b058`

## .the fork

- **multi-export** — `genLogDirName.ts` (3 ops), `warmer/asReviewWarmerPaths.ts` (4),
  `warmer/asReviewWarmerLock.ts` (4), `getOneAttributionGrade.ts` (2),
  `meter/asPromptSectionCharsFromCompiled.ts` (2). all branch-new
- **verbs** — `writeMetricsExpected`, `writeMetricsRealized`, `writeScopeArtifact`,
  `writeScopeDebugArtifact`, `writeTokenArtifacts`, `renderTargetSection`. all branch-new

### A — split and rename now

the multi-export half is branch-new, so it is clean by `F27`'s test. 🔴 the verb half is not: the
five `write*` names follow `writeInputArtifacts` and `writeOutputArtifacts`, which are ON MAIN in
the same dir. to rename only the new five leaves `review/` with two verbs for one act; to rename
all seven reaches files this wish never touched.

### B — defer both halves as one dream (taken)

one sweep, one review: split each multi-export file (shared constants keep one home), rename every
`write*` in `review/` to `set*` and `renderTargetSection` to `asTargetSection`, rewire importers.

### C — split now, defer the verbs

halves the dream. 🟡 a reasonable council pick — the split has no main-side ripple.

## 🟡 .why 75%

- C is arguably the scouts-honor answer, and the split alone is ~15 new files and a rewire of every
  importer by hand (a grep for each op name — `sedreplace` cannot split one import line into many)
- no nameable harm ships: `better` on every nitpick

## .where

- the dream: `.dream/v2026_09_26.fix.review-ops-one-per-file-and-sanctioned-verbs.md`
