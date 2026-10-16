# domain.term: warm

term.chosen   = warm
term.kind     = adj
term.boundary = review.grade.cache   # a position of the cache family of `grade`
term.synonyms.forbidden:
- hot
- primed
- seen

## .what

a bucket of runs is **warm** when at least one of its metered runs was NOT its reviewer's first —
so a cache existed for it to hit. its pair is `cold`.

a `warm` grade makes a low cache rate a **defect worth a reader's attention**: a prefix
repeated, a cache could have served it, and the request did not reach it.

## .the conservative position

`warm` is the default whenever the evidence is mixed. one repeat in a bucket is enough, and a
run whose reviewer ordinal is unknown counts as a repeat. an unplaced run must never buy a zero an
excuse, so `cold` must be earned by every run in the bucket.

## .scope — one sense of a word with others

this cluster names the cache-grade position alone. the same word names a peer's retained
context in `src/domain.operations/telepath/` (`isReaderMemoryWarm`); that sense has no
declared boundary yet, and stays a gap (`inventory.of=gaps._.md`). plain-english tone — "a warm
frame" — is generic english and owes no cluster.

## .refs

- `src/domain.operations/review/meter/getOneCacheGrade.ts`    # `CacheGrade`, `getOneCacheGrade`
- `src/domain.operations/review/meter/genReviewMeterReport.ts` # the grade beside each rate

## .reason

- `term=review.grade.cache.warm._.choice.reason.md`
