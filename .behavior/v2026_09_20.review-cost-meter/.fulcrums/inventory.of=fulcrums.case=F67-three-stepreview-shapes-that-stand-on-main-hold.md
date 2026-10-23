# fulcrum F67 — three stepReview shapes that stand on main hold

- rework = 🟢 **clean** — each is an extraction inside one file a later round can land alone
- status = 🟡 **BEST-GUESSED 2026-09-28 — extract the four exports this branch added; hold three shapes that predate it**
- confidence = 🟡 **75%**
- raised.by = `enroll-impl-arch-defects-review-ops` r027, i019 (2 blockers, 3 nitpicks)

## .the fork

r027 read `stepReview.ts` as one file with nine exports. four of them were born on this branch —
`getReviewTimeoutMs`, `ReviewBrainCallError`, `asRefsAbsentHeadline`, `getOneRealizedTokensTotal`
— and each now has its own file, with a unit test for the two transformers. the `<rules>` witness
(nitpick.2) is clamped by `compileReviewPrompt.test.ts` [case8]. what remains stood on `main`
before this branch, measured by a count of each marker in `git show main:…` against `HEAD`:

| marker | `main` | `HEAD` |
|---|---|---|
| `const withSpinner` | 1 | 1 |
| `schemaOfReviewSnippet` | 2 | 2 |
| `class ReviewTimeoutError` | 1 | 1 |
| `realizedCosts` | 12 | 12 |
| `asIsoPriceHuman(` | 11 | 11 |
| `rulesCount:` | 4 | 3 |

| option | cost |
|---|---|
| **A** — extract every shape this round | a re-plumb of the realized-metric triplet across the write, the stdout, and the return, in the orchestrator this whole wish runs through |
| **B** — extract what this branch added; hold what predates it | each hold is a judgment, hence this row |

## .per concern

| lane | concern | disposition | why |
|---|---|---|---|
| r027 | blocker.1 — nine exports in one file | 🟢 **conceded, better** | the four this branch added are extracted. `withSpinner`, the three zod schemas, and `ReviewTimeoutError` stand identical on `main` |
| r027 | blocker.2 — realized metrics assembled three times | 🟡 **disputed** | the triplet stands identical on `main` (12 and 11 above). this branch neither added nor widened it |
| r027 | nitpick.1 — the files summary built three times | 🟡 **disputed** | `main` builds it four times; this branch removed one |
| r027 | nitpick.2 — the `<rules>` witness is unenforced across two files | 🟢 **conceded, better** | clamped by `compileReviewPrompt.test.ts` [case8]; the reader's comment now names the clamp |
| r027 | nitpick.3 — review-issue schemas inline | 🟡 **disputed** | the schemas stand identical on `main`; their extraction is blocker.1's pre-extant half |

## .the verdict

open — for the council.
