# domain.term: target

term.chosen   = target
term.kind     = noun
term.boundary = review.scope     # one file in the bucket a review judges
term.synonyms.forbidden:
- subject      # the subject of a review is its whole target set, never one file
- candidate
- input        # `input` names a prompt block (`targetFiles`, `targetDiffs`), a different grain

## .what

a **target** is one file a review judges — a member of the scope's `targetFiles` bucket, beside
the rubric (`ruleFiles`) and the context (`refFiles`). a concern may only be raised against a
target; a rule or a ref is read, never graded.

a target travels through the prompt as one or both of two named inputs: its body
(`targetFiles`) and its diff (`targetDiffs`). the target is the file; the input is how its bytes
are sent.

## .refs

where the term composes declared operations:
- src/domain.operations/review/getAllTargetsScoped.ts                # the flags, into targets
- src/domain.operations/review/getAllTargetsJoined.ts                # the `--join` of diffs and paths
- src/domain.operations/isTargetPolluter.ts                          # the one shared polluter decision
- src/domain.operations/review/getAllTargetsAskedForByName.ts        # the by-name exemption
- src/domain.operations/review/getAllTargetsByCacheStability.ts      # the order that keeps a tail stable
- src/domain.operations/review/isTargetDiffSent.ts                   # which input carries it
- src/domain.operations/review/meter/getOneTargetLocusRollup.ts          # where its chars came from
- src/domain.operations/review/partition/getAllTargetsByPartition.ts # its partition, or `common`

## .reason

- `term=review.scope.target._.choice.reason.md`
