# F5: the hook command file pairs with its role file

## .the fork

`getLearnerRoleHookCommand.ts` exports the constant `LEARNER_MEMORY_GUARD_HOOK_COMMAND`, not an operation of the file's name. rename the file to the constant, wrap the constant in a `getLearnerRoleHookCommand()` operation, or keep the pair?

## .taken: keep the pair

- every role file here is `get<X>Role.ts` and exports `ROLE_<X>` — a constant under a `get` file name. the hook command is part of that role declaration, split out so its integration test can import it alone; the file name extends its parent's (`getLearnerRole` → `getLearnerRoleHookCommand`).
- a wrapper `getLearnerRoleHookCommand()` that returns a fixed string adds a call with no input and no logic, and `rule.require.get-set-gen-verbs` would then ask for `getOne…`, a name that matches neither file.
- a rename to a SHOUT_CASE file name breaks the role tree's one convention to satisfy a rule its parent file already sets aside.

## .rework: clean

one file rename and two imports.

## .confidence: 85%

the convention is consistent across every role; the rule the reviewer cites reads strictly against it.

## .where

`src/domain.roles/learner/getLearnerRoleHookCommand.ts`.

## .verdict

open for the human.
