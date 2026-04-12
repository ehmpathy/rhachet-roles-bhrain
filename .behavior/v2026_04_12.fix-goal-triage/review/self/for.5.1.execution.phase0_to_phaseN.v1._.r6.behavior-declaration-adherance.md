# self review: behavior-declaration-adherance (r6)

## deeper review

went through all changed files line by line. found one issue.

### issue found: outdated snapshot

**file**: `blackbox/__snapshots__/achiever.goal.guard.acceptance.test.ts.snap`

**problem**: snapshot still had old skill name `goal.infer.triage` at line 12

**evidence**:
```
-      ├─ goal.infer.triage — detect uncovered asks
+      ├─ goal.triage.infer — detect uncovered asks
```

**fix**: ran acceptance test which regenerated snapshot with correct name.

**verification**: snapshot now shows `goal.triage.infer` on line 12.

### why this was missed

the snapshot was added in a prior commit from another behavior route (v2026_04_08.achiever-finishall). the rename in this behavior route didn't automatically regenerate it.

### all files now adhere

| file | status | notes |
|------|--------|-------|
| goal.ts | adheres | all output uses `goal.triage.infer` |
| getTriageState.ts | adheres | partition by `status.choice` |
| getAchieverRole.ts | adheres | hook uses `--when` |
| goal.triage.infer.sh | adheres | renamed skill file |
| boot.yml | adheres | references renamed skill |
| readme.md | adheres | references renamed skill |
| howto.triage-goals.[guide].md | adheres | references renamed skill |
| userpromptsubmit.ontalk.sh | adheres | uses `--when` |
| acceptance tests | adheres | tests use renamed skill |
| guard snapshot | adheres (fixed) | now shows `goal.triage.infer` |

## outcome

one issue found and fixed. all files now adhere to behavior declaration.
