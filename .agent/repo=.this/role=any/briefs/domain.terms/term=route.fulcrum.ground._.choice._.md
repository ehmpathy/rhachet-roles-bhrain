# domain.term: ground

term.chosen   = ground
term.kind     = noun
term.boundary = route.fulcrum
term.synonyms.forbidden:
- basis
- reason-kind

## .what
**ground** names **why the driver disputes a concern: `wrong` (the reviewer misread the artifact) or
`dirty` (the reviewer is right on the rule, and the repair costs more than it buys).**

`wrong` is checkable against the artifact; `dirty` is a tradeoff only a human weighs. so a dirty
dispute is owed to a human at any confidence (`term=route.fulcrum.owed`).

## .refs
- src/domain.operations/route/fulcrum/asFulcrumFrontmatter.ts   # the closed set
- src/domain.operations/route/fulcrum/asFulcrumOwed.ts          # how ground decides owed

## .reason
- `term=route.fulcrum.ground._.choice.reason.md`
