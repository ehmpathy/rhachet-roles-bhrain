# domain.term: memory.guard.act

term.chosen   = act
term.kind     = noun
term.boundary = memory.guard
term.synonyms.forbidden:
- action
- kind
- operation
- reason

## .what
how a blocked call touches memory. three members:

| act | the call |
|---|---|
| `write` | a write that lands in memory: a redirect, a tee operand, a cp/mv destination, a Write or Edit path |
| `copy` | a cp/mv beside memory whose destination is not memory (blunt, by design) |
| `unplaced` | a write the guard cannot place: a redirect via `$var`, or relative with no cwd known |

## .refs
- src/domain.operations/memory/getMemoryGuardVerdict.ts   # `MemoryGuardAct`
- src/contract/cli/asMemoryGuardNudge.ts                  # one nudge per act

## .reason
- `term=memory.guard.act._.choice.reason.md`
