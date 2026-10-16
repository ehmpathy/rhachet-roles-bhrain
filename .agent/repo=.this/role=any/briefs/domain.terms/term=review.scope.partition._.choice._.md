# domain.term: partition

term.chosen   = partition
term.kind     = noun
term.boundary = review.scope     # a declared subset of ONE review's targets
term.synonyms.forbidden:
- shard
- chunk
- bin
- isolatable     # the draft second flag, struck: one concept, one flag

## .what

a **partition** is a caller-declared subset of a review's target files that a reviewer can judge
on its own. when the whole review overflows the context window, each partition runs as its own
call, and the calls merge into one tally.

```ts
interface ReviewPartitionDeclared {
  slug: string;                    // names its log dir, report section, refusal row
  globs: string[];                 // the declaration, verbatim
  members: ReviewPartitionMember[];// each glob, cast to a prefix or a glob matcher
}
```

partitions may overlap, and should. the split is computed, never declared:

- **common** — a file two or more partitions claim. graded once, by the first that lists it, and
  read as context in the rest
- **narrow** — a file exactly one partition claims. graded there only

a partition subsets the TARGETS only — never the rubric, never the refs. the bound route spec is
the one overlap a partition may not omit. a target no partition claims refuses the split.

two more words live inside this cluster. a word that serves only this contract gets no cluster of
its own until another contract reads it:

- **claim** — to add a path or glob to one declared partition (`route.guard.partition --claim <glob>
  --into <slug>`). a claim grows the set. it never reads as a second declaration
- **prime** — the one poke that writes the common prefix to the cache before the partitions pour.
  it is a `prompt.cache.poke` (`term=prompt.cache.poke`), named `(prime)` where a partition row
  would sit (`NAME_OF_PARTITION_PRIME`). a prime grades naught
- **peer partition** — another partition of the same split. always the two words: a bare `peer`
  names a reviewer (`term=route.guard.review.peer`). each partition prompt names its peer
  partitions and their globs after `</target>` (`getAllPartitionPeersOf`), so a file another
  partition grades is never read as absent from the branch

## .refs

- src/contract/cli/review.ts                                                  # `--partition '<slug>=<globs>'`
- src/contract/cli/route.ts                                                   # `route.guard.partition`
- src/domain.operations/review/partition/asReviewPartitionsFromFlags.ts       # the declaration
- src/domain.operations/review/partition/getAllTargetsByPartition.ts          # common vs narrow
- src/domain.operations/review/partition/getAllTargetsOfPartition.ts          # one partition's order: common first
- src/domain.operations/review/partition/stepReviewByPartitions.ts            # the split and the merge
- src/domain.operations/route/guard/partition/setRouteGuardPartitions.ts      # the route-level set
- src/domain.operations/route/guard/partition/getOneRouteGuardPartitions.ts   # the route-level get
- src/domain.operations/route/guard/partition/getOneRouteGuardPartitionsCheck.ts # the declared-vs-live check
- src/domain.operations/route/guard/partition/asRouteGuardPartitionScope.ts   # `RouteGuardPartitionScope`: one peer, or `@all`
- src/domain.operations/route/guard/partition/getAllPartitionFlagsOfScope.ts  # the scope cast to `--partition` flags
- src/domain.operations/route/guard/partition/getAllPartitionFlagsOfReviewRun.ts # the flags one guard run carries
- src/domain.operations/route/guard/partition/asRouteGuardPartitionTreeLines.ts  # the render family (`…ClearLines`, `…DeclaredLines`, `…HeadLines`)

⇒ one word serves both grains: the review-level `--partition` flag and the route-level
`route.guard.partition` set that writes it into a guard. the boundary stays `review.scope` — the
route ops declare a partition OF a review's targets, never a second concept.

## .reason

- `term=review.scope.partition._.choice.reason.md` — why this word, the synonym struck, and the
  move from disjoint subtrees to declared overlaps
