# domain.term: cache

term.chosen   = cache
term.kind     = noun
term.boundary = prompt          # the provider's store of a prompt's head, per replica
term.synonyms.forbidden:
- memo
- buffer
- store

## .what

the **cache** is the provider-side store that holds the head of a recent prompt on one
replica, so a later request whose bytes repeat that head is billed at the cheap read rate
rather than the full input rate.

it is the root of the `prompt.cache.*` family. each member names one part of how a review
earns, keeps, or loses that cheap rate:

| member | what it names |
|---|---|
| `prompt.cache.seam` | the line a prompt DECLARES between inputs a cache could serve and inputs it re-pays each round |
| `prompt.cache.shared-prefix` | the run of bytes two requests share from token 0 — the only part a cache can serve |
| `prompt.cache.stability` | how likely a block is to stay identical next round — what sets the order of the prompt |
| `prompt.cache.touch` | any act that refreshes the prefix's residency |
| `prompt.cache.hit-rate` | the share of a prompt's tokens the provider served from it — `null` where no prompt was sent |
| `prompt.cache.eviction` | the provider's drop of a held prefix — and the policy (`lru` or `fifo-by-insert`) that decides whether a touch can postpone it |
| `prompt.cache.poke` | the one-token send a prime makes to write the shared prefix before a pour |

the share a provider served from it is the **hit rate** (`term=prompt.cache.hit-rate`) — a fact about
what the PROVIDER did, which is why `hit` stays forbidden as a name for the caller's `touch`.

and the meter grades a bucket's opportunity against it: `warm` or `cold`
(`term=review.grade.cache.warm`, `.cold`).

## .three facts every member inherits

- it lives on a **replica**, never in a shared store. a request steered to another replica
  meets a cold cache however perfect its prefix (`rule.require.name-the-shared-prefix-as-the-cache-anchor`)
- it serves a **prefix**, never a span from the middle. the first changed byte ends what it can serve
- it **decays**. past the cache reach (`MINUTES_OF_CACHE_REACH`) since the last touch, no read
  hits

## .refs

- `src/domain.operations/review/getOneCacheHitRate.ts`         # the share served from it
- `src/domain.operations/review/meter/getOneCacheGrade.ts`     # `warm` / `cold`
- `src/domain.operations/review/MINUTES_OF_CACHE_REACH.ts`     # the decay

## .reason

- `term=prompt.cache._.choice.reason.md`
