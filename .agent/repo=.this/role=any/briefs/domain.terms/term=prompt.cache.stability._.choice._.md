# domain.term: stability

term.chosen   = stability
term.kind     = noun
term.boundary = prompt.cache  # how likely a prompt input is to be byte-identical next round
term.synonyms.forbidden:
- volatility   # the inverse; one axis is named by one pole. binds the NAME of the axis in
               # a dobj, dop, or flag. a measured share of changed bytes may be reported
               # as volatility — the section-order rule does — since volatility ASC is
               # stability DESC (see `.reason` disputes)
- freshness    # reads as recency, which is the opposite preference

## .what

an input's **stability** is how likely its bytes are to be identical on the next round. the
cache serves only a shared prefix, so inputs are ordered most-stable first: the tail of a prompt
changes, and the head stays cacheable.

## .refs

- `src/domain.operations/review/getAllTargetsByCacheStability.ts`
- `rule.require.name-the-shared-prefix-as-the-cache-anchor` — *"order by what will still be
  identical next round"*

## .reason

- `term=prompt.cache.stability._.choice.reason.md`
