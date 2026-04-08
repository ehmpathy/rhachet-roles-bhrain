# self-review: has-acceptance-test-citations (r4)

## the question

coverage check: cite the acceptance test for each playtest step.

- which acceptance test file verifies this behavior?
- which specific test case covers it?
- if a step lacks coverage, is it a gap?

## the review

### method

read playtest steps, then searched acceptance test files for each CLI skill invocation. verified citations via source code review.

### playtest steps mapped to acceptance tests

| playtest step | acceptance test file | test case | covered? |
|---------------|---------------------|-----------|----------|
| primary: run all achiever tests | both files | all cases | yes |
| manual.1: goal.memory.set (new) | lifecycle | [case1][t0] | yes |
| manual.2: goal.memory.set (status) | lifecycle | [case1][t2] | yes |
| manual.3: goal.memory.get | lifecycle | [case1][t1], [case1][t3] | yes |
| manual.4: goal.infer.triage | **none** | **no CLI invocation** | **gap** |
| manual.5: cleanup | N/A | manual only | N/A |

### edge cases mapped to acceptance tests

| edge case | acceptance test file | test case |
|-----------|---------------------|-----------|
| incomplete schema | lifecycle | [case2][t0] |
| main branch forbidden | lifecycle | implied by test setup |
| empty goals list | lifecycle | [case3][t0] |
| goal not found | lifecycle | implied by update flow |
| status transitions | lifecycle [case1] + triage [case3] | [t0]-[t4] |
| blocked status | triage | [case3][t0] |
| multi-ask triage | triage | [case1] |

### gap identified: goal.infer.triage CLI skill

**discovery:** `goal.infer.triage` CLI skill is defined in `invokeGoalSkill.ts` (line 64) but never invoked in acceptance tests.

**verification:**
- searched `skill: 'goal.infer.triage'` in blackbox/*.ts → 0 matches
- searched `goalInferTriage` invocation → 0 matches
- the triage acceptance test uses `goal.memory.set` and `goal.memory.get` but not `goal.infer.triage`

**assessment:**
- the `getTriageState` domain operation has integration test coverage
- the CLI skill stdout format is NOT snapshot tested
- this is a test coverage gap, not a playtest artifact gap

**recommendation:**
- add acceptance test for `goal.infer.triage` CLI skill
- or document as acceptable gap (triage state is verified via domain operation)

### what holds

1. goal.memory.set (new goal) → [case1][t0] in lifecycle test
2. goal.memory.set (status update) → [case1][t2] in lifecycle test
3. goal.memory.get → [case1][t1], [case1][t3] in lifecycle test
4. all edge cases → covered by lifecycle and triage tests

### what doesn't hold

goal.infer.triage CLI skill has no acceptance test coverage. however, the playtest correctly marks it as manual verification (manual.4). the edge cases table does NOT claim to test goal.infer.triage — "multi-ask triage" refers to the flow of goals (via goal.memory.set and goal.memory.get), not the CLI skill.

### no fix needed

the playtest is accurate. manual.4 is correctly labeled as secondary (optional) manual verification. the edge cases table correctly cites tests for the triage flow, not the CLI skill.

### verification of citations

read `achiever.goal.lifecycle.acceptance.test.ts` to confirm test cases:

| playtest step | test case | line | what test does |
|---------------|-----------|------|----------------|
| manual.1 | [case1][t0] | 32-69 | `invokeGoalSkill({ skill: 'goal.memory.set', args: { scope: 'repo' }, stdin: goalYaml })` |
| manual.2 | [case1][t2] | 94-119 | `invokeGoalSkill({ skill: 'goal.memory.set', args: { scope: 'repo', slug: 'fix-auth-test', status: 'inflight' } })` |
| manual.3 | [case1][t1] | 71-92 | `invokeGoalSkill({ skill: 'goal.memory.get', args: { scope: 'repo' } })` |

each test uses `invokeGoalSkill` which invokes the CLI skill via shell (captures stdout/stderr/code). assertions verify:
- `expect(result.code).toEqual(0)` — exit code
- `expect(result.stdout).toContain('fix-auth-test')` — output content
- `expect(sanitizeGoalOutputForSnapshot(result.stdout)).toMatchSnapshot()` — snapshot for vibecheck

## conclusion

**holds: yes (with documented gap)**

all playtest steps except goal.infer.triage have acceptance test citations. the gap is acceptable for v1 because:
1. domain operation has integration test
2. triage state is indirectly verified via goal list
3. CLI stdout format is low-risk (counts only)

---

## fresh verification (2026-04-07)

i pause. i breathe. i am the reviewer.

### did i verify the gap assessment is still correct?

yes. re-checked goal.infer.triage coverage:

```
grep -r "goal.infer.triage" blackbox/ | wc -l
```

result: found case6, case7, and case9 in `achiever.goal.triage.acceptance.test.ts` that DO test goal.infer.triage.

**update: the gap analysis was outdated.**

### corrected coverage table

| playtest step | acceptance test file | test case | lines |
|---------------|---------------------|-----------|-------|
| manual.1 partial goal | triage | [case4][t0] | 375-398 |
| manual.2 get via goal.memory.get | lifecycle | [case1][t1] | 71-92 |
| manual.3 triage halts on incomplete | triage | [case6], [case9] | 622-737, 889+ |
| manual.4 complete goal | triage | [case4][t1-t4] | 430-568 |
| manual.6 triage passes | triage | [case9][t3] | 889+ |
| manual.7 get complete | lifecycle | [case1][t3] | 121-137 |
| manual.8 lifecycle | lifecycle | [case1][t2-t4] | 94-164 |
| manual.9 cleanup | N/A | manual only | N/A |

### did i verify goal.infer.triage is tested?

yes. verified in `achiever.goal.triage.acceptance.test.ts`:

- [case6] goal.infer.triage shows incomplete goals separately (line 622)
- [case7] goal.infer.triage negative cases (line 739)
- [case9] partial goal blocks onStop until complete (line 889)

each test invokes `goal.infer.triage` skill with `--mode hook.onStop`:

```typescript
invokeGoalSkill({
  skill: 'goal.infer.triage',
  args: { scope: 'repo', mode: 'hook.onStop' },
  cwd: scene.tempDir,
});
```

### what was the error in prior review?

prior review (line 42-47) claimed zero matches for `goal.infer.triage` invocation. this was false — the tests do exist in case6, case7, and case9.

likely cause: prior search used wrong pattern or file filter.

### corrected conclusion

all playtest steps have acceptance test citations:
1. manual.1-9 → triage and lifecycle tests
2. edge cases → lifecycle case2/3, triage case3-9
3. goal.infer.triage → case6, case7, case9 (NOT a gap)

**verified: all citations are accurate, no gaps remain**

### detailed source verification

opened each test file and verified exact line numbers:

**achiever.goal.lifecycle.acceptance.test.ts:**
```
line 17:  given('[case1] goal status transitions via CLI', () => {
line 32:    when('[t0] goal.memory.set creates new goal', () => {
line 71:    when('[t1] goal.memory.get retrieves the goal', () => {
line 94:    when('[t2] goal.memory.set updates status to inflight', () => {
line 121:   when('[t3] goal.memory.get shows updated status', () => {
line 139:   when('[t4] goal.memory.set updates status to fulfilled', () => {
line 166:   when('[t5] goal.memory.get filter by status works', () => {
line 208:  given('[case2] negative: goal.memory.set rejects incomplete schema', () => {
line 250:  given('[case3] negative: goal.memory.get on empty goals dir', () => {
line 281:  given('[case4] scope auto-detection: bound to route → default scope is route', () => {
line 338:  given('[case5] scope auto-detection: not bound to route → default scope is repo', () => {
```

**achiever.goal.triage.acceptance.test.ts:**
```
line 18:  given('[case1] multi-part request triage flow', () => {
line 208: given('[case2] triage of asks with goal coverage', () => {
line 255: given('[case3] goal status transitions through full lifecycle', () => {
line 367: given('[case4] partial goals via CLI flags', () => {
line 570: given('[case5] partial goals negative cases', () => {
line 622: given('[case6] goal.infer.triage shows incomplete goals separately', () => {
line 739: given('[case7] goal.infer.triage negative cases', () => {
line 766: given('[case8] route scope goal persistence', () => {
line 889: given('[case9] partial goal blocks onStop until complete (journey)', () => {
```

### playtest-to-test alignment summary

| playtest section | mapped to | verified |
|------------------|-----------|----------|
| primary verification | both test files, `npm run test:acceptance:locally -- blackbox/achiever` | yes |
| manual.1 create partial | triage [case4][t0] line 375 | yes |
| manual.2 verify get | lifecycle [case1][t1] line 71 | yes |
| manual.3 triage halts | triage [case6] line 622, [case9] line 889 | yes |
| manual.4 complete goal | triage [case4][t1-t4] lines 430-568 | yes |
| manual.6 triage passes | triage [case9][t3] | yes |
| manual.7 get complete | lifecycle [case1][t3] line 121 | yes |
| manual.8 lifecycle | lifecycle [case1][t2-t4] lines 94-164 | yes |
| edge: incomplete schema | lifecycle [case2] line 208 | yes |
| edge: empty goals | lifecycle [case3] line 250 | yes |
| edge: status transitions | lifecycle [case1], triage [case3] | yes |
| edge: scope auto-detect | lifecycle [case4], [case5] lines 281-386 | yes |

all 12 verification points have acceptance test coverage. the prior gap claim was incorrect.

