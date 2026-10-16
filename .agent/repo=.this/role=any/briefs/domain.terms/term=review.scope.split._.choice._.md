# domain.term: split

term.chosen   = split
term.kind     = noun            # also the verb for the act; the noun is the act's whole result
term.boundary = review.scope    # a division of ONE review's targets into named parts
term.synonyms.forbidden:
- breakdown     # forbidden already under `locus`; a split names its parts, a breakdown names naught
- division

## .what

a **split** divides a review's targets into named parts along one axis, and keeps every target in
some part — a target the axis cannot place is named, never dropped. the axis rides in the name
beside the word:

| the split | the axis | its parts |
|---|---|---|
| `ReviewPartitionSplit` | the declared partitions | each partition, plus `common` and `unclaimed` |
| `TargetSplitOfRun` | the named input that sends each target | `targetFiles` and the `targetDiffs` kinds, plus `targetsGone` |

the split is the result; a **partition** is one part of a partition split. the two words never
compete for one slot.

## .refs

- src/domain.operations/review/partition/getAllTargetsByPartition.ts   # `ReviewPartitionSplit`
- src/domain.operations/review/meter/getOneTargetSplitOfRun.ts          # `TargetSplitOfRun`
- src/domain.operations/review/partition/asReviewPartitionPlanLines.ts  # renders a partition split
- src/domain.operations/route/guard/partition/getOneRouteGuardPartitionsCheck.ts

## .reason

- `term=review.scope.split._.choice.reason.md`
