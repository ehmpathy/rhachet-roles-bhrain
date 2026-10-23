# F192 — a lane reads its latest two generations of dialogue

- **rework**: clean — one constant, `DEPTH_OF_LANE_CONVERSATION`, in
  `src/domain.operations/route/guard/review/peer/getAllRouteGuardReviewPeerConversationFiles.ts`
- **status**: best-guessed 2026-10-09
- **confidence**: 80%

## .the fork

| option | what a lane's `$conversation` holds |
|---|---|
| unbounded (prior) | every given, report, and taken the lane ever had |
| **latest two generations** (taken) | the last exchange, plus the one before it |
| latest one generation | the last exchange alone |

## .taken, and why at the time

measured at i032, lane r011 (`behavior-intent-coverage`): `tokens.expected.md` puts `.behavior/**/.reviews/`
at **120.4k tokens, 21.8% of a 551.8k prompt** — the lane's own dialogue, 171 files. the same round
re-raised three "the snapshot is absent" blockers for the third time, each one cites a stale prior
[REPAIR] claim, against a target where all three `toMatchSnapshot` lines are present
(`review.by.acceptance.test.ts:326`, `:1162`; `review.by.learner.acceptance.test.ts:428`).

- the latest given carries every point still open; the latest taken carries the current answer to
  each. so every older round is settled or restated in those two files
- one generation back stays, so a reviewer can still see that a point it raises is a re-raise
- the unscoped read (no slug) keeps every round — its callers want the whole record

## .why the confidence is not higher

- depth 1 may suffice and cost less; depth 3 may catch a re-raise cycle that skips a round. no
  measurement separates them yet
- the stale-claim misread may persist even at depth 2, since the latest given restates it

## .clamp

`getAllRouteGuardReviewPeerConversationFiles.integration.test.ts` `[case10][t0]`: four rounds, the
current excluded, the lane reads i002 and i003 only. red at depth 99, green at depth 2.
