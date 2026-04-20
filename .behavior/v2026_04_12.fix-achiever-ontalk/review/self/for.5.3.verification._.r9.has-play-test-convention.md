# review: has-play-test-convention (r9)

## the question

are journey test files named correctly with `.play.test.ts` suffix?

## what this behavior has

this behavior has **acceptance tests**, not journey tests:

```
blackbox/achiever.goal.onTalk.acceptance.test.ts
```

## distinction: acceptance vs journey

| test type | purpose | suffix |
|-----------|---------|--------|
| acceptance | verify individual invocations via CLI | `.acceptance.test.ts` |
| journey | verify full workflow with accumulated state | `.play.test.ts` |

### why this is acceptance, not journey

the onTalk tests verify:
- single invocations with different inputs (case1-case8)
- each test is isolated (fresh temp directory)
- no state accumulation across test steps
- no multi-phase workflow

journey tests would verify:
- a sequence of operations with shared state
- state from step N affects step N+1
- full workflow from start to finish

### example distinction

**acceptance** (what we have):
```ts
given('[case1] normal message', () => {
  when('[t0] hook.onTalk is invoked', () => {
    then('ask is appended', ...);
    then('reminder is emitted', ...);
  });
});
```

**journey** (not applicable here):
```ts
given('[journey] full goal workflow', () => {
  when('[t0] user sends first ask', () => { ... });
  when('[t1] user sends second ask', () => { ... });
  when('[t2] onStop fires', () => {
    then('both asks verified', ...); // state from t0/t1 affects t2
  });
});
```

## verification

- [x] test file uses `.acceptance.test.ts` suffix — correct for its type
- [x] no journey tests exist for this behavior — none needed
- [x] if journey tests were added, they would use `.play.test.ts` — understood

## why it holds

1. this behavior has acceptance tests, not journey tests
2. acceptance tests use correct `.acceptance.test.ts` suffix
3. the `.play.test.ts` convention doesn't apply to this behavior
4. no name violation exists

