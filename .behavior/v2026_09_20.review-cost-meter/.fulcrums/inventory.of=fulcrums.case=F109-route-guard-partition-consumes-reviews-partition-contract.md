# F109 — route.guard.partition consumes review's partition contract

## .the fork

`route.guard.partition` (new this branch, in `route/guard/partition/`) imports four things from
`review/`. a peer (`arch-smell-scopeleaks`, 5.1 i001) graded the edge a scope leak.

two of the four are generic leaves — `asCountedNoun`, `asPathAbsoluteFromCwd`. two are the
review partition contract — `asReviewPartitionsFromFlags` (parse), `getAllTargetsByPartition`
(split), `asReviewPartitionRefusal` (refuse), and the `ReviewPartitionSplit` type.

- (a) lift the leaves to `src/utils/`; keep the partition edge as a consumer edge
- (b) lift `review/partition/` to a shared root as well
- (c) move the check into `review/partition/` and call one op from the route

## .taken — (a), and why at the time

- the leaves carry no domain knowledge, so `utils/` is their home (`rule.require.directional-deps`:
  cross-layer, depends on none). both were new this branch, so the lift moved 30 imports and no
  behavior. done
- a partition is review's own concept (`term=review.scope.partition`): a set of targets one
  review lane is graded on. `route.guard.partition` exists to declare those sets for the review
  lanes a guard runs, and it must refuse exactly what `rhx review` refuses, or a set declared
  clean would fault at review time. so it must speak review's grammar, not a copy of it
- route → review is the consumer direction the guard is built on: the guard runs review lanes
  (`runStoneGuardReviews` → `runOneReview`, on main; F97). this edge is one more consumer read,
  never an upward one. F47 closed the one upward edge (review → route)
- (b) puts review's own concept outside review, which names it worse
- (c) still crosses the same line, with one more op beside it

## .rework — clean

if the council wants a declared surface, it is one file: a `review/partition/index`-free
contract module both callers import, or (c). no behavior moves.

## .confidence — 75%

a council may read `review/partition/` as private, and want (c). that is a clean move.

## .where

`src/domain.operations/route/guard/partition/getOneRouteGuardPartitionsCheck.ts` ·
`asRouteGuardPartitionTreeLines.ts` · `src/utils/asCountedNoun.ts` ·
`src/utils/asPathAbsoluteFromCwd.ts`

## .verdict

— (awaits the council)

## .settled in code, 2026-10-06

`src/domain.operations/review/partition/.readme.md` now declares the partition contract owned by `review/` and read by `route/guard/partition` as a consumer. rework stays clean: delete the readme and lift the contract.