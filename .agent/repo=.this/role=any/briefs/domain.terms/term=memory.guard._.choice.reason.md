# domain.term.choice.reason: memory.guard

## .etymology

**guard** — the word this repo already uses for a gate that stands before an act and decides
whether it proceeds (`route.guard`). the memory guard is the same shape at a different boundary: it
stands before a tool call and decides. `memory` qualifies it, so the two never collide.

| word | why rejected |
|---|---|
| `check` | reads as advisory; a guard halts |
| `filter` | implies it reshapes the call; it only passes or halts |
| `lint` | implies source text at rest; the guard judges a live call |

## .evidence

- the skill, the hook command, and the cli all carry the name (`memory.guard.sh`,
  `rhx memory.guard --mode hook`, `memoryGuard`)
- the rule it enforces: `rule.forbid.native-memory` (learner)
- the invariant: a payload the guard cannot judge never halts; it passes, exit 0

## .disputes

none.
