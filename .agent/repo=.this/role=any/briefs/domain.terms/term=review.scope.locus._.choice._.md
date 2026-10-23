# domain.term: locus

term.chosen   = locus
term.kind     = noun
term.boundary = review.scope   # where, in the repo, a review's target mass came from
term.synonyms.forbidden:
- origin
- source   # a run's `source` is already declared: `compiled` | `parsed`
- breakdown   # already the by-input `observe` census's word; it names the division, never the place
- hotspot

## .what

the locus of a review is the address of its target mass — each target path, and the chars it
sent, rolled up into directories with a share per row and the remainder named.

it answers *"where did this prompt's size come from?"*, the one question a composition by named
input cannot: `targetFiles` names the KIND of mass, the locus names the PLACE. only a place can be
pruned.

three states, each kept as itself:

| state | means |
|---|---|
| a list of `{ path, chars }` | measured |
| `[]` | measured, and empty — a fact |
| `null` | unread — the run predates the row, and that is no claim it placed none |

## .refs

- `src/domain.operations/review/meter/asTargetLocusLines.ts`     # `asTargetLocusLines` — the one locus render, at every breadth
- `src/domain.operations/review/meter/getOneTargetLocusRollup.ts`    # `getOneTargetLocusRollup` — paths into directory rows
- `src/domain.operations/review/meter/asTargetLocusEntries.ts`   # `asTargetLocusEntries`
- `src/domain.operations/review/meter/asCompiledLocus.ts`        # `asCompiledLocus` — the three states, read off disk
- `src/domain.operations/review/getOnePromptInputsCensus.ts`         # the tree and grove fold
- `.agent/repo=.this/role=any/briefs/rule.require.report-both-cost-levers-with-trend-and-locus.md`
- `.agent/repo=.this/role=any/briefs/rule.forbid.adhoc-scope-rollups.md`

## .reason

- `term=review.scope.locus._.choice.reason.md`
