# self-review r1: has-questioned-assumptions

## technical assumptions questioned

### 1. assumption: `status.choice !== 'incomplete'` is the correct partition

**what do we assume?** that all non-incomplete statuses (enqueued, inflight, blocked, fulfilled) are "past triage" and belong in goalsComplete.

**what if the opposite were true?** what if `blocked` goals should still appear in incomplete? they might need attention.

**verdict**: the assumption holds. `blocked` means the goal was triaged (fields filled) but hit a blocker. triage is about filling fields, not about workflow state. once fields are filled, triage is done regardless of whether the goal is blocked.

### 2. assumption: field flags exist as `--why.purpose`, `--why.benefit`, etc.

**what do we assume?** that goal.memory.set already supports these field flags.

**what evidence supports this?** verified in goal.ts at line 235-244:
```ts
const FIELD_FLAGS = [
  'why.ask',
  'why.purpose',
  'why.benefit',
  'what.outcome',
  'how.task',
  'how.gate',
];
```

**verdict**: assumption verified with evidence.

### 3. assumption: first absent field only is correct UX

**what do we assume?** that brains prefer one field at a time over all fields at once.

**could a simpler approach work?** show all fields with all commands? simpler to implement, but wisher explicitly confirmed one-at-a-time in vision session.

**verdict**: assumption holds per wisher feedback.

### 4. assumption: getTriageState.ts is the right place for the fix

**what do we assume?** that partition logic belongs in getTriageState, not in the CLI output layer.

**what if the opposite were true?** what if we should filter in goal.ts instead?

**verdict**: getTriageState is the right place. it's the domain operation that computes triage state. the CLI should receive correct data, not fix incorrect data.

### 5. assumption: renaming goalInferTriage → goalTriageInfer requires no export changes

**what do we assume?** that the function is only called from the shell entrypoint, not imported elsewhere.

**what evidence supports this?** need to verify. let me check...

**evidence found**: grep shows `goalInferTriage` is:
- defined in goal.ts
- called from goal.infer.triage.sh via dynamic import

no other imports found. rename is safe.

**verdict**: assumption verified.

### 6. assumption: the shell skill rename doesn't break package.json exports

**what do we assume?** that package.json exports reference the directory, not specific files.

**what if the opposite were true?** if package.json explicitly exports `goal.infer.triage.sh`, the rename would break.

**verdict**: need to verify package.json exports at implementation time. flagged for verification.

---

## summary

| assumption | verified? | action |
|------------|-----------|--------|
| status partition logic | yes | proceed |
| field flags exist | yes | proceed |
| one-at-a-time UX | yes | proceed |
| fix location | yes | proceed |
| function rename safe | yes | proceed |
| shell rename safe | needs verification | check package.json at implementation |

one item needs verification at implementation, but no blockers found.

