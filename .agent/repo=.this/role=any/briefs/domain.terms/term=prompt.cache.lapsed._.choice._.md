# domain.term: lapsed

term.chosen   = lapsed
term.kind     = adj
term.boundary = prompt.cache   # a prefix's age passed the cache reach
term.synonyms.forbidden:
- expired       # canonical elsewhere: a prime meet whose lane deadline left it no time
- stale         # names content that changed, never an age
- evicted       # names the provider's act, which no reader can observe (`prompt.cache.eviction`)
- timed-out     # names a wait bound, never the cache reach

## .what

**lapsed** = a prefix the cache could have served, whose age at the next send passed the
cache reach (`MINUTES_OF_CACHE_REACH`). a zero cache read on a lapsed pair is the clock, never
the layout.

two surfaces read it, in one sense:

- the meter's `cold (lapsed Nm)` grade on a lane bucket (`getOneCacheGrade`)
- the `lapsed` verdict of a round pair: a zero read on a pair whose round began past the
  reach of its prior (`getOnePrefixVerdict`)

## .not this sense

a prime meet whose lane deadline left it no time to meet is **`expired`**, a
`ReviewPrefixPrimeOutcome`. the meet's clock is the lane's deadline; the cache's clock is the
reach. two clocks, two words.

## .refs

- `src/domain.operations/review/MINUTES_OF_CACHE_REACH.ts`
- `src/domain.operations/review/meter/getOnePrefixVerdict.ts`
- `src/domain.operations/review/meter/getOneCacheGrade.ts`
- `src/domain.operations/review/prime/ReviewPrefixPrimeOutcome.ts` (the `expired` peer)

## .reason

- `term=prompt.cache.lapsed._.choice.reason.md`
