# domain.term.choice.reason: route.brain.inheritance

## .etymology

named from the legal/biological sense — a value passed down from an ancestor, with no explicit
act at the point of receipt. that is exactly the mechanism: a stone that declares no `brain:`
runs on whatever the last brain-bearing stone before it set, with no action of its own.

rejected alternatives:

- `default` — a default is authored once, applies globally, and does not change as the route's
  stones change. an inherited brain is attributed to a SPECIFIC prior stone, and a different
  route with a different declared value inherits a different one
- `fallback` — implies an error-recovery path, as though the brainless stone erred. it did not;
  it simply never declared one, which is the common case

## .disputes

none raised yet.

## .evidence

`getOneBrainInheritance.ts`'s own doc comment: *".why it is its OWN FILE rather than a private
const inside `applyStoneBrainOnEntry`"* — the op is split out precisely because it must be
computed against a route-wide walk, not a single stone's guard.

## .invariants

- inheritance is computed only when `isRouteBrainDeclared` is true for the route
- an inherited attribution names the STONE that last set the brain, never a blanket "default"
- a stone that itself declares `brain:` never carries an inheritance record — it carries its own
  declared value
