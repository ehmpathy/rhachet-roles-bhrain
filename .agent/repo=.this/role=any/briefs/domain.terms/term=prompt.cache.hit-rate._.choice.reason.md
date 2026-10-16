# domain.term.choice.reason: hit rate

## .etymology

`hit rate` is the provider's and the industry's own word for the share of requests or tokens a
cache served — the term a reader of any cache report already holds. the operation that computes
it, `getOneCacheHitRate`, was named with it before the term had a cluster; this cluster gives
the word the address the `touch` forbid row defers to.

rejected:

| word | why not |
|---|---|
| `cache ratio` | names no numerator — a ratio of what to what? |
| `cache efficiency` | a judgment, not a measurement. a low rate on a one-shot prompt is not inefficient |
| `reuse rate` | names the caller's intent to reuse, where the figure measures what the provider served |
| `cached share` | reads as the share the caller marked cacheable — a declared seam, not a served share |

## .the boundary — why `prompt.cache`, and why `hit` alone stays forbidden

*"hit rate, of WHAT?"* → of the prompt cache. one word answers it, so the boundary is
`prompt.cache`, a member beside `touch`, `poke`, and `eviction`.

the bare `hit` was argued as a name for the caller's act and refused (`term=prompt.cache.touch`):
a caller sends bytes and cannot know whether they were served. the rate is the provider's
answer, read from the bill. two concepts, two words — `touch` for what was sent, `hit rate`
for what was served.

## .evidence

- the headline figure of the wish — a 2.8% grove-wide rate — is this quantity, and every
  surface on the `--of` axis prints it
- before `getOneCacheHitRate` folded it, the tree and grove reports each computed it inline,
  with guards of opposite polarity; one formula now serves run, tree, and grove alike
- the null law: a zero denominator yields `null`, never `0` — `getOneCacheHitRate.test.ts`
  pins it, since a `0.0%` there would state a measured fact where naught was sent
