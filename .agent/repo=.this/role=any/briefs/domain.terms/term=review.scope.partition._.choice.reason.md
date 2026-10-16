# domain.term.choice.reason: partition

## .etymology

a set partition divides a set into subsets whose union is the whole. the union half holds here
exactly: a target no partition claims refuses the split, so none is dropped. the disjoint half
holds for GRADES, not for reads — a common file is read in each partition that claims it and
graded in one, so no concern is counted twice.

rejected:
- **shard** — a storage word; it implies a key-hashed distribution the author does not declare
- **chunk** — implies a size cut. a partition is cut by subtree, never by byte count
- **bin** — implies an automatic pack to fit. a partition is declared by an author or a caller

not rejected — a different part of speech:
- **split** — the word for the act, and for the act's whole result (`ReviewPartitionSplit`: every
  partition plus the rest). one subset it yields is the noun `partition`, so the two never compete
  for one slot, and `split` sits on no forbid list

## .disputes

### dispute: isolatable — raised 2026-10-04 — status: RESOLVED (keep `partitionable`)
- raised.by  = a draft that shipped both `--partitionable` and `--partition-isolatable`
- claim      = an author declares which subtrees may split; a caller isolates one more at the call
               site. two parties, two flags
- counter    = both declare the same fact — a subtree that may run alone. who typed it is not a
               property of the subset. one repeatable flag serves both
- resolution = one flag, `--partitionable`, repeatable. `isolatable` is a forbidden synonym

### dispute: partitionable — raised 2026-10-05 — status: RESOLVED (`--partition '<slug>=<globs>'`)
- raised.by  = the verification stone, where every lane split along layers it was handed
- claim      = a subtree a reviewer may judge alone is a fact the tool can carry as an adjective:
               a review is `partitionable` along the subtrees it names, first match wins
- counter    = only the caller knows what a file needs beside it to be judged. a first-match
               subtree cut parts a test from its subject, and a disjoint set has no room for
               the overlap a module and its types share. the declaration must name each
               partition whole, with its overlaps, and the tool sorts common from narrow
- resolution = `--partition '<slug>=<globs>'` on a review; `route.guard.partition` once per
               route. the adjective `partitionable` and the `(rest)` partition retire with the
               flag. the noun `partition` holds

## .boundary

`partition` already appears as plain english in `term=route.guard.level.pour` (the cached or
exhausted part of a level's reviewers). the boundary `review.scope` keeps the two senses apart:
this term subsets one review's targets; that prose groups a level's reviewers.

## .evidence

- the scenario that coined it: a verification stone where 8 of 9 reviewers overflowed on a branch
  whose `review/` subtree was mostly new files. a narrower bind would hide that work; a partition
  keeps it in view, one subset per call
- invariant: the partitions of one review cover the review's targets, and each target is graded
  in exactly one of them
