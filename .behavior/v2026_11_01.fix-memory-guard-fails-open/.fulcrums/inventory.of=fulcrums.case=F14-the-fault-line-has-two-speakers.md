# F14: the fault line has two speakers

## .the fork

the fault line `📜 memory.guard: could not run (<cause>); call allowed. fix: <fix>` is spelled in the skill (`MEMORY_GUARD_FAULT_FORMAT`, `emit_fault`) and in the hook command (three `echo` lines). one literal via an env var the hook passes to the skill, or two copies held equal by a clamp?

## .taken: two copies, one clamp

- the hook command speaks exactly when the skill cannot: absent, a dangled link, an exit outside the sealed codes. it cannot read a format from a skill that is not there
- the skill runs standalone too (`rhx memory.guard --mode hook`), with no hook to pass it a format; it must own a default
- so an env var still leaves two literals (the hook's value and the skill's default); it only moves one of them
- the clamp `getLearnerRole.integration.test.ts` "the hook command spells each fault line in the skill format" fails on any drift between them

## .rework: clean

one literal could live in a generated const both read at build time; a later change, no caller hardened against today's shape.

## .confidence: 85%

a reviewer may still weigh one literal over the clamp.

## .where

`src/domain.roles/learner/getLearnerRoleHookCommand.ts`; `src/domain.roles/learner/skills/memory.guard.sh`.

## .verdict

open.
