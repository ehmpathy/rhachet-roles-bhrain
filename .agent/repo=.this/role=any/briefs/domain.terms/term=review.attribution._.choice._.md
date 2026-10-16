# domain.term: attribution

term.chosen   = attribution
term.kind     = noun
term.boundary = review        # which named input of a review prompt each char belongs to
term.synonyms.forbidden:
- breakdown    # already an `observe` surface word; one word over two intents (`review.trace`)
- allocation   # implies a budget handed out, never a measurement read back
- provenance   # where a file came from, never which input slot it filled

## .what

**attribution** assigns every char of a review prompt to exactly one named input, so a cost can
be said to have been bought BY an input. it is the second desire of the review-cost wish:
measure, then **attribute**, then cheapen.

it is also the name of one grade family (`review.grade`): `attributed` · `unattributed` says
whether a run's prompt could be split into its inputs at all. each position has its own cluster:
`term=review.grade.attribution.attributed`, `.unattributed`.

## .refs

- `src/domain.operations/review/getOneAttributionGrade.ts`
- `src/domain.operations/review/asAttributionGrade.ts`
- `term=review.grade._.choice._.md` — the `attribution` family
- `term=prompt.composition._.choice._.md` — the split attribution reads

## .reason

- `term=review.attribution._.choice.reason.md`
