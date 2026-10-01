# domain.term: route.guard.brain.switch

term.chosen   = switch
term.kind     = noun
term.boundary = route.guard.brain   # the ACT of a change of brain, of a live driver clone
term.synonyms.forbidden:
- swap
- change
- set
- override
- selection

## .what

a **route.guard.brain.switch** is the act of a change of the brain a live driver clone runs under,
with the conversation intact. a `brain:` key causes it; `dispatchBrainSwitch` puts it on the wire.

- payload — one or two slash commands typed into the clone's pty: `/model <choice>`,
  `/effort <effort>`, one per declared axis
- target — one live clone, addressed by `@:<slug|serial>`
- it is an act, never a state. the state it aims at is the `brain`

| term | names | observable? |
|---|---|---|
| `brain` | the state a clone runs under | no — no shipped surface reports the live brain (`F5`) |
| `switch` | the act that aims at it | yes — dispatched, or not |

⇒ so the outcome reads `requested`, never `switched`.

## .refs

- src/domain.operations/route/brain/dispatchBrainSwitch.ts          # the operation it names
- src/domain.operations/route/brain/setStoneBrain.ts                # composes the probe + the switch
- src/domain.operations/route/brain/applyStoneBrainOnEntry.ts       # fires one per stone entry

## .reason

- `term=route.guard.brain.switch._.choice.reason.md` — the electrical etymology (spawn vs switch),
  the `switch` and `swap` disputes, the act-vs-state evidence
