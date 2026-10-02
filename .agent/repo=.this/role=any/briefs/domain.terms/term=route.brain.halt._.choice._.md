# domain.term: route.brain.halt

term.chosen   = halt
term.kind     = noun
term.boundary = route.brain   # the state a brain dispatch reaches when it cannot complete
term.synonyms.forbidden:
- failure
- error
- abort

## .what

a **route.brain.halt** is the state a brain dispatch reaches when it cannot complete. each
`route.brain.halt.cause` carries its own why:/fix: prose, so the reader gets the exact remedy.

- an absent `brain:` key dispatches no switch, and is NOT a halt
- a brain halt never blocks stone entry — "fail loud" binds a switch that was asked for and did
  not happen, never entry itself (`case=10`)

## .refs

- src/domain.operations/route/brain/StoneBrainHaltCause.ts
- src/domain.operations/route/brain/formatStoneBrainOutcome.ts

## .reason

see the ref-level cluster beside this choice:

- `term=route.brain.halt._.choice.reason.md` — why `halt` over `failure`/`error`/`abort`
