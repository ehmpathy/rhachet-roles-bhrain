# domain.term: memory.guard.unjudgeable

term.chosen   = unjudgeable
term.kind     = adj
term.boundary = memory.guard
term.synonyms.forbidden:
- invalid
- malformed
- unparseable

## .what
a hook payload the guard cannot judge: not json, or json with no `tool_name`, or unreadable on
stdin. the field holds the cause as one phrase. an unjudgeable call proceeds, exit 0; it is never
blocked.

## .refs
- src/domain.operations/memory/asToolInvocation.ts   # `unjudgeable: string | null`
- src/contract/cli/memory.ts

## .reason
- `term=memory.guard.unjudgeable._.choice.reason.md`
