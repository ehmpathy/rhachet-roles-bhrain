# self-review: has-consistent-conventions (r4)

## review scope

execution stone 5.1 — achiever-finishall implementation

deeper comparison of actual file contents against extant patterns.

## side-by-side comparison

### shell skill structure

**extant (goal.memory.set.sh):**
```bash
#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for goal.memory.set skill
# .why = persists a goal to the goals directory
# usage: ...
# options: ...
######################################################################
set -euo pipefail
exec node -e "import('rhachet-roles-bhrain/cli/goal').then(m => m.goalMemorySet())" -- "$@"
```

**new (goal.guard.sh):**
```bash
#!/usr/bin/env bash
######################################################################
# .what = PreToolUse hook to protect .goals/ from direct manipulation
# .why = prevents bots from bypass of goal accountability
# usage: ...
# exit codes: ...
######################################################################
set -euo pipefail
exec node -e "import('rhachet-roles-bhrain/cli/goal').then(m => m.goalGuard())" -- "$@"
```

**structural match:**
- ✓ same shebang: `#!/usr/bin/env bash`
- ✓ same header format: `.what`, `.why`, documentation
- ✓ same fail-fast: `set -euo pipefail`
- ✓ same invocation pattern: `exec node -e "import(...).then(...)"`

### CLI handler signature

**extant:**
```typescript
export const goalMemorySet = async (): Promise<void> => {
  // parse args from process.argv
  // invoke domain operations
  // output to stdout/stderr
};
```

**new:**
```typescript
export const goalGuard = async (): Promise<void> => {
  // read stdin JSON
  // invoke getGoalGuardVerdict
  // output to stderr, exit appropriately
};
```

**structural match:**
- ✓ same signature: `async (): Promise<void>`
- ✓ same export pattern: named export
- ✓ same file location: src/contract/cli/goal.ts

### domain operation signature

**extant (getGoals.ts):**
```typescript
export const getGoals = async (input: {
  scopeDir: string;
  filter?: { status?: GoalStatusChoice; slug?: string };
}): Promise<{ goals: Goal[] }>
```

**new (getGoalGuardVerdict.ts):**
```typescript
export const getGoalGuardVerdict = (input: {
  toolName: string;
  toolInput: { file_path?: string; command?: string };
}): GoalGuardVerdict
```

**structural match:**
- ✓ same name pattern: `get[DomainNoun][Modifier]`
- ✓ same input pattern: `(input: { ... })`
- ✓ same file location: src/domain.operations/goal/

## conclusion

all new components match extant structural conventions:
- shell skills follow exact template
- CLI handlers follow signature pattern
- domain operations follow name and input conventions
- all files in expected locations
