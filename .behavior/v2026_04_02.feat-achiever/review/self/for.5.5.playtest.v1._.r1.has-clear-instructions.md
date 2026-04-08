# self-review: has-clear-instructions (r1)

## the question

are the instructions followable?

- can the foreman follow without prior context?
- are commands copy-pasteable?
- are expected outcomes explicit?

## the review

### method

read the playtest artifact line by line. tested each command pattern against the actual implementation.

### issues found

#### issue 1: sandbox not used by CLI

the playtest creates a sandbox at `.temp/playtest-achiever/` but the CLI commands ignore it.

**problem:**
```sh
mkdir -p .temp/playtest-achiever/.goals/playtest-branch
npx tsx src/contract/cli/goal.ts goal.memory.set --scope repo
```

the `--scope repo` flag makes the CLI use `.goals/$branch/` (from git root), not the sandbox. the sandbox directory is never used.

**impact:** the playtest would pollute the actual repo with goal files.

**fix:** remove the sandbox section and use the acceptance tests for sandboxed verification. add a note that manual CLI verification uses the real `.goals/` and requires cleanup.

#### issue 2: incorrect CLI invocation pattern

the playtest uses `npx tsx src/contract/cli/goal.ts goal.memory.set` but this doesn't match how the skills are invoked.

**actual patterns:**
- acceptance tests use temp fixtures with `invokeGoalSkill`
- shell skills use `node -e "import('rhachet-roles-bhrain/cli/goal').then(m => m.goalMemorySet())"`

**fix:** update the playtest to use the shell skill invocation pattern, or clarify that `npx tsx` is a dev-time shortcut.

#### issue 3: some expected outcomes are approximate

the expected output shows `path: .goals/playtest-branch/...` but the actual path includes the full git root and offset prefix.

**fix:** use `[GITROOT]` and `[OFFSET]` placeholders to indicate variable parts.

### what holds

1. **prerequisites are clear** — build, verify scripts, create sandbox
2. **each step has action + expected outcome + pass/fail** — structure is correct
3. **edge cases are covered** — incomplete schema, main branch, empty list, not found
4. **pass/fail criteria are explicit** — specific observable outcomes listed

## fixes applied

updated the playtest to:
1. remove fake sandbox, use real `.goals/` with cleanup note
2. clarify CLI invocation pattern
3. use placeholders for variable output parts
4. emphasize acceptance tests as primary verification

## verification of fixes

re-read the updated playtest to confirm each fix:

| issue | fix location | verified |
|-------|--------------|----------|
| sandbox not used | line 39-41: "manual CLI verification uses the real `.goals/` directory" | ✓ |
| sandbox not used | line 148-155: cleanup command with `rm -rf .goals/$(git branch --show-current)` | ✓ |
| CLI invocation | line 43-49: "note on invocation" explains both methods | ✓ |
| approximate outcomes | line 81-84: uses `[GITROOT]`, `[BRANCH]`, `[OFFSET]` placeholders | ✓ |
| primary verification | line 18-35: acceptance tests now primary, manual is secondary | ✓ |

## conclusion

**holds: no (issues found and fixed)**

the playtest structure was correct but the sandbox approach was broken. fixed to align with actual CLI behavior and acceptance test pattern.

---

## fresh verification (2026-04-07)

i pause. i breathe. i am the reviewer.

### did i verify the fixes are reflected in the current playtest?

yes. read the updated playtest artifact:

| check | status | location |
|-------|--------|----------|
| sandbox removed | yes | line 42: "manual CLI verification tests scope auto-detection" |
| cleanup command present | yes | line 200: `rhx rmsafe --path '.behavior/.../goals' --recursive` |
| placeholders used | yes | line 72: `[OFFSET]` placeholder |
| acceptance tests primary | yes | lines 18-36: "primary verification: acceptance tests" |

### are commands copy-pasteable?

verified each command in the manual section:

| step | command | copy-paste? |
|------|---------|-------------|
| manual.1 | `rhx goal.memory.set --slug playtest-goal --why.ask '...'` | yes |
| manual.2 | `rhx goal.memory.get` | yes |
| manual.3 | `rhx goal.infer.triage --mode hook.onStop` | yes |
| manual.4 | `rhx goal.memory.set --slug playtest-goal --why.purpose '...'` | yes |
| manual.6 | `rhx goal.infer.triage --mode hook.onStop` | yes |
| manual.7 | `rhx goal.memory.get` | yes |
| manual.8 | `rhx goal.memory.set --slug playtest-goal --status inflight ...` | yes |
| manual.9 | `rhx rmsafe --path '.behavior/...' --recursive` | yes |

all commands are copy-pasteable shell commands.

### are expected outcomes explicit?

yes. each step has:
- **expected outcome:** what the output should show
- **pass:** specific condition for success
- **fail:** specific condition for failure

example from manual.1:
```
**expected outcome:**
- exit code 0
- stdout shows `--scope route` (auto-detected because we're bound)
- stdout shows `status.choice = incomplete`

**pass:** scope auto-detected as `route`, goal created with `status=incomplete`
**fail:** scope defaulted to `repo` or status is not `incomplete`
```

### can a foreman follow without prior context?

yes. the playtest includes:
1. prerequisites section with build commands
2. link instructions for skills
3. step-by-step commands with expected outcomes
4. cleanup instructions at the end

**verified: instructions are followable**
