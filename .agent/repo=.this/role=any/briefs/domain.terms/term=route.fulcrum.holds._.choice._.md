# domain.term: holds

term.chosen   = holds
term.kind     = verb
term.boundary = route.fulcrum
term.synonyms.forbidden:
- covers
- backs
- concerns

## .what
**holds** names **the reviewer concerns a fulcrum carries**, each as `<reviewer>/<iteration>/<ordinal>`
(e.g. `rules/i003/blocker.2`). a fulcrum no dispute cites holds `[]`.

a dispute may cite a fulcrum only where its `holds` names the concern disputed; the iteration is free,
since ordinals renumber each round and the driver names the round it read.

## .refs
- src/domain.operations/route/fulcrum/isFulcrumHoldsOfConcern.ts   # the match
- src/domain.operations/route/fulcrum/assertFulcrumFitsDispute.ts  # refuses a fulcrum that omits the concern

## .reason
- `term=route.fulcrum.holds._.choice.reason.md`
