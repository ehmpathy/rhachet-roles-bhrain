# domain.term: eviction

term.chosen   = eviction
term.kind     = noun
term.boundary = prompt.cache    # the provider drops a held prefix from one replica's cache
term.synonyms.forbidden:
- expiry      # names a fixed deadline. the question eviction answers is WHICH clock drops a prefix
- purge       # names a deliberate wipe by the owner. the provider evicts on its own policy
- miss        # the CONSEQUENCE a later request meets, never the act that caused it

## .what

an **eviction** is the provider's drop of a held prefix from a replica's cache. after it, a
request whose bytes repeat that prefix is billed at the full input rate again.

what matters is the **policy** that picks which prefix to drop. two candidates part every
keep-alive argument:

| policy | the clock it runs on | what a `touch` buys |
|---|---|---|
| `lru` | time since the last READ | residency. a poke resets the clock |
| `fifo-by-insert` | time since the first WRITE | naught. no read can extend it |

⇒ a keep-warm poke is worth money under `lru` and exactly zero under `fifo-by-insert`. so the
policy is measured, never assumed: a poked arm beside a control arm, per provider.

## .refs

- `src/domain.operations/review/MINUTES_OF_CACHE_REACH.ts`        # the decay a touch races against
- `.agent/repo=.this/role=any/briefs/research.review-cost-and-cache.md`  # the measured `lru` premise

## .reason

- `term=prompt.cache.eviction._.choice.reason.md`
