# fulcrum F68 — a legacy token estimate, a private spinner, and a path-shaped polluter test hold

- rework = 🟢 **clean** — each is a later extraction or fold that lands alone
- status = 🟡 **BEST-GUESSED 2026-09-28 — hold all three**
- confidence = 🟡 **75%**
- raised.by = `enroll-impl-arch-defects-review-ops` r027, i026 (0 blockers, 3 nitpicks, all `better`)

## .per concern

| concern | disposition | why |
|---|---|---|
| nitpick.1 — `genTokenBreakdownReport` / `estimateTokenCount` beside `getOnePromptComposition` | 🟡 **disputed** | both files stand on `main` (`git ls-tree main`), and feed the pre-run dir preview, a separate question from the post-compile census. to fold them is a render change this wish did not scope |
| nitpick.2 — `withSpinner` and `ReviewTimeoutError` private to `stepReview.ts` | 🟡 **disputed** | the same shapes `F67` holds: identical on `main`. the reviewer itself defers to `F67` and adds only the recompose angle, which no second caller yet exercises (`rule.prefer.wet-over-dry`) |
| nitpick.3 — `isTargetPolluter` matches route artifacts by path shape | 🟡 **disputed** | the path match is the ruled shape of `F26` (option A, bounded and clamped). a structural route concept is a larger domain change; the reviewer grades it a note for next drift |

## .the verdict

open — for the council.
