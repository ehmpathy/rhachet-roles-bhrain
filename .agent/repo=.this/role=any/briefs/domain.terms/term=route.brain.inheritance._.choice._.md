# domain.term: route.brain.inheritance

term.chosen   = inheritance
term.kind     = noun
term.boundary = route.brain   # what a brainless stone runs under, on an opted-in route
term.synonyms.forbidden:
- default
- fallback
- carryover

## .what

a **route.brain.inheritance** is what a stone with no declared `brain:` key runs under, on a
route where at least one OTHER stone declares one. `getOneBrainInheritance` looks back through
prior stones for the last one that set a brain, and the drive renders it as `brain = <slug>`
rather than stay silent about which brain is live.

- computed only when `isRouteBrainDeclared` is true for the route (`rule.require.most-common-
  denominator`); a route that never declares `brain:` has no inheritance to compute
- attributed to a specific prior STONE, never a blanket route default

## .refs

- src/domain.operations/route/brain/getOneBrainInheritance.ts
- src/domain.operations/route/drive/DriveBlocker.ts (the `DriveBrainInheritance` dobj)

## .reason

see the ref-level cluster beside this choice:

- `term=route.brain.inheritance._.choice.reason.md` — why `inheritance` over `default`/`fallback`
