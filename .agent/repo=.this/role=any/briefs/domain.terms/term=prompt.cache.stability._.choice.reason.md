# domain.term.choice.reason: stability

## .etymology

latin *stabilis* — able to stand. an input is stable when it stands unchanged from one round to
the next, which is the one property a prompt cache rewards.

## .rejected peers

- `volatility` — the inverse pole. one axis takes one name; the name chosen is the pole the
  sort prefers, so "most stable first" reads straight
- `freshness` — reads as recency, and a fresh input is the one LEAST likely to repeat. the
  word would invert the preference it was meant to name

## .boundary

`prompt.cache`. stability is only a virtue because a cache serves a shared prefix; outside the
cache the order of inputs is immaterial. so the word sits under the cache, beside
`shared-prefix`, whose reach it decides.

## .evidence

- declared op `getAllTargetsByCacheStability`, which orders targets by a proxy for it (mtime —
  see fulcrum F52 on that proxy's known cost)
- the shared-prefix rule names alphabetic order a nitpick precisely because it is uncorrelated
  with stability
- the `repo-rules-briefs` lane named it un-itemized, 2026-09-27

## .disputes

### dispute: volatility — raised 2026-10-03 — status: RESOLVED (qualify the forbid)
- raised.by  = the `repo-rules-briefs` lane, i054
- claim      = the forbid list bans `volatility`, yet `rule.require.order-prompt-sections-by-volatility-then-size`
               is named and argued on it
- counter    = the rule MEASURES a quantity — the share of a section's bytes that differ
               from the prior round — and a measurement reads straightest by what it counts.
               the axis it sorts on is this one: volatility ASC is stability DESC, so the
               two never disagree on an order
- resolution = the forbid binds the NAME of the axis in a contract — a dobj, a dop, a flag —
               where one pole must win so autocomplete finds one word. a measured metric in a
               brief is exempt, and the forbid row now says so. a rename of the rule would
               ripple through 11 citations, seeds among them, for no change of sense
