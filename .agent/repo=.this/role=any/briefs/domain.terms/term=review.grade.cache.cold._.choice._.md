# domain.term: cold

term.chosen   = cold
term.kind     = adj
term.boundary = review.grade.cache   # a position of the cache family of `grade`
term.synonyms.forbidden:
- empty
- fresh
- first

## .what

a bucket of runs is **cold** when every one of its metered runs was its reviewer's first — so no
cache existed for any of them to hit. its pair is `warm`.

a `cold` grade makes a zero cache rate a **fact**, never a defect: there was naught to serve.

## .a fact nil, never an absence nil

`cold` is measured. a bucket with no metered run is graded `null`, never `cold` — it has no
rate to qualify. to read an absent measure as `cold` would turn "we do not know" into "it served
naught", the exact conflation the `grade` genus exists to refuse (`term=review.grade`).

## .refs

- `src/domain.operations/review/meter/getOneCacheGrade.ts`    # `CacheGrade`, `getOneCacheGrade`
- `src/domain.operations/review/meter/genReviewMeterReport.ts` # the grade beside each rate

## .reason

- `term=review.grade.cache.cold._.choice.reason.md`
