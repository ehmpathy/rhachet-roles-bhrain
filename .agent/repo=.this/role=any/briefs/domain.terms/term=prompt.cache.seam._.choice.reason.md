# domain.term.choice.reason: seam

## .etymology

a seam is where two pieces are joined and can be parted along — the word carries both the
join and the line a cut would follow. that is the exact shape here: one prompt, sent as one
request, with a line inside it that the cache's economics part along. the word was already in
use across the meter (`getOneCharsByCacheSeam`, the `seam` field of every `--json` report, the
`state its seam` obligation) before it was itemized; this cluster records the usage, it does
not coin it.

## .rejected

| word | why not |
|---|---|
| `split` | names the act of a cut, not the line. "the split" reads as an operation a reader runs |
| `cut` / `cutoff` | `cutoff` implies a size or time limit — the window cap, the cache reach. a seam has no size |
| `boundary` | already this glossary's word for a term's scope (`term.boundary`). to use it here overloads it (`rule.forbid.domain-term-ambiguity`) |
| `shared prefix` | a different concept, and the strongest confusion. the shared prefix is MEASURED over a pair of requests; the seam is DECLARED per input on one prompt. they coincide only when the layout holds |

## .evidence

- the seam is the axis `rule.require.distinguish-every-review-input` states its obligation 2
  over: every named input must declare which side it sits on
- the type clamp: `IS_CACHEABLE_SECTION` is a `Record<keyof PromptSectionChars, boolean>`, so a
  section with no declared side is a type error, not a silent default
- the measured case that keeps the declaration and the measurement apart: on this branch a
  prompt with a flawless seam realized 0.0% from cache, because its request reached a replica
  that held none (`rule.require.name-the-shared-prefix-as-the-cache-anchor`). a seam names an
  upper bound, and only the shared prefix plus `cache.get` name what was realized

## .disputes

### dispute: an un-itemized `seam` — raised 2026-10-03 — status: RESOLVED (itemized)
- raised.by  = a peer reviewer of `5.1.execution.from_vision`
- claim      = `seam` composes a declared dop and a shipped rule's contract, so it owes a cluster
- counter    = none offered; it was simply never swept
- resolution = itemized here, and listed as a member of `prompt.cache`
