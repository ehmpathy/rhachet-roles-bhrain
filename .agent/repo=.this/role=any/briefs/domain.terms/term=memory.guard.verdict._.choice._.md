# domain.term: memory.guard.verdict

term.chosen   = verdict
term.kind     = noun
term.boundary = memory.guard
term.synonyms.forbidden:
- decision
- result
- outcome

## .what
the guard's judgment on one tool call: `allowed`, or `blocked` with the memory `path` and the
`act` that touches it. a call the guard cannot judge gets no verdict; it is `unjudgeable`.

## .refs
- src/domain.operations/memory/getMemoryGuardVerdict.ts

## .reason
- `term=memory.guard.verdict._.choice.reason.md`
