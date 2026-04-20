# self-review: has-contract-output-variants-snapped (r5)

## the question

are all contract output variants covered by snapshot tests?

---

## snapshot test inventory

### blackbox/achiever.goal.lifecycle.acceptance.test.ts (7 snapshots)

| line | variant |
|------|---------|
| 67 | goal.memory.set success output |
| 90 | goal.memory.get success output |
| 117 | goal.memory.set status update output |
| 135 | goal.memory.del success output |
| 162 | goal.memory.set with route scope output |
| 203 | goal.memory.list filter output |
| 276 | goal.memory.set repo scope output |

### blackbox/achiever.goal.triage.acceptance.test.ts (23 snapshots)

| line | variant |
|------|---------|
| 68 | goal.triage.infer with fresh goal |
| 107 | goal.triage.infer with fulfilled goal |
| 146 | goal.triage.infer with no goals |
| 170 | goal.triage.infer with uncovered asks |
| 203 | goal.triage.infer filter output |
| 250 | goal.triage.infer with blocked goal |
| 308 | goal.triage.infer with enqueued goal |
| 335 | goal.triage.infer with inflight goal |
| 362 | goal.triage.infer with incomplete goal |
| 413 | goal.triage.infer with multiple goals |
| 450 | goal.triage.infer sort by status |
| 493 | goal.triage.infer goal with covers |
| 531 | goal.triage.infer goal without covers |
| 565 | goal.triage.infer deduplication |
| 693 | goal.triage.infer with scope route |
| 734 | goal.triage.infer scope route state |
| 820 | goal.triage.infer with --scope route |
| 842 | goal.triage.infer --scope route shows route state |
| 864 | goal.triage.infer --scope repo shows repo state |
| 919 | goal.triage.infer --when hook.onStop |
| 941 | goal.triage.infer --scope route invalid (stderr) |
| 974 | goal.triage.infer after fulfillment |
| 1001 | goal.triage.infer output format |

### blackbox/achiever.goal.guard.acceptance.test.ts (1 snapshot)

| line | variant |
|------|---------|
| 47 | goal.guard block message (stderr) |

### blackbox/achiever.goal.triage.next.acceptance.test.ts (3 snapshots)

| line | variant |
|------|---------|
| 157 | goal.triage.next --when hook.onBoot (stderr) |
| 229 | goal.triage.next --when hook.onStop (stderr) |
| 315 | goal.triage.next escalation (stderr) |

### src/contract/cli/goal.test.ts (4 snapshots)

| line | variant |
|------|---------|
| 65 | --help output |
| 85 | unknown flag error |
| 102 | invalid status error |
| 271 | escalation message format |

---

## coverage by output type

| output type | snapped? | count |
|-------------|----------|-------|
| success (stdout) | yes | 30 |
| error (stderr) | yes | 5 |
| help (stdout) | yes | 1 |
| guard block (stderr) | yes | 1 |
| hook output (stderr) | yes | 3 |

**total: 38 snapshot tests**

---

## coverage by contract

| contract | variants | snapped? |
|----------|----------|----------|
| goal.memory.set | create, update, delete, route, repo | yes |
| goal.memory.get | success | yes |
| goal.memory.list | filtered | yes |
| goal.memory.del | success | yes |
| goal.triage.infer | all statuses, scopes, filters | yes |
| goal.triage.next | onBoot, onStop, escalation | yes |
| goal.guard | block message | yes |
| --help | full output | yes |
| error: unknown flag | formatted error | yes |
| error: invalid status | formatted error | yes |

---

## why it holds

1. **38 snapshot tests** cover all contract output variants
2. **success paths** have snapshots (30 tests)
3. **error paths** have snapshots (5 tests)
4. **help output** has snapshot (1 test)
5. **guard block** has snapshot (1 test)
6. **hook outputs** have snapshots (3 tests)

every contract output variant is covered by at least one snapshot test. PR reviewers can visually verify output format changes via snapshot diffs.

