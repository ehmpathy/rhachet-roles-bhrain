# rule.require.repeatable-for-llm-tests

## .what

all probabilistic tests that invoke LLM brains must use `when.repeatably(REPEATABLE_CONFIG)` instead of plain `when`.

## .why

LLM responses can:
- timeout under load (especially in CI)
- vary between invocations
- fail transiently due to rate limits or network issues

retry ensures CI stability without hidden real failures.

## .pattern

```typescript
import { given, then, useThen, when } from 'test-fns';

/**
 * .what = config for probabilistic tests that invoke LLM brains
 * .why = LLM responses can timeout or vary; retry ensures CI stability
 *
 * @see .agent/repo=.this/role=any/briefs/rule.require.repeatable-for-llm-tests.md
 */
const REPEATABLE_CONFIG = {
  attempts: 3,
  criteria: process.env.CI ? 'SOME' : 'EVERY',
} as const;

describe('featureName', () => {
  given('[case1] scenario with LLM invocation', () => {
    when.repeatably(REPEATABLE_CONFIG)('[t0] operation invokes brain', () => {
      const res = useThen('invoke skill', async () => {
        return await invokeSkillThatCallsLLM({ ... });
      });

      then('assertion about result', () => {
        expect(res.outcome).toEqual('expected');
      });
    });
  });
});
```

## .criteria semantics

| value | definition |
|-------|------------|
| `'SOME'` | pass if ANY attempt succeeds (lenient, for CI) |
| `'EVERY'` | pass only if ALL attempts succeed (strict, for local) |

the config uses `'SOME'` in CI to tolerate transient failures, and `'EVERY'` locally to catch flakiness in development.

## .when to apply

apply `when.repeatably` when the test:
- invokes `invokeReviewSkill`, `stepReview`, or any review operation
- invokes `stepReflect`, `stepArticulate`, or any brain operation
- calls any function that internally invokes an LLM

## .when NOT to apply

do NOT use repeatably when the test:
- validates error conditions before LLM invocation (e.g., "zero files" error)
- tests pure logic with no LLM calls
- tests deterministic operations

## .example: case2 does not need repeatably

```typescript
// this test checks error before LLM invocation
// the error "combined scope resolves to zero files" happens before any LLM call
given('[case2] intersect mode with empty diffs', () => {
  when('[t0] no files changed, paths matches files', () => {  // plain when is correct
    // ...
    then('cli fails with zero files error', () => {
      expect(res.cli.code).not.toEqual(0);
      expect(res.cli.stderr).toContain('combined scope resolves to zero files');
    });
  });
});
```

## .enforcement

probabilistic LLM test without `when.repeatably` = **BLOCKER**

