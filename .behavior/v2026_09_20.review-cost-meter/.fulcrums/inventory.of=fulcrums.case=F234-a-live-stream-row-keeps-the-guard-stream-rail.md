# F234 — a live stream row keeps the guard stream rail

- raised 2026-10-12, by `ergo-snapshot-visual-blemishes` (blocker.4), at 5.3 i003
- rework: **clean** — one `isLast` flag per live streamer, and a resnap
- status: 🟡 **BEST-GUESSED — disputed**
- confidence: **75%**

## .the fork, stated fairly

the review.by live stream renders each rubric row with `├─` and never closes the tree with `└─`.

| option | the claim |
|---|---|
| **A — keep `├─` per live row** | `genReviewByRubricStreamer.ts:81` passes `isLast: false`, as the guard peer stream does at `genContextCliEmit.ts:266,341`. a live row is released before the stream knows whether more rows follow, so no row can claim the tail. the settled `review.by` tree, printed once all rubrics end, closes with `└─` |
| **B — close the last live row** | the stream would buffer its final row until every rubric ends, or reprint it, so the last row reads `└─` |

## .taken, and why

**A.** `isLast: false` is main-born in `genReviewByRubricStreamer.ts`, not a branch blemish. the branch
moved both live renders onto one wave buffer and one tail line, so they read glyph for glyph alike. to
close only review.by's stream would part the two renders the branch unified, and a buffered last row
delays the one row the human waits on.

## .rework, and why

**clean.** where a later round teaches the wave buffer which slot releases last, both streamers take
the flag in one edit and one resnap.

## .confidence, and why it is not higher

a strict reader holds that every tree must close, live or settled.

## .where

`src/domain.operations/review.by/genReviewByRubricStreamer.ts:81` ·
`src/domain.operations/route/guard/genContextCliEmit.ts:266,341`

## .verdict

— (awaits the council)
