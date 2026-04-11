# self-review: behavior-declaration-coverage (r5)

## review scope

execution stone 5.1 — achiever-finishall implementation

deeper verification with specific assertion-level evidence.

## vision requirements → specific assertions

### vision: "bot tries `rm -rf .goals/` → hook blocks"

from case4 in goal.guard.acceptance.test.ts:
```typescript
invokeGoalGuard({
  toolName: 'Bash',
  toolInput: { command: 'rm -rf .goals/' },
  cwd: scene.tempDir,
});

then('exit code is 2', () => {
  expect(result.code).toEqual(2);
});

then('stderr contains blocked message', () => {
  expect(result.stderr).toContain('blocked');
  expect(result.stderr).toContain('.goals/');
});
```
**verdict:** implemented and tested.

### vision: "owl wisdom header: 'patience, friend'"

from case1 in goal.guard.acceptance.test.ts:
```typescript
then('stderr has owl wisdom', () => {
  expect(result.stderr).toContain('patience, friend');
});
```
**verdict:** implemented and tested.

### vision: "shows allowed skills list"

from case1 in goal.guard.acceptance.test.ts:
```typescript
then('stderr lists allowed skills', () => {
  expect(result.stderr).toContain('goal.memory.set');
  expect(result.stderr).toContain('goal.memory.get');
  expect(result.stderr).toContain('goal.infer.triage');
  expect(result.stderr).toContain('goal.triage.next');
});
```
**verdict:** implemented and tested.

### vision: "owl wisdom: 'to forget an ask is to break a promise'"

from case3 in goal.triage.next.acceptance.test.ts:
```typescript
then('stderr contains owl wisdom', () => {
  expect(result.stderr).toContain(
    'to forget an ask is to break a promise',
  );
});
```
**verdict:** implemented and tested.

### vision: "shows inflight goals with ✋"

from case3 in goal.triage.next.acceptance.test.ts:
```typescript
then('stderr shows inflight status', () => {
  expect(result.stderr).toContain('inflight');
});

then('stderr contains stop hand emoji', () => {
  expect(result.stderr).toContain('✋');
});
```
**verdict:** implemented and tested.

### vision: "mixed inflight+enqueued → show inflight only"

from case5 in goal.triage.next.acceptance.test.ts:
```typescript
then('stderr shows only inflight goal (priority)', () => {
  expect(result.stderr).toContain('fix-auth-test');
  expect(result.stderr).toContain('inflight');
});

then('stderr does not show enqueued goal', () => {
  expect(result.stderr).not.toContain('update-readme');
});
```
**verdict:** implemented and tested.

### vision: "exit code 2 for blocked/unfinished"

every blocked case asserts `expect(result.code).toEqual(2)`:
- goal.guard: cases 1-6, 9
- goal.triage.next: cases 3, 4, 5

**verdict:** implemented and tested.

### vision: "exit code 0 for allowed/clear"

- goal.guard case7: `expect(result.code).toEqual(0)` for safe path
- goal.guard case8: `expect(result.code).toEqual(0)` for .goals-archive
- goal.triage.next case1, 2, 6: `expect(result.code).toEqual(0)` for no goals

**verdict:** implemented and tested.

## gaps found

none. every requirement from the vision has a matched assertion.

## why it holds

the test suite covers every scenario from the vision with explicit assertions:
- block behavior verified with exit code 2 and stderr content
- allow behavior verified with exit code 0 and empty stderr
- output format verified with owl wisdom, treestruct, and snapshot
- priority logic verified with not.toContain assertions
