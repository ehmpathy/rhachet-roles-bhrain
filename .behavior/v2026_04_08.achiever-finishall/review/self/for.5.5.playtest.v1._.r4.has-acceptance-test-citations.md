# self-review: has-acceptance-test-citations (r4)

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
4. quote actual assertion code to prove coverage
5. flag any gaps

---

## playtest 1: goal.triage.next shows inflight goals

### step 1: create an inflight goal

| element | citation |
|---------|----------|
| file | `blackbox/achiever.goal.triage.next.acceptance.test.ts` |
| case | `[case3] inflight goals exist` (lines 86-160) |
| setup | `createGoalYaml({ status: { choice: 'inflight', ... }})` (lines 99-113) |

**quoted evidence:**
```typescript
// line 99-113: goal creation with inflight status
const goal = createGoalYaml({
  slug: 'test-goal',
  why: { ask: 'test the inflight triage', ... },
  status: { choice: 'inflight', reason: 'test' },
  ...
});
```

### step 2: invoke goal.triage.next

| element | citation |
|---------|----------|
| file | `blackbox/achiever.goal.triage.next.acceptance.test.ts` |
| case | `[case3] inflight goals exist` |
| when | `[t0] goal.triage.next is called` (lines 125-159) |
| assertions | exit code 2, owl wisdom, slug, inflight status, stop hand |

**quoted evidence:**
```typescript
// line 134
then('exit code is 2', () => {
  expect(result.code).toEqual(2);
});

// line 138
then('stderr contains owl wisdom', () => {
  expect(result.stderr).toContain('to forget an ask is to break a promise');
});

// line 143
then('stderr shows goal slug', () => {
  expect(result.stderr).toContain('slug = test-goal');
});

// line 148
then('stderr shows inflight status', () => {
  expect(result.stderr).toContain('status = inflight');
});

// line 152
then('stderr contains stop hand emoji', () => {
  expect(result.stderr).toContain('✋');
});
```

**alignment verified:** playtest expects owl wisdom, inflight list, stop hand, exit 2. acceptance test asserts all four via `toContain()` and `toEqual()`.

---

## playtest 2: goal.triage.next shows enqueued goals

### step 1: update goal to enqueued status

| element | citation |
|---------|----------|
| file | `blackbox/achiever.goal.triage.next.acceptance.test.ts` |
| case | `[case4] enqueued goals exist but no inflight` (lines 162-232) |
| setup | `createGoalYaml({ status: { choice: 'enqueued', ... }})` (lines 175-189) |

**quoted evidence:**
```typescript
// line 175-189: goal creation with enqueued status
const goal = createGoalYaml({
  slug: 'enqueued-goal',
  why: { ask: 'test enqueued triage', ... },
  status: { choice: 'enqueued', reason: 'test' },
  ...
});
```

### step 2: invoke goal.triage.next

| element | citation |
|---------|----------|
| case | `[case4]` |
| when | `[t0] goal.triage.next is called` (lines 201-231) |
| assertions | exit code 2, owl wisdom, slug, enqueued status |

**quoted evidence:**
```typescript
// line 210
then('exit code is 2', () => {
  expect(result.code).toEqual(2);
});

// line 214
then('stderr contains owl wisdom', () => {
  expect(result.stderr).toContain('to forget an ask is to break a promise');
});

// line 224
then('stderr shows enqueued status', () => {
  expect(result.stderr).toContain('status = enqueued');
});
```

**alignment verified:** playtest expects enqueued (not inflight), exit 2. acceptance test asserts enqueued status and exit 2.

---

## playtest 3: goal.triage.next is silent when no goals

### step 1: mark goal as fulfilled

| element | citation |
|---------|----------|
| file | `blackbox/achiever.goal.triage.next.acceptance.test.ts` |
| case | `[case6] all goals are fulfilled` (lines 320-374) |
| setup | `createGoalYaml({ status: { choice: 'fulfilled', ... }})` (lines 333-344) |

### step 2: invoke goal.triage.next

| element | citation |
|---------|----------|
| case | `[case6]` |
| when | `[t0] goal.triage.next is called` (lines 356-373) |
| assertions | exit code 0, silent output |

**quoted evidence:**
```typescript
// line 365
then('exit code is 0', () => {
  expect(result.code).toEqual(0);
});

// line 369
then('output is silent (all goals complete)', () => {
  expect(result.stderr.trim()).toEqual('');
  expect(result.stdout.trim()).toEqual('');
});
```

**alignment verified:** playtest expects silence and exit 0. acceptance test asserts both stdout and stderr are empty, exit 0.

---

## playtest 4: goal.guard blocks direct .goals/ access

### step 1: simulate Read tool on .goals/ path

| element | citation |
|---------|----------|
| file | `blackbox/achiever.goal.guard.acceptance.test.ts` |
| case | `[case1] Read tool with .goals/ path` (lines 14-50) |
| when | `[t0] path is .goals/branch/file.yaml` (lines 17-49) |
| assertions | exit code 2, blocked message, owl wisdom, skills list |

**quoted evidence:**
```typescript
// line 26
then('exit code is 2', () => {
  expect(result.code).toEqual(2);
});

// line 30
then('stderr contains blocked message', () => {
  expect(result.stderr).toContain('blocked: direct access to .goals/ is forbidden');
});

// line 35
then('stderr has owl wisdom', () => {
  expect(result.stderr).toContain('patience, friend');
});

// line 39-46: verifies all 4 skills are listed
then('stderr lists allowed skills', () => {
  expect(result.stderr).toContain('goal.memory.set');
  expect(result.stderr).toContain('goal.memory.get');
  expect(result.stderr).toContain('goal.infer.triage');
  expect(result.stderr).toContain('goal.triage.next');
});
```

**alignment verified:** playtest expects block message, skills list, exit 2. acceptance test asserts each skill name and exit 2.

---

## playtest 5: goal.guard allows safe paths

### step 1: simulate Read tool on safe path

| element | citation |
|---------|----------|
| file | `blackbox/achiever.goal.guard.acceptance.test.ts` |
| case | `[case7] safe path that does not contain .goals/` (lines 163-187) |
| when | `[t0] path is src/index.ts` (lines 166-186) |
| assertions | exit code 0, stderr empty, stdout empty |

**quoted evidence:**
```typescript
// line 175
then('exit code is 0', () => {
  expect(result.code).toEqual(0);
});

// line 179
then('stderr is empty', () => {
  expect(result.stderr.trim()).toEqual('');
});
```

### step 2: simulate Read tool on .goals-archive path

| element | citation |
|---------|----------|
| file | `blackbox/achiever.goal.guard.acceptance.test.ts` |
| case | `[case8] .goals-archive path (similar name, different dir)` (lines 189-209) |
| when | `[t0] path is .goals-archive/old.yaml` (lines 192-208) |
| assertions | exit code 0, operation allowed |

**quoted evidence:**
```typescript
// line 201
then('exit code is 0 (not a false positive)', () => {
  expect(result.code).toEqual(0);
});

// line 205
then('operation is allowed', () => {
  expect(result.stderr.trim()).toEqual('');
});
```

**alignment verified:** playtest expects no false positives for .goals-archive. acceptance test explicitly names this as "not a false positive".

---

## playtest 6: goal.guard blocks Bash rm on .goals/

### step 1: simulate Bash rm on .goals/

| element | citation |
|---------|----------|
| file | `blackbox/achiever.goal.guard.acceptance.test.ts` |
| case | `[case4] Bash tool with rm command on .goals/` (lines 96-117) |
| when | `[t0] command is rm -rf .goals/` (lines 99-116) |
| assertions | exit code 2, blocked message |

**quoted evidence:**
```typescript
// line 108
then('exit code is 2', () => {
  expect(result.code).toEqual(2);
});

// line 112
then('stderr contains blocked message', () => {
  expect(result.stderr).toContain('blocked: direct access to .goals/ is forbidden');
});
```

**alignment verified:** playtest expects block with same message as Read tool. acceptance test asserts identical blocked message.

---

## coverage beyond playtest

these behaviors are tested in acceptance but not in playtest:

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

## assertion-level proof

### exit code assertions

| playtest | expects | acceptance test line | quoted |
|----------|---------|---------------------|--------|
| 1 | exit 2 | line 134 | `expect(result.code).toEqual(2)` |
| 2 | exit 2 | line 210 | `expect(result.code).toEqual(2)` |
| 3 | exit 0 | line 365 | `expect(result.code).toEqual(0)` |
| 4 | exit 2 | line 26 | `expect(result.code).toEqual(2)` |
| 5 | exit 0 | line 175, 201 | `expect(result.code).toEqual(0)` |
| 6 | exit 2 | line 108 | `expect(result.code).toEqual(2)` |

### content assertions

all content checks use `toContain()` to verify the expected text exists in stderr.

| playtest element | test asserts | method |
|------------------|--------------|--------|
| owl wisdom | text appears in stderr | `toContain('to forget an ask')` |
| stop hand | emoji appears | `toContain('✋')` |
| inflight status | status text appears | `toContain('status = inflight')` |
| enqueued status | status text appears | `toContain('status = enqueued')` |
| blocked message | message appears | `toContain('blocked: direct access')` |
| skills list | each skill name appears | `toContain('goal.memory.set')` etc. |

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
   - specific assertions quoted

4. **assertion code quoted:**
   - exact `expect()` calls shown
   - proves test verifies the behavior
   - not just "a test exists" but "the test checks X"

5. **no gaps identified:**
   - all playtest behaviors verified by acceptance tests
   - all behaviors testable via automation

the playtest and acceptance tests are aligned. each playtest step has verifiable acceptance test coverage with quoted assertion code.

