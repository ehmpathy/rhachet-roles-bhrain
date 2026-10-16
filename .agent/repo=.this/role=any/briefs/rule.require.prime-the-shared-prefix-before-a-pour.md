# rule.require.prime-the-shared-prefix-before-a-pour

> **when N concurrent requests share a prefix, send ONE request that writes it to the cache,
> await it, then pour the rest. never fire all N cold.**

## .why

- a prompt cache entry exists only once a request that carried the prefix has been prefilled.
  N requests that land at the same instant each find no entry, so each pays the shared mass at
  the full input rate — the pour throws away the very reuse the prompt layout was built for
- the prime costs one prefill of wall time (seconds) and one output token. it saves
  (N−1) × the shared mass, read at the cache rate (~1/31 of full, `research.review-cost-and-cache`)
- it does NOT serialize the work: the prime is a poke, never one of the N reviews. after it, all
  N still pour (`rule.forbid.serial-reviews-that-could-pour`)

## .the shape

```
shared prefix  = system prompt + every block all N carry (key 1 of the reuse-breadth order)
prime          = one request with that prefix and max one output token, routed with the same
                 affinity key the N will use (`rule.require.name-the-shared-prefix-as-the-cache-anchor`)
pour           = Promise.allSettled over the N, after the prime settles
```

⇒ a failed prime is not a failed pour. the N still run; they merely miss the cache. a prime
fault is logged and the pour proceeds (`rule.forbid.dropped-partial-review-progress`).

## .the test

> **do N ≥ 2 requests about to fire concurrently share a prefix, and is it in cache?**

- yes, and it is not cached → prime it first
- N = 1, or no shared prefix → no prime; it would buy naught

| when… | then… |
|---|---|
| a lane splits into partitions | 🔴 prime the shared spec prefix, then pour the partitions |
| a level pours lanes that share a system prompt | prime it once per distinct system prompt |
| the prime would carry bytes only one request sends | trim it to the shared prefix — the rest is waste |
| the prime fails | log it and pour anyway. never block the N on a cache optimization |
| a prime uses a different affinity key than the N | it warmed a replica none of them will hit. use the same key |

blocker: a fan-out of N ≥ 2 requests that share a prefix, fired cold with no prime · a prime
whose failure blocks the pour.
nitpick: a prime that carries more than the shared prefix.

⇒ see also: `rule.require.order-prompt-bytes-by-reuse-breadth` (what the shared prefix IS) ·
`rule.forbid.serial-reviews-that-could-pour` (the pour) · `setOnePrefixPoke` (the poke act it
sends) · `term=prompt.cache.poke._.choice._.md`.
