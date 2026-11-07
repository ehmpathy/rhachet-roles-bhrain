# domain.term: memory.guard

term.chosen   = guard
term.kind     = noun
term.boundary = memory
term.synonyms.forbidden:
- memory.check
- memory.filter
- memory.lint

## .what
the learner's PreToolUse hook that blocks one act: a write into claude native memory
(`~/.claude/**/memory/**`, `MEMORY.md`). every other call passes, exit 0, silent.

## .refs
- src/domain.roles/learner/skills/memory.guard.sh
- src/domain.roles/learner/getLearnerRole.ts
- src/contract/cli/memory.ts
- src/domain.operations/memory/getMemoryGuardVerdict.ts

## .reason
- `term=memory.guard._.choice.reason.md`
