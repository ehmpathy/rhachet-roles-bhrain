# self-review: has-preserved-test-intentions

## the question

did you preserve test intentions?

- what did this test verify before?
- does it still verify the same behavior after?
- did you change what the test asserts, or fix why it failed?

---

## test file changes summary

| file | additions | deletions | nature |
|------|-----------|-----------|--------|
| src/contract/cli/goal.test.ts | 195 | 1 | new tests added |
| blackbox/achiever.goal.guard.acceptance.test.ts | 255 | 0 | new file |
| blackbox/achiever.goal.lifecycle.acceptance.test.ts | 98 | 0 | new tests added |
| blackbox/achiever.goal.triage.acceptance.test.ts | 42 | 23 | skill name corrections |
| blackbox/achiever.goal.triage.next.acceptance.test.ts | 375 | 0 | new file |
| src/domain.operations/goal/getGoalGuardVerdict.test.ts | 172 | 0 | new file |
| src/domain.operations/goal/getTriageState.integration.test.ts | 215 | 0 | new file |

**total**: 1329 additions, 23 deletions

---

## the 23 deletions

all 23 deleted lines are in `blackbox/achiever.goal.triage.acceptance.test.ts`.

### what changed

| before | after | reason |
|--------|-------|--------|
| `goal.infer.triage` | `goal.triage.infer` | skill name was wrong |
| `--mode hook.onStop` | `--when hook.onStop` | arg name was wrong |
| `args: { mode: 'hook.onStop' }` | `args: { when: 'hook.onStop' }` | arg name was wrong |

### why this is not a weakened assertion

the tests called a skill that did not exist (`goal.infer.triage`). the correct skill name is `goal.triage.infer`.

the tests used an arg that did not exist (`--mode`). the correct arg name is `--when`.

**test intention**: verify that hook.onStop behavior works correctly.

**before**: test would fail with "unknown skill" or "unknown arg" error.

**after**: test invokes the correct skill with the correct arg.

**same behavior verified**: yes — test still verifies hook.onStop fires, shows reminders, and respects goal states.

---

## forbidden check

| criterion | status |
|-----------|--------|
| weaken assertions to make tests pass | no — assertions unchanged |
| remove test cases that "no longer apply" | no — zero test cases removed |
| change expected values to match broken output | no — expected values unchanged |
| delete tests that fail instead of fix code | no — zero tests deleted |

---

## why it holds

1. **1329 additions**: all new tests for new behaviors (wish items 1-7)
2. **23 deletions**: all are skill/arg name corrections, not assertion changes
3. **zero test cases removed**: same behaviors tested before and after
4. **zero assertions weakened**: expected values unchanged
5. **bug fixed in test, not test intention changed**: test now calls correct skill

the test knew a truth: hook.onStop should fire with reminders. the test was buggy (wrong skill name). the bug was fixed. the intention is preserved.

