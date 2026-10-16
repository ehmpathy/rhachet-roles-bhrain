# domain.term: refused

term.chosen   = refused
term.kind     = adj
term.boundary = review.grade.honesty   # a position of the honesty family of `grade`
term.synonyms.forbidden:
- skipped    # a `--optional rules` skip is a run that DID write its two numeric lines
- rejected   # the verdict word of a peer review that found blockers
- free

## .what

a run is **refused** when it carries no metrics, no compiled prompt, no compiled metrics, and no answer. it stopped
at validation — a bad glob, an empty scope, a context overflow — before the brain was called.
its spend is **known to be nil**, so it renders `$0` and counts as accounted.

it is the honesty family's **fact nil**: the one position where a zero is a measurement.

## .refs

- `src/domain.operations/review/meter/getOneReviewRunGrade.ts`  # the boolean that parts it from `unknown`
- `src/domain.operations/review/meter/getOneAccountedCost.ts`   # an all-refused set sums to `$0`
- `term=review.grade.honesty._.choice._.md` — the family

## .reason

- `term=review.grade.honesty.refused._.choice.reason.md`
