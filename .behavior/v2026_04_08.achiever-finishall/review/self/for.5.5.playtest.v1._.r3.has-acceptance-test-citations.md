# self-review: has-acceptance-test-citations (r3)

## review scope

playtest stone 5.5 — cite acceptance test for each playtest step

---

## the guide

> coverage check: cite the acceptance test for each playtest step.
>
> for each step in the playtest:
> - which acceptance test file verifies this behavior?
> - which specific test case (given/when/then) covers it?
> - cite the exact file path and test name
>
> if a step lacks acceptance test coverage:
> - is this a gap that needs a new test?
> - or is this behavior untestable via automation?

---

## method

1. enumerate each playtest step
2. find the acceptance test that covers it
3. cite file path, case number, and test name
4. flag any gaps

---

## playtest 1: goal.triage.next shows inflight goals

### step 1: create an inflight goal

| element | citation |
|---------|----------|
| file | `blackbox/achiever.goal.triage.next.acceptance.test.ts` |
| case | `[case3] inflight goals exist` (lines 86-160) |
| test | `createGoalYaml({ status: { choice: 'inflight', ... }})` (lines 99-113) |

**evidence:** acceptance test creates inflight goal via `invokeGoalSkill` with same mechanism as playtest.

### step 2: invoke goal.triage.next

| element | citation |
|---------|----------|
| file | `blackbox/achiever.goal.triage.next.acceptance.test.ts` |
| case | `[case3] inflight goals exist` |
| when | `[t0] goal.triage.next is called` (lines 125-159) |
| assertions | exit code 2, owl wisdom, slug, inflight status, stop hand, snapshot |

**evidence:**
- line 134: `then('exit code is 2', () => expect(result.code).toEqual(2))`
- line 138: `then('stderr contains owl wisdom', ...)`
- line 148: `then('stderr shows inflight status', ...)`
- line 152: `then('stderr contains stop hand emoji', ...)`

---

## playtest 2: goal.triage.next shows enqueued goals

### step 1: update goal to enqueued status

| element | citation |
|---------|----------|
| file | `blackbox/achiever.goal.triage.next.acceptance.test.ts` |
| case | `[case4] enqueued goals exist but no inflight` (lines 162-232) |
| test | `createGoalYaml({ status: { choice: 'enqueued', ... }})` (lines 175-189) |

### step 2: invoke goal.triage.next

| element | citation |
|---------|----------|
| case | `[case4]` |
| when | `[t0] goal.triage.next is called` (lines 201-231) |
| assertions | exit code 2, owl wisdom, slug, enqueued status, snapshot |

**evidence:**
- line 210: `then('exit code is 2', ...)`
- line 214: `then('stderr contains owl wisdom', ...)`
- line 224: `then('stderr shows enqueued status', ...)`

---

## playtest 3: goal.triage.next is silent when no goals

### step 1: mark goal as fulfilled

| element | citation |
|---------|----------|
| file | `blackbox/achiever.goal.triage.next.acceptance.test.ts` |
| case | `[case6] all goals are fulfilled` (lines 320-374) |
| test | `createGoalYaml({ status: { choice: 'fulfilled', ... }})` (lines 333-344) |

### step 2: invoke goal.triage.next

| element | citation |
|---------|----------|
| case | `[case6]` |
| when | `[t0] goal.triage.next is called` (lines 356-373) |
| assertions | exit code 0, silent output |

**evidence:**
- line 365: `then('exit code is 0', ...)`
- line 369: `then('output is silent (all goals complete)', ...)`

---

## playtest 4: goal.guard blocks direct .goals/ access

### step 1: simulate Read tool on .goals/ path

| element | citation |
|---------|----------|
| file | `blackbox/achiever.goal.guard.acceptance.test.ts` |
| case | `[case1] Read tool with .goals/ path` (lines 14-50) |
| when | `[t0] path is .goals/branch/file.yaml` (lines 17-49) |
| assertions | exit code 2, blocked message, owl wisdom, skills list, snapshot |

**evidence:**
- line 26: `then('exit code is 2', ...)`
- line 30: `then('stderr contains blocked message', ...)`
- line 35: `then('stderr has owl wisdom', ...)`
- line 39: `then('stderr lists allowed skills', ...)` — verifies all 4 skills

---

## playtest 5: goal.guard allows safe paths

### step 1: simulate Read tool on safe path

| element | citation |
|---------|----------|
| file | `blackbox/achiever.goal.guard.acceptance.test.ts` |
| case | `[case7] safe path that does not contain .goals/` (lines 163-187) |
| when | `[t0] path is src/index.ts` (lines 166-186) |
| assertions | exit code 0, stderr empty, stdout empty |

**evidence:**
- line 175: `then('exit code is 0', ...)`
- line 179: `then('stderr is empty', ...)`

### step 2: simulate Read tool on .goals-archive path

| element | citation |
|---------|----------|
| file | `blackbox/achiever.goal.guard.acceptance.test.ts` |
| case | `[case8] .goals-archive path (similar name, different dir)` (lines 189-209) |
| when | `[t0] path is .goals-archive/old.yaml` (lines 192-208) |
| assertions | exit code 0, operation allowed |

**evidence:**
- line 201: `then('exit code is 0 (not a false positive)', ...)`
- line 205: `then('operation is allowed', ...)`

---

## playtest 6: goal.guard blocks Bash rm on .goals/

### step 1: simulate Bash rm on .goals/

| element | citation |
|---------|----------|
| file | `blackbox/achiever.goal.guard.acceptance.test.ts` |
| case | `[case4] Bash tool with rm command on .goals/` (lines 96-117) |
| when | `[t0] command is rm -rf .goals/` (lines 99-116) |
| assertions | exit code 2, blocked message |

**evidence:**
- line 108: `then('exit code is 2', ...)`
- line 112: `then('stderr contains blocked message', ...)`

---

## additional acceptance test coverage not in playtest

these behaviors are tested in acceptance tests but not in playtest:

| behavior | acceptance test case | playtest? |
|----------|---------------------|-----------|
| Write tool blocked | [case2] lines 52-72 | no |
| Edit tool blocked | [case3] lines 74-94 | no |
| Bash cat blocked | [case5] lines 119-139 | no |
| Bash mv blocked | [case6] lines 141-161 | no |
| route-scoped .goals/ blocked | [case9] lines 211-232 | no |
| Bash safe command allowed | [case10] lines 234-254 | no |
| no .goals/ directory | triage [case1] lines 17-47 | no |
| empty .goals/ directory | triage [case2] lines 49-84 | no |
| mixed inflight+enqueued | triage [case5] lines 234-318 | no |

**verdict:** playtest covers happy paths. acceptance tests cover all edge cases. no gaps.

---

## gap analysis

### gaps that need new tests?

none. all playtest behaviors are covered by acceptance tests.

### behaviors untestable via automation?

none. all behaviors are deterministic and testable.

---

## citation summary table

| playtest | behavior | acceptance test file | case | lines |
|----------|----------|---------------------|------|-------|
| 1.1 | create inflight goal | ...goal.triage.next... | [case3] | 86-123 |
| 1.2 | show inflight, exit 2 | ...goal.triage.next... | [case3] | 125-159 |
| 2.1 | update to enqueued | ...goal.triage.next... | [case4] | 162-199 |
| 2.2 | show enqueued, exit 2 | ...goal.triage.next... | [case4] | 201-231 |
| 3.1 | mark fulfilled | ...goal.triage.next... | [case6] | 320-354 |
| 3.2 | silent, exit 0 | ...goal.triage.next... | [case6] | 356-373 |
| 4.1 | Read .goals/ blocked | ...goal.guard... | [case1] | 14-50 |
| 5.1 | safe path allowed | ...goal.guard... | [case7] | 163-187 |
| 5.2 | .goals-archive allowed | ...goal.guard... | [case8] | 189-209 |
| 6.1 | Bash rm blocked | ...goal.guard... | [case4] | 96-117 |

---

## why it holds

1. **every playtest step has an acceptance test:**
   - triage playtests 1-3: covered by cases 3, 4, 6
   - guard playtests 4-6: covered by cases 1, 4, 7, 8

2. **acceptance tests are more comprehensive:**
   - 10 goal.guard cases vs 3 playtest scenarios
   - 6 goal.triage.next cases vs 3 playtest scenarios

3. **citations are traceable:**
   - file paths provided
   - case numbers provided
   - line numbers provided
   - specific assertions cited

4. **no gaps identified:**
   - all playtest behaviors verified by acceptance tests
   - all behaviors testable via automation

the playtest and acceptance tests are aligned. each playtest step has verifiable acceptance test coverage.

