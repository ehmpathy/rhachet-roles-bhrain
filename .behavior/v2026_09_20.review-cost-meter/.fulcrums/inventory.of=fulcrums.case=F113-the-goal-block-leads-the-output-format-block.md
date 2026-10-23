# F113 — the per-goal block leads the universal output-format block in the head

- raised 2026-10-06, by `repo-rules-review-ops` (nitpick.2), at 5.1 i006
- rework: **clean** — one swap in `asPromptHeadStatic`, plus a re-cut of two census rows
- status: 🟡 **BEST-GUESSED — keep the order; dispute the nitpick**
- confidence: **70%**

## .the fork, stated fairly

the static head renders `${goalInstructions}` then `## output format`. the goal block differs
between `exhaustive` and `representative`; the output-format block is identical for every review.

| option | the claim |
|---|---|
| **A — goal first (as shipped)** | the head reads instructions → format → rubric, and the census cuts `instructions` as token 0 to `MARKER_OF_OUTPUT_FORMAT` |
| **B — output format first** | by `rule.require.order-prompt-sections-by-volatility-then-size`, the more stable block leads, so two lanes of DIFFERENT goals share ~1.7k more prefix chars |

## .taken, and why

**A.** the volatility rule ranks blocks by what changes ROUND OVER ROUND, and the cache that pays
is the one a lane re-hits on its own next round. a lane's goal is fixed by its guard, so within a
lane the goal block is as stable as the output-format block — the two tie on the axis that buys
cache. B's gain lands only BETWEEN lanes of different goals, and the replica pin keys on the
system prompt (`rule.require.name-the-shared-prefix-as-the-cache-anchor`), so two such lanes
rarely meet the same replica at all. the swap would also re-cut the `instructions` and
`outputFormat` census rows, whose span this branch measures and reports.

## .rework, and why

**clean.** one template swap in `asPromptHeadStatic.ts`, a marker-offset re-cut in
`getOnePromptComposition`, and a snapshot resnap. no caller contract moves.

## .confidence, and why it is not higher

no two-state measurement backs the claim that cross-goal lanes rarely share a replica; that is
argued from the pin key, never measured.

## .where

`src/domain.operations/review/asPromptHeadStatic.ts` · `src/domain.operations/review/getOnePromptComposition.ts`

## .verdict

— (awaits the council)

- 2026-10-07 — re-raised at i017 (`c0dcbd0db9103760c0`) by `r015.repo-rules-review-ops`
  nitpick.1, on the breadth rule (`rule.require.order-prompt-bytes-by-reuse-breadth`) rather
  than the volatility rule. the lane grants the break-even note and asks for a break-even "over
  a full-speed read, not the pin argument alone". the head's `.note` already states the unpinned
  case: at most ~1.7k × (1 − 1/31) ≈ 1.6k chars per cross-goal pair, the gain on a brain with no
  pin at all. the breadth rule's own unit is "requests this round that carry these exact bytes";
  lanes of one stone almost always share one goal, so for them the two blocks tie on breadth too.
  the residual is the cross-goal pair, which is the fork this fulcrum states. still disputed, for
  the council.
