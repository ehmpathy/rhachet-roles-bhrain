# domain.term: hit rate

term.chosen   = hit rate
term.kind     = noun            # a measured share, never an act
term.boundary = prompt.cache
term.synonyms.forbidden:
- cache ratio
- cache efficiency
- reuse rate
- cached share

## .what

the **hit rate** is the share of a prompt's tokens that the provider served from its cache:
`cacheGet / prompt tokens`. it is a fact about what the PROVIDER did, measured after the fact
from the billed tokens — never a claim about what the caller sent or intended.

a bucket that sent no prompt token has no hit rate: the value is `null`, rendered absent,
never `0.0%`. a `0.0%` states that a cache served none of a prompt that was sent.

⚠️ `hit` is not banned outright. it is forbidden in ONE sense only — as a name for the caller's
act, which is a `touch` (`term=prompt.cache.touch`, whose forbid list carries that same
qualifier). as the provider's outcome, inside `hit rate`, it is the canonical word. the rate
counts what was served; a touch is what was sent.

## .refs

- `src/domain.operations/review/getOneCacheHitRate.ts`          # the one formula
- `src/domain.operations/review/meter/genReviewMeterReport.ts`  # `cacheHitRate`, tree breadth
- `src/domain.operations/review/grove/genReviewGroveReport.ts`  # `rateOfCacheHit`, grove breadth
- `src/domain.operations/review/meter/genReviewRunStdout.ts`    # run breadth

## .reason

- `term=prompt.cache.hit-rate._.choice.reason.md`
