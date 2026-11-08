# root causes: memory.guard halts calls it cannot judge

the stall in ehmpathy/rhachet-roles-bhrain#653: a PreToolUse hook that cannot run exits 2, and
claude code reads exit 2 as block. so every Write, Edit and Bash call halts.

lines cite `origin/main` of this repo and rhachet 1.50.1.

| # | root cause | owner repo | at | fix in #742 |
|---|---|---|---|---|
| R1 | an absent skill lookup exits 2; a hook that names an unlinked skill blocks every call | ehmpathy/rhachet | `src/domain.operations/invoke/findUniqueSkillExecutable.ts` (dist `:27`) — `no skill "memory.guard" found in any linked role`, a ConstraintError, exit 2 | no — rhachet#707 |
| R2 | a role hook cannot declare what its own fault means, so `rhachet init --hooks` renders a bare command that fails closed | ehmpathy/rhachet | `Role.hooks` onTool entry (no `onFault`); rendered by `rhachet init --hooks` | no |
| R3 | a tree's settings carry a role's hook while the role is unlinked; the hook names its skill with no link check | ehmpathy/rhachet | `rhachet init --hooks` vs `rhachet roles link` (hooks render apart from the link); seen via `src/domain.roles/learner/getLearnerRole.ts:29` | no |
| R4 | a mechanic rule mandates exit 2 on a malfunction for every PreToolUse hook, advisory guards included | ehmpathy/rhachet-roles-ehmpathy | role=mechanic `rule.require.qualified-error-headers`, section `.the PreToolUse exception` | no |
| R5 | the redirect test `/>\s*/` grades `2>&1`, `=>` and `->` as writes, so a read of a memory path halts | ehmpathy/rhachet-roles-bhrain | `src/domain.operations/memory/getMemoryGuardVerdict.ts:36` | yes |
| R6 | the skill exports the whole tool payload into `RHACHET_STDIN`; past the kernel's 128KB cap on one env string, `exec` fails and the guard faults on large writes | ehmpathy/rhachet-roles-bhrain | `src/domain.roles/learner/skills/memory.guard.sh:23` | yes |

## .confidence

- R1, R2, R4, R5, R6: read at the cited line.
- R3: ~70%. the crews' trees were not read, so how the hook reached an unlinked tree is inferred.

## .not root causes

- `getLearnerRole.ts:30` (`timeout: 'PT5S'`): a hook timeout does not exit 2.
- `memory.guard.sh:27` (import with no `.catch`): an unhandled rejection exits 1, a non-block.
