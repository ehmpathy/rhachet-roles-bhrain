# domain.term.choice.reason: breadth

## .etymology

breadth = how wide, where `depth` is how deep. the axis measures how much corpus one
report spans, and spans are wide rather than deep — so the ordinary english word carries the
sense with no gloss.

it was chosen over four candidates, each rejected for a reason that outlives the choice:

| candidate | why not |
|---|---|
| **scale** | already a buzzword this repo forbids (`rule.forbid.buzzwords`); reads as magnitude, not coverage |
| **level** | taken. `route.guard.level` is a declared term for a peer-review ladder rung, and this glossary is flat, so one word cannot serve two concepts (`rule.forbid.domain-term-ambiguity`) |
| **granularity** | names the inverse — fine-vs-coarse grain, not span. also 11 letters for a flag value a human types |
| **depth** | the direct antonym. a `grove` is not deeper than a `run`; it is wider |

the `level` collision is the sharpest of the four, and it is the reason the boundary segment
is `review` rather than bare. `route.guard.level` and `review.breadth` are two terms in two
boundaries, which is what `rule.require.boundary-qualified-terms` exists to make expressible.

## .disputes

### dispute: the axis in the COMMAND rather than a flag — raised 2026-09-20 — status: RESOLVED (a flag)

- raised.by = the wisher, mid-drive
- claim     = a flat command set (`review.cost.tree`, `review.cost.grove`) needs no axis word
  at all, so the term would be unowed
- counter   = the flat set expressed only TWO of the axis's three positions — `--of run` was
  inexpressible, and the decomposition that declared `breadth` with three positions was
  written on the same branch that shipped a command set with two. an axis in a flag can hold
  every position it declares; an axis baked into a name holds only the ones someone spelled
- resolution = one command over the axis, `review._.cost --of <breadth>`. that decision is
  what made this term a contract word, so the cluster is downstream of it
  (`F1`, `.behavior/v2026_09_20.review-cost-meter/.fulcrums/`)

## .evidence

- **discovery: dimensional decomposition.** the axis was surfaced by a walk of
  `breadth × quantity × intent`, and its three positions were closed by construction rather
  than listed — the walk is the evidence, at
  `.behavior/v2026_09_20.review-cost-meter/1.vision.experience.dimensions.md`
- **the closed set is an invariant, not a default.** `BREADTHS` is `as const` and `Breadth` is
  its union, so a fourth position is a type error rather than a runtime surprise
  (`rule.prefer.prevent-over-correct`)
- **the order carries weight.** `run ⊂ tree ⊂ grove` is strict containment, which is what lets
  one fold serve two breadths — the `grove` by-input census is the `tree` fold summed

## .the gap this leaves

five of eighteen cells are unserved, and three of them are `tree × chars × *` — the
`chars` quantity at `tree` breadth has no fold, though the `grove` fold above it proves the
roll-up is cheap. the term is complete; the surfaces over it are not.
