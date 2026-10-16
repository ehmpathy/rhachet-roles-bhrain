# F277 — jest pins a string with its inner quotes unescaped

- raised 2026-10-12, by `ergo-snapshot-visual-blemishes` (nitpick.15), at 5.3 i004
- rework: **clean** — no change is owed
- status: 🟡 **BEST-GUESSED — disputed; a false positive**
- confidence: **90%**

## .the fork, stated fairly

the `getAllReviewerLevels` integration snapshot pins a malformed-guard reason with inner `"` unescaped.

| option | the claim |
|---|---|
| **A — leave it** | jest's snapshot serializer writes strings with `escapeString: false` by default, so a `"` inside a string is never escaped. the pin is the true value |
| **B — escape the quotes** | the snap reads as malformed |

## .taken, and why

**A.** the snapshot is the serializer's own output, not a render this repo builds. every string
snapshot in the repo that holds a `"` shows the same form (for one,
`blackbox/__snapshots__/driver.route.guard-upgrade.acceptance.test.ts.snap:149`,
`--mode must be "plan" or "apply"`). to escape the value would change the reason a driver reads.

## .rework, and why

**clean.** naught to change.

## .confidence, and why it is not higher

none to speak of; the call rests on the serializer default.

## .where

`src/domain.operations/route/guard/__snapshots__/getAllReviewerLevels.integration.test.ts.snap`

## .verdict

— (awaits the council)
