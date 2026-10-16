# F97 — the route↔review runner edges predate the branch, and stay until a dedicated lift

- raised 2026-10-05, by `arch-smell-scopeleaks` (blocker.2), at i003.bf5cc
- rework: **dirty** — a lift moves the review-output count parsers out of `route/guard/review/`,
  which the guard's peer-given reader, its verdict parser, and the review runner read
- status: 🟡 **BEST-GUESSED — keep both edges; catch the lift as a dream**
- confidence: **80%**

## .the fork, stated fairly

two edges cross the route ↔ review line, one each way:

- `route/guard/review/runStoneGuardReviews.ts` → `review/runOneReview` (the guard runs a review)
- `review/runOneReview.ts` → `route/guard/review/getReviewCounts*` and
  `route/guard/getDurationMsFromContent` (the runner reads a review's verdict counts)

| option | the claim |
|---|---|
| **A — keep both, catch the lift** | both edges are byte-identical on `origin/main`; this branch only widened one import to name `ReviewRun`, a type of the module already imported. the honest cure is to lift the count parsers — they read the REVIEW's output grammar, so their home is `review/` or the root — and that is its own change |
| **B — lift now** | `rule.forbid.scope-leaks` grades a bidirectional edge a blocker, and the line is touched |

## .taken, and why

**A.** the leak is real, and older than this branch. the lift is not a rename: it moves four
modules and their tests, and re-points the guard's readers and the runner — a ripple through
code this stone did not open. `rule.always.fix-forward-under-scouts-honor` says a fix that fails
CLEAN is deferred with a dream AND a fulcrum; this is that fulcrum, and the dream holds the shape:
`dreams/v2026_10_01.fix.runonereview-reaches-into-route-guard-for-its-tally-seam.md`.

## .rework, and why

dirty. four modules (`getReviewCounts`, `getReviewCountsViaBrain`, `getReviewCountsViaRegex`,
`getDurationMsFromContent`), their tests (one a live-brain suite), and their readers in `route/`
(the peer-given reader, the verdict parser, the totals) and `review/` (the runner).

## .confidence, and why it is not higher

80%: a council may rule that a touched line owes the cure regardless of age, and the lift, while
wide, is mechanical.

## .where

- `src/domain.operations/route/guard/review/runStoneGuardReviews.ts`
- `src/domain.operations/review/runOneReview.ts`

## .the verdict, once ruled

> _unruled._
