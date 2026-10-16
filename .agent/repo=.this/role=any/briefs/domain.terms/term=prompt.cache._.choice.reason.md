# domain.term.choice.reason: cache

## .etymology

`cache` is the providers' own word — "prompt cache", "cache read", "cache write" are the line
items on the bill the meter reads (`cacheGet`, `cacheSet`). another name would force a
translation at the one seam where the repo meets the invoice.

rejected:

| rejected | why |
|---|---|
| `memo` | names a caller-side result store, keyed by input. the prompt cache is provider-side and keyed by byte prefix |
| `buffer` | names transient bytes in flight. a cache outlives the request that filled it |
| `store` | generic, and claimed by persistence. it says naught about the prefix rule or the decay |

## .why a root cluster

the `prompt.cache.*` clusters — enumerated in the root's member table rather than counted
here, so a new member cannot leave a stale figure behind — carry the segment `cache` in their
boundary, and before this root no cluster declared what `cache` itself was. a boundary segment that reaches no declared root is a gap
(`rule.require.boundary-qualified-terms`), so the root is itemized here and every member now
resolves to it.

## .disputes

none.
