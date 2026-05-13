# feature request: timeout option for repeatably

## problem

`when.repeatably(REPEATABLE_CONFIG)` for probabilistic LLM tests:
- jest has a default 90s timeout per test
- if attempt 1 takes >90s, jest kills the test BEFORE test-fns can try attempt 2
- `criteria: 'SOME'` never gets to use subsequent attempts

observed failure:
```
review.representative-dirty.acceptance.test.ts
  timeout of 90000ms exceeded
```

## requested feature

add `timeout` option to repeatably config:

```ts
when.repeatably({
  attempts: 3,
  criteria: 'SOME',
  timeout: 180_000, // per-attempt timeout in ms
})('[t0] llm generates response', () => {
  // ...
});
```

behavior:
- sets `jest.setTimeout(timeout)` for the describe block
- OR wraps each attempt with Promise.race timeout to enable test-fns retry logic

## why this matters

LLM operations can take 60-120s based on load. the 90s jest timeout is reasonable for most tests but breaks probabilistic retry patterns.

## workaround

for now, manually add `jest.setTimeout(180_000)` at the top of test files that invoke LLMs.

## alternative: withTimeout wrapper

export a `withTimeout(fn, ms)` wrapper that users can apply inside useThen:

```ts
const result = useThen('invoke skill', async () =>
  withTimeout(
    () => invokeReviewSkill({ ... }),
    120_000, // timeout before retry kicks in
  ),
);
```

this would timeout and throw early, which enables test-fns to catch and retry on subsequent attempts.
