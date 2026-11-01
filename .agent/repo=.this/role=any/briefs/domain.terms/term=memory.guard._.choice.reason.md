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
  `LEARNER_MEMORY_GUARD_HOOK_COMMAND`, `memoryGuard`)
- the rule it enforces: `rule.forbid.native-memory` (learner)
- the invariant this route set: a guard that cannot judge never halts (fulcrum F1, ruled exit 1)

## .disputes

none.
