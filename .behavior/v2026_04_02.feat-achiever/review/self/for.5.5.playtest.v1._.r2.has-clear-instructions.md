# self-review: has-clear-instructions (r2)

## the question

are the playtest instructions clear and actionable?

- can each step be executed without ambiguity?
- are commands copy-pasteable?
- are expected outcomes specified?

## the review

### method

read the playtest file (5.5.playtest.v1.i1.md lines 50-149) and verify each command is executable.

### findings

**commands are copy-pasteable:**

all commands use `rhx` shorthand which is pre-approved in permissions:

```bash
# from line 56
rhx goal.memory.set --scope repo

# from line 99
rhx goal.memory.get --scope repo

# from line 121
rhx goal.infer.triage --scope repo
```

**expected outcomes are specified:**

| command | expected outcome |
|---------|------------------|
| goal.memory.set (line 56-93) | exit 0, stdout shows slug/path/meta.complete, file created at .goals/[BRANCH]/[OFFSET].fix-auth-test.goal.yaml |
| goal.memory.get (line 99-117) | exit 0, stdout shows goals count and goal details with status in brackets |
| goal.infer.triage (line 121-145) | exit 0, stdout shows asks/uncovered/goals/coverage counts |

**placeholders for variable output:**

the playtest uses clear placeholders for parts that vary:
- `[GITROOT]` — repository root path
- `[BRANCH]` — current branch name
- `[OFFSET]` — seconds offset prefix

example from line 71-76:
```
goal.memory.set --scope repo
   slug: fix-auth-test
   path: [GITROOT]/.goals/[BRANCH]/[OFFSET].fix-auth-test.goal.yaml
   meta.complete: true
```

**cleanup instructions present:**

line 147-149 documents cleanup:
```bash
rm -rf .goals/$(git branch --show-current)
```

### issues found: none

all three commands are:
1. copy-pasteable (use rhx shorthand)
2. have expected outcomes documented
3. use placeholders for variable parts
4. include cleanup instructions

## conclusion

**holds: yes**

the playtest instructions are clear and actionable:
1. commands are copy-pasteable via rhx shorthand
2. expected outcomes specify exit codes, stdout patterns, and file creation
3. variable parts use clear placeholders
4. cleanup instructions are present
