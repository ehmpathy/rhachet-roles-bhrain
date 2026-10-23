# domain.term.choice.reason: breakdown

## .etymology

the word is older than the cost meter. `genTokenBreakdownReport` carried it from the first
reviewer skill (`e7dcdc99`, 2025-12-23): a breakdown divides a token total into its per-file rows.
`setTokenArtifacts` then named the shape `Breakdown`, and `asTokenBreakdownsByTargetInput` reuses
it once per named target input.

it is a plain english word for a plain act — a total, shown divided into its parts — and that is
all it names here. it says naught of where a file sits, nor of how a run's targets are partitioned.

## .why four clusters forbid it, and none owned it

four clusters list `breakdown` as a forbidden synonym, each on the same ground — the word is
already the by-input census's:

| cluster | its stated ground |
|---|---|
| `term=review.attribution` | already an `observe` surface word; one word over two intents |
| `term=review.trace` | the by-input census is already called a breakdown; one word over two intents |
| `term=review.scope.locus` | it names the division, never the place |
| `term=review.scope.split` | already forbidden under `locus`; a split names its parts, a breakdown names naught |

⇒ each forbid pointed at an owner, and no cluster declared that owner. so the forbids rested on a
term the glossary did not hold — the gap `rule.require.domain-term-itemization` names. this cluster
is that owner.

## .why the two forbidden synonyms

- **split** — `review.scope.split` is the partition of a run's targets into named sets that each
  run alone. a breakdown runs naught; it counts. one word over both would read a token table as a
  run plan
- **locus** — `review.scope.locus` is the address of a mass, rolled up by directory. a breakdown is
  per file and carries no rollup. the locus answers *where*; the breakdown answers *how much, per
  file*

## .evidence

- the four forbids above, each one line in its cluster's `term.synonyms.forbidden`
- `setTokenArtifacts.ts` — `export type Breakdown = { entries: TokenBreakdownEntry[]; total: number }`,
  read for `all`, `rules`, `targets`, and `byInput`
- a census of `term=*breakdown*` under `domain.terms/` returned 0 files before this cluster
