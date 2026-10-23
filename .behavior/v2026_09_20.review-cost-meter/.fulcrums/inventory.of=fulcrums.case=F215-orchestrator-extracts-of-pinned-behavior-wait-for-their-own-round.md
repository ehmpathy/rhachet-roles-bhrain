# F215 — orchestrator extracts of pinned behavior wait for their own round

## .the fork

i041 r030 (`enroll-impl-arch-defects`) asked three extracts of code whose behavior its suites
already pin. each was graded `[nitpick][better]`, and for each the reviewer wrote that it could
name no harm:

1. **nitpick.1** — the per-lane skip ladder in `runStoneGuardReviews.ts` (held-clean,
   held-disputed, held-exhausted, reused, pour) as a pure `asPeerReviewLaneDisposition`
   transformer with a caselist test
2. **nitpick.3** — `routeGuardPartition` in `route.ts` lifted to a domain
   `stepRouteGuardPartition`, with its six flag cross-checks folded into one pure refusal
3. **nitpick.5** — the inline argument refusals of `review()` in `review.ts` folded into one
   `getAllReviewArgsRefusals`, and the plan-without-split rule kept in one home

## .taken

dispute all three. repair, in the same round, every other point the i041 lanes raised that was
safe and clean: the overflow lever line, the token and cost folds, the metered-run filter, the
mtime communicator, the route path convention, and the two partition rule transformers.

## .rework — dirty, all three

each is a move of a decision table that sits on a gate:

- (1) the skip ladder decides whether a lane pours, is held, or reuses a cached verdict — the
  order is critical (`runStoneGuardReviews.ts` warns that a fold "would silently move
  nitpick-only behavior"), and a reorder there either spends budget a held lane did not owe
  or holds a lane that should run
- (2) the partition command's refusals and its three modes are pinned by spawned-CLI acceptance
  cases; a `step*` lift moves every one of them and their snapshots
- (3) the `review()` refusals gate every `rhx review` invocation, and an SDK caller of
  `stepReview` reaches a different subset today by design of where each check lives; to fold
  them changes which guards that caller meets

each is decomposition for recomposition, with suites green on the current shape. to ride it
under a nitpick would put a refactor of three gates into a round whose review cannot converge
anyway (F212), so each would be re-sampled before it was ever judged whole.

## .confidence — 75%, and why it is not higher

the reviewer named no harm and the suites pin the behavior. the 25% is that (1) is a real
readability debt in the file that most often changes, and every round it stays inline is one
more round a reader must simulate the ladder.

## .where

- `src/domain.operations/route/guard/review/runStoneGuardReviews.ts` — the skip ladder
- `src/contract/cli/route.ts` — `routeGuardPartition`
- `src/contract/cli/review.ts` — `review()` refusals
- dream: `.dream/v2026_10_10.refactor.extract-the-gate-decision-tables.md`

## .verdict

open — for the council.
