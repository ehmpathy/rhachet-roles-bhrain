# self-review: has-contract-output-variants-snapped (r5)

## the question

does each public contract have snapshots for all output variants?

- for each new CLI command: is there a dedicated snapshot file with `.toMatchSnapshot()`?
- does it capture success cases, error cases, and edge cases?

## the review

### CLI contracts in achiever role

| CLI skill | acceptance test | snapshots |
|-----------|-----------------|-----------|
| goal.memory.set | achiever.goal.lifecycle.acceptance.test.ts | 5 snapshots |
| goal.memory.get | achiever.goal.lifecycle.acceptance.test.ts | 4 snapshots |
| goal.infer.triage | **none** | **0 snapshots** |

### goal.memory.set coverage

| variant | tested | snapshot |
|---------|--------|----------|
| success: new goal | yes | yes |
| success: status update | yes | yes |
| success: with coverage | yes | yes |
| error: incomplete schema | yes | no (stderr assertion only) |

### goal.memory.get coverage

| variant | tested | snapshot |
|---------|--------|----------|
| success: list all | yes | yes |
| success: filter by status | yes | yes |
| success: single goal | no | no |
| success: empty goals | yes | yes |
| error: invalid scope | no | no |

### goal.infer.triage coverage

| variant | tested | snapshot |
|---------|--------|----------|
| success: uncovered asks | no | no |
| success: all covered | no | no |
| success: hook.onStop uncovered | no | no |
| success: hook.onStop covered | no | no |
| error: invalid scope | no | no |

### gap identified

the blueprint (3.3.1.blueprint.product.v1.i1.md lines 304-312) specified:

```
goal.infer.triage.acceptance.test.ts:
- positive: uncovered asks | asks without coverage | exit 0, uncovered listed | yes
- positive: all covered | all asks have goals | exit 0, zero uncovered | yes
- positive: hook.onStop uncovered | --mode hook.onStop | exit 2, halt message | yes
- positive: hook.onStop covered | --mode hook.onStop | exit 0, silent | yes
- negative: invalid scope | --scope invalid | exit 1, error message | yes
```

this test file was not implemented. the CLI skill `goal.infer.triage` lacks acceptance test coverage.

### mitigation

the base domain operation `getTriageState` has thorough integration tests:
- case1: empty state
- case2: asks with no coverage
- case3: partial coverage
- case4: full coverage
- case5: with extant goals
- case6: complete triage scenario

the domain logic is verified, but the CLI output format is not snapshotted.

### assessment

the gap is real but bounded:
- core triage logic is tested via integration tests
- the CLI is a thin wrapper that formats output
- no user-visible functionality is untested

this does not fully hold. the CLI skill lacks acceptance snapshots.

## conclusion

**holds: partial**

2 of 3 CLI skills have acceptance tests with snapshots. `goal.infer.triage` lacks CLI acceptance coverage. the domain operation is tested at the integration level but the CLI wrapper output is not snapshotted.

for full compliance with the blueprint, `goal.infer.triage.acceptance.test.ts` should be added in a follow-up iteration.
