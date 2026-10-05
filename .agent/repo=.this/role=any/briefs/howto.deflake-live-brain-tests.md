# howto.deflake-live-brain-tests

## .what

a test that drives a live brain varies run to run. one red run blocks a release. absorb the flake
at the jest layer, and clamp each real defect the flake exposes.

## .the lever — `jest.retryTimes`, declared once per env file

`jest.integration.env.ts` and `jest.acceptance.env.ts` each declare:

```ts
jest.retryTimes(2, { logErrorsBeforeRetry: true, retryImmediately: true });
```

a failed test re-runs up to twice. one pass absorbs the earlier failures, and each failure prints above
its retry, so a rescued flake stays visible.

## .why `when.repeatably(SOME)` is not the lever

test-fns reports every failed attempt as a failed jest test, so one red attempt reds the file even when
a later attempt passes. a jest timeout also fires outside any in-test wrapper, so no attempt can catch
it. measured 2026-10-05, on `openrouter/deepseek/flash`:

| shape | result |
|---|---|
| `getReviewCountsViaBrain` attempt 1 and 2 timed out at 180s, attempt 3 passed | file red: `2 failed` |
| `stepReflect.caseProseAuthor` attempt 1 threw `ENOENT`, attempts 2 and 3 passed | file red: `2 failed` |

the mechanism defect is test-fns's, tracked at `ehmpathy/test-fns#71`. a jest-level retry is the
consumer-side answer until it lands.

## .what a retry keeps

measured with a throwaway suite, then removed:

- a retried `useThen` re-runs its operation, and its dependent `then` blocks read the final result
- a retried `toMatchSnapshot` keeps its key, so `--ci` writes no new snapshot

## .the three flake shapes, and the repair each one owes

| the flake | the repair |
|---|---|
| a slow ask hits the jest timeout | the retry absorbs it. a latency bound at the tier is the cure (`ehmpathy/rhachet-brains-openrouter`) |
| a snapshot pins a word the brain varies | mask it in the sanitizer, and keep the verdict class pinned by a direct assertion |
| a real code defect the brain exposes | fix the code, and clamp it with a test that fails before the fix |

## .the cues

| when | then |
|---|---|
| a live-brain test reds once and passes on rerun | find which shape it is. a rerun is the symptom, never the repair |
| a snapshot diff shows a phrase, not a count | mask the phrase in the sanitizer |
| a `clean` fixture draws a blocker | read the fixture. a `clean` case must be clean on its face |
| you reach for `attempts` or `criteria` | stop. neither absorbs a failure |

## .see also

- `.dream/v2026_09_19.fix.the-repeatable-retry-is-decorative-because-usethen-memoizes-across-attempts.md`
- `rule.require.repeatable-for-llm-tests`
- `rule.require.clamp-edge-cases` (mechanic)
