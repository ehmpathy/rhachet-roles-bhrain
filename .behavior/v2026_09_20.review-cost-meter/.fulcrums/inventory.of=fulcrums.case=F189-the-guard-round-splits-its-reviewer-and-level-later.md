# F189 — the guard round splits its reviewer and its level later

- raised 2026-10-09, from i029 r030 nitpick.1: `runStoneGuardReviews.ts` held two exported
  operations, and `runStoneGuardReviews` itself ran ~630 lines with `runOneBounded` and the
  per-level work as inline closures (`rule.require.single-responsibility`)
- rework: 🔴 **dirty** — the two closures read about a dozen round-scoped locals (meters by slug,
  the emit and progress sinks, the slot index, the cached-pass set, the exhaust set, the bottleneck
  per group); each extraction threads all of them through a new input shape, under a 152-case
  integration suite that pins the round's stdout
- status: 🟡 **BEST-GUESSED — half repaired this round; the inner split is deferred**
- confidence: **75%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — split all three now** | the round reads as a short story; each piece tests alone |
| **B — move the second operation now, defer the inner split** | the cheap, clean half lands; the half that rethreads a dozen locals waits for a round that touches it |

## .taken, and why

**B.** this round moved `runOneStoneGuardReview` and its five private operations into
`runOneStoneGuardReview.ts`, so the file now exports one operation, and extracted the inline
budget rule to `isReviewRoundCompleted` with its own caselist. what remains is two closures whose
whole job is to share the round's state. to lift them is to name that state as a domain object
(a round context) first — a design move, not a file move — and no reviewer has asked for the
object.

## .rework, and why

**dirty.** the closures' captured locals become an explicit input on each call; the round's
stdout order, the declared-order write-back, and the bounded pour all pass through them. it is a
refactor of the round's core, guarded only by snapshots, on a branch already wide.

## .confidence, and why it is not higher

- the split the reviewer proposed (one operation per level, one per bounded reviewer) is sound,
  and a round context object may prove small once drawn
- the clean/dirty call rests on a count of captured locals, and a count goes stale as the code
  moves; re-count before anyone acts on it

## .where

`src/domain.operations/route/guard/review/runStoneGuardReviews.ts` (`runOneBounded`, the level loop)
· `runOneStoneGuardReview.ts` · `isReviewRoundCompleted.ts`

## .verdict

(open)
