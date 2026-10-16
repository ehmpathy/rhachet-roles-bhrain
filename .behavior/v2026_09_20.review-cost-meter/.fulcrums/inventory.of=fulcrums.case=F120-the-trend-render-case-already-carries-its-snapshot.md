# F120 — the trend render case already carries its snapshot

- raised 2026-10-07, by the driver, against `behavior-intent-coverage-review-ops` nitpick.1 at 5.1 i010
- rework: **clean** — none owed; were the reviewer right, the fix is one `then` block
- status: 🟡 **BEST-GUESSED — dispute it**
- confidence: **97%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — add a snapshot to `[case16][t0]` (the reviewer's ask)** | the trend variant of the levers block renders with only text-match checks, so its window header and column placement are unpinned |
| **B — no change (as shipped)** | `[case16][t0]` already ends in `then('the render matches snapshot', … expect(out).toMatchSnapshot())`, line 957 of `genReviewGroveStdout.test.ts` |

## .taken, and why

**B.** the case the reviewer names holds the exact block it asks for, the very snippet the report
quotes. the location it cites (line 1035) is a later case. a second snapshot of one render would
pin naught new.

## .rework, and why

**clean.** were it owed, one `then` block.

## .confidence, and why it is not higher

the reviewer may have meant a different case under the case16 label; the cited line points at
one. its snapshot sits at line 1034, so that case is pinned too.

## .where

`src/domain.operations/review/grove/genReviewGroveStdout.test.ts`

## .verdict

— (awaits the council)
