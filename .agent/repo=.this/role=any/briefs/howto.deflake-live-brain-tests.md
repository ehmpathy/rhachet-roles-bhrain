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

## .the second lever — `when.repeatably(SOME)`, patched

unpatched test-fns@1.15.7 has two holes, and either one reds the file even when a later attempt passes:

| hole | why the wrapper misses it |
|---|---|
| a `useBeforeAll` setup throws | it runs in a `beforeAll`, so jest fails every test in the attempt |
| an attempt outlives the jest timeout | the timeout fires outside any try/catch |

measured 2026-10-05, on `openrouter/deepseek/flash`:

| shape | result, unpatched |
|---|---|
| `getReviewCountsViaBrain` attempt 1 and 2 timed out at 180s, attempt 3 passed | file red: `2 failed` |
| `stepReflect.caseProseAuthor` attempt 1 threw `ENOENT`, attempts 2 and 3 passed | file red: `2 failed` |

`patches/test-fns@1.15.7.patch` closes both. it races each attempt against the `jest.setTimeout`
budget less 1s, and a failed setup now fails only its own attempt. the clamp is
`src/infra/test/repeatablyAbsorbsFailedAttempts.test.ts`: red on the unpatched copy, green on the patch.

🟡 the race needs `jest.setTimeout` to be declared. a config-only `testTimeout` is invisible to it, so
the attempt runs unraced. drop the patch once `ehmpathy/test-fns#71` ships a fix.

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
| you raise `attempts` to beat a flake | it absorbs only with the patch in place, and only within a `jest.setTimeout` budget |
| you upgrade test-fns | check `ehmpathy/test-fns#71`; a version bump orphans the patch and pnpm install fails loud |

## .see also

- `.dream/v2026_09_19.fix.the-repeatable-retry-is-decorative-because-usethen-memoizes-across-attempts.md`
- `rule.require.repeatable-for-llm-tests`
- `rule.require.clamp-edge-cases` (mechanic)
