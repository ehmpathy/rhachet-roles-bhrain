# self review: role-standards-coverage (r8)

## deeper review

verified all relevant patterns are present across changed files.

### getTriageState.ts: error scenarios

**lines 34-36, 48-50**: empty catch blocks for file read

these are intentional. when file does not exist, return empty array. this is correct behavior for optional files (asks.inventory.jsonl, asks.coverage.jsonl).

**test coverage**: case1 t1 tests "directory does not exist" → returns empty arrays

### getTriageState.ts: partition logic

**lines 64-65**: status-based partition

```typescript
const goalsComplete = goals.filter((g) => g.status.choice !== 'incomplete');
const goalsIncomplete = goals.filter((g) => g.status.choice === 'incomplete');
```

**test coverage**: case7 tests all status values:
- t0: status=incomplete with all fields → goalsIncomplete
- t1: status=enqueued → goalsComplete
- t2: status=inflight → goalsComplete
- t3: status=blocked → goalsComplete
- t4: status=fulfilled → goalsComplete
- t5: mix of statuses → correct partition

### goal.ts: actionable output

**lines 976-980**: command suggestion for incomplete goals

verified test coverage in achiever.goal.triage.acceptance.test.ts:
- tests for incomplete goals show `to fix, run:` output
- tests for hook.onStop mode verify exit 2 on issues

### goal.ts: per-goal tips

**lines 1247-1249, 1269-1271**: tip per goal in triage.next

verified test coverage in achiever.goal.triage.next.acceptance.test.ts:
- tests verify per-goal tip format

### shell skill: fail-fast

**goal.triage.infer.sh line 17**: `set -euo pipefail`

correct shell best practice present.

### type coverage

all return types explicitly declared:
- `getTriageState`: full return type with Goal[], Ask[], Coverage[]
- `goalTriageInfer`: `Promise<void>`
- `parseArgsForTriage`: `Promise<{ scope, mode }>`

### validation coverage

- `parseArgsForTriage`: validates --scope values
- `parseArgsForTriageNext`: validates --when values, throws BadRequestError

### what/why coverage

all functions have `.what` and `.why` jsdoc:
- getTriageState (lines 10-12)
- goalTriageInfer (lines 940-943)
- parseArgsForTriage (lines 431-434)

## outcome

all expected patterns are present. no gaps found.
