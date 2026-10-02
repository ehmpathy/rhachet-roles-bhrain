# domain.term: route.guard.brain

term.chosen   = brain
term.kind     = noun
term.boundary = route.guard   # the spend a guarded stone prescribes for its DRIVER
term.synonyms.forbidden:
- model
- engine
- llm
- agent

## .what

a **route.guard.brain** is the brain the **driver** runs under while it works one stone. a stone's
`*.guard` declares it as a top-level `brain:` key; the driver-role hook dispatches it into the live
driver clone on stone entry.

two axes, both nullable, each the brain-cli's own argument verbatim — never a rhachet brainslug:

| axis | dispatched as |
|---|---|
| `choice` | `/model <choice>` |
| `effort` | `/effort <effort>` |

- an absent key → the driver keeps its inherited brain. no probe, no output, no turn
- a `brain:` that declares neither axis → dropped at parse, warned as an empty key
- it bounds the driver alone. a peer review's `--brain` / `--model` in the same guard is a
  separate scope

## .the three declaration forms

```
brain: opus[1m]              # shorthand — the value IS the choice
                             # ⇒ { choice: 'opus[1m]', effort: null }

brain:                       # exploded — the only way to declare an effort
  choice: opus[1m]
  effort: medium             # ⇒ { choice: 'opus[1m]', effort: 'medium' }

brain:                       # effort alone — re-price the brain the driver already runs
  effort: medium             # ⇒ { choice: null, effort: 'medium' }
```

🟡 `[1m]` inside a choice is a context-window variant, never an effort. it belongs to `/model` whole.

## .the `model:` near-miss

| key | parse result |
|---|---|
| `brain:` | parsed, value carried |
| `model:` — a known alias | warned by name (`use brain:`), value **dropped** |
| `brian:` — a near-miss | warned with the nearest known key, value dropped |
| `cadence:` — unknown | silent, dropped (`F4`) |

## .refs

- src/domain.objects/Driver/RouteStoneGuard.ts                    # `RouteStoneGuardBrain { choice, effort }`
- src/domain.operations/route/guard/parseStoneGuard.ts            # parses all three forms, warns on `model:`
- src/domain.operations/route/guard/asBrainSubKey.ts              # reads `choice:` / `effort:` inside the block
- src/domain.operations/route/guard/isGuardKeyExploded.ts         # tells an exploded `brain:` from an empty one
- src/domain.operations/route/brain/isStoneBrainDeclared.ts       # the union of axes — either one counts
- src/domain.operations/route/brain/setStoneBrain.ts              # decides the outcome for the live clone
- src/domain.operations/route/brain/dispatchBrainSwitch.ts        # fans out to `/model` and `/effort`
- src/domain.operations/route/stepRouteDrive.ts                   # detects entry, reports the switch
- src/domain.operations/route/guard/parseStoneGuard.brain.integration.test.ts  # `[case9]`–`[case11]` walk the three forms

## .reason

- `term=route.guard.brain._.choice.reason.md` — why `brain` over `model`, why `model:` warns and
  drops, why the value is a passthrough, why `effort` is a sub-axis, why the key sits on the guard
- `term=route.guard.brain.effort._.choice._.md` — the sub-axis
