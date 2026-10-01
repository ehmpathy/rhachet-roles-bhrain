# domain.term: route.brain.halt.cause

term.chosen   = cause
term.kind     = noun
term.boundary = route.brain.halt   # which of the closed reasons a halt is
term.synonyms.forbidden:
- reason
- type
- kind

## .what

a **route.brain.halt.cause** is the discriminant on a `route.brain.halt` — one closed value of
`StoneBrainHaltCause`: `unenrolled`, `killed`, `unreadable-clone`, `unreadable-payload`,
`unreadable-address`, `timed-out`, `spawn-failed`. `formatStoneBrainOutcome` reads it to pick that
cause's own why:/fix: prose.

## .refs

- src/domain.operations/route/brain/StoneBrainHaltCause.ts
- src/domain.operations/route/brain/formatStoneBrainOutcome.ts
- src/domain.operations/route/brain/getCloneAddress.ts

## .reason

see the ref-level cluster beside this choice:

- `term=route.brain.halt.cause._.choice.reason.md` — why `cause` over `reason`/`type`/`kind`
