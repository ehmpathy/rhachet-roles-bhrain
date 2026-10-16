# domain.term: metered

term.chosen   = metered
term.kind     = adj
term.boundary = review.grade.honesty   # a position of the honesty family of `grade`
term.synonyms.forbidden:
- measured   # true of every figure a `metered` run carries, so it cannot also name the run
- priced     # a `refused` run is priced too — at a known `$0`
- recorded

## .what

a run is **metered** when its `metrics.realized.json` is on disk: every token and cost figure
it carries was read back from the brain's own reply, never estimated. it is the only honesty
position whose cost enters a sum as a measurement.

## .refs

- `src/domain.operations/review/meter/getOneReviewRunMeter.ts`  # `ReviewRunGrade`, and the read that sets it
- `term=review.grade.honesty._.choice._.md` — the family

## .reason

- `term=review.grade.honesty.metered._.choice.reason.md`
