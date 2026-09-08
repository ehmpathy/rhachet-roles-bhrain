# domain.term: spoken

term.chosen   = spoken
term.kind     = adj
term.boundary = review
term.synonyms.forbidden:
- seen
- observed
- known
- present
- historical
- encountered

## .what
a reviewer slug is **spoken** when a `.given.by_peer` exists for it anywhere in the stone's review
corpus — that is, the reviewer has at some point rendered a verdict on this stone.

it is the counterpart of **configured**. the two sets answer different questions:

| set | asks | read from |
|---|---|---|
| `slugsConfigured` | who may run **now**? | the live guard config |
| `slugsSpoken` | who has ever spoken **here**? | the givens on disk |

🔴 **their UNION is what `--as contemplated --that <slug>` validates against**, and the union is
not an optimization — it is required. a **retired** reviewer is absent from the config by
definition, so a config-only check would reject the very slug the guard's own halt just printed,
and the driver could never answer the debt they were told to answer.

⚠️ **the union is a superset, never a wildcard.** an unknown slug is still refused, with the valid
options listed. what the `spoken` half adds is exactly the retired case, and no more.

it is sorted and deduped at the source, so the "valid options" a caller lists are stable per
machine rather than in glob order, which is the filesystem's (`rule.forbid.order-dependence`).

## .refs
where the term composes declared operations:
- src/domain.operations/route/guard/review/peer/getRouteGuardReviewPeerContemplationStatus.ts   # the `slugsSpoken: string[]` field, read from the UNSCOPED givens
- src/domain.operations/route/stones/setStoneAsContemplated.ts                                   # `validSlugs = configured ∪ spoken`

## .reason
see the ref-level cluster beside this choice:
- `term=route.guard.review.spoken._.choice.reason.md` — why `spoken`, not `seen`/`known`/`historical`
