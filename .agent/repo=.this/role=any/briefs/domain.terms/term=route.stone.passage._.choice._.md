# domain.term: passage

term.chosen   = passage
term.kind     = noun
term.boundary = route.stone
term.synonyms.forbidden:
- advance
- promotion
- completion
- clearance

## .what

a stone's **passage** is its advance past its guard — the transition the driver asks for with
`--as passed` and the guard either allows or refuses.

it is one of **three** distinct admissions in the guard, and the round that added the entrance gate
made all three observable at once:

| the admission | what it admits | the gate that rules it |
|---|---|---|
| **entry** | the driver into a **review round** | the entrance gate |
| **passage** | the **stone** past its guard | the exit gate, then the judges |
| **approval** | a human's **permission**, which is not itself passage | `--as approved` |

⇒ **entry, passage, and approval are three things, and only the middle one is `passage`.**

## .refs

- `src/domain.operations/route/stones/setStoneAsPassed.ts`
- `src/domain.operations/route/formatRouteStoneEmit.ts` — renders `passage = allowed`
- `.route/passage.jsonl` — the persisted ledger
- `.agent/repo=.this/role=any/briefs/define.passage-statuses.md` — which statuses count

## .reason

- `term=route.stone.passage._.choice.reason.md`
