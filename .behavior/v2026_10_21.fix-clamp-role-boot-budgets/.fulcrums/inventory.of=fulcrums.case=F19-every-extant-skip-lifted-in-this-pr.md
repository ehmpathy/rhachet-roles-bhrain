# F19 — every extant skip in the selected suites is lifted in this PR, the premium one included

## .the fork

5.3 demands zero skips. the bounded integration run reported 67 skipped, from nine extant
markers: seven thinker suites in `src/domain.roles/thinker/skills/**` (stepArticulate,
stepCatalogize, stepCluster, stepDemonstrate and its `when.skip`, stepDiverge, stepInstantiate,
stepTriage) and one review case, `stepReview.caseBrain.claude-sonnet.integration.test.ts`.
either unskip them here, or leave them and defer.

## .taken, and why

lifted, all nine. the first call (at 5.3 entry) left them skipped as dirty: the thinker notes
cited an OpenAI quota, and a live re-enable looked like a credential question. that premise was
checked rather than assumed, and it did not hold:

| suite | skip reason | run with the skip lifted |
|---|---|---|
| 7 thinker suites (8 markers) | "OpenAI quota issues in CI" | 7 files, 15 passed, 0 failed, 0 skipped (45s) |
| `stepReview.caseBrain.claude-sonnet` | "anthropic api too pricey for ci" | 1 file, 63 passed, 0 failed, 0 skipped (119s) |

the quota reason has lapsed, so the stale notes went with the markers. the stone says a skip is a
gap to fix, and with the suites green the fix is the deletion of nine markers — it touches no
role behavior and no credential, so it passes CLEAN.

## .rework — clean

the one live cost is the premium suite: it now runs `anthropic/claude/sonnet` on every ci run. to
re-gate it on cost is a one-line revert of `describe(` to `describe.skip(` — no caller, no
contract.

## .confidence — 65%, and why it is not higher

the claude-sonnet skip was a deliberate cost call by its author, and the default-brain suite
already covers the review contract on every run. a council may rule that the spend outweighs the
second-model coverage. that is a monetary judgment a human owns; the zero-skip mandate is the
stone's, so the stone's mandate is taken and the revert is named.

## .where

`src/domain.roles/thinker/skills/**/*.integration.test.ts` ·
`src/domain.operations/review/stepReview.caseBrain.claude-sonnet.integration.test.ts`. the dream
`v2026_10_22.fix.unskip-the-thinker-llm-suites` is retired, fixed here.

🟡 four older dreams name the same skips among others
(`v2026_09_19.fix.five-skipped-suites-…`, `v2026_09_22.fix.eleven-skip-and-only-sites-…`,
`v2026_09_23.fix.eight-llm-suites-are-skipped-…`, `v2026_09_27.fix.re-enable-the-79-skipped-…`).
each also names sites outside this run's selection, so they stay open; the sites this PR cleared
no longer count toward them.

## .verdict

open — for the council, on the premium suite's ci cost only.
