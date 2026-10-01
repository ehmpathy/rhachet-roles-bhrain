# domain.term: route.guard.brain.effort

term.chosen   = effort
term.kind     = noun
term.boundary = route.guard.brain   # the LEVEL a prescribed brain runs at, for one stone
term.synonyms.forbidden:
- reasoning
- thinking
- depth
- budget

## .what

a **route.guard.brain.effort** is the level the driver's prescribed brain runs at for one stone. it
is an `effort:` sub-key inside an exploded `brain:` block, dispatched as `/effort <effort>`.

- the value is the brain-cli's own `/effort` argument, verbatim — no translation, no level list
- it is a sub-axis of the brain, never a peer key: a level is model-scoped
- it is reachable only by an explode. `brain: <x>` always means a choice

```
brain:
  choice: opus[1m]   # optional — omit it to re-price the brain the driver already runs
  effort: medium
```

- a guard that declares both axes produces two says, `/model` and `/effort`, fanned out in
  `dispatchBrainSwitch`. their wire order is unguaranteed, and that is settled as fine (`F29`)
- an inherited effort is recorded and rendered, as the inherited choice is (`F30`). a `/model`
  with no `/effort` beside it clears the level — an effort is model-scoped

## .refs

- src/domain.objects/Driver/RouteStoneGuard.ts                    # `RouteStoneGuardBrain.effort`
- src/domain.operations/route/guard/asBrainSubKey.ts              # reads `effort:` inside the block
- src/domain.operations/route/brain/asStoneBrainEffort.ts         # reads it off a stone-brain outcome
- src/domain.operations/route/brain/dispatchBrainSwitch.ts        # the `/effort` say
- src/domain.operations/route/brain/setStoneBrain.ts              # carries it into the outcome

## .reason

- `term=route.guard.brain.effort._.choice.reason.md` — why `effort` over the forbidden peers, why a
  sub-axis, why explode-only, why a passthrough
