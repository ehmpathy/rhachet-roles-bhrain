# self-review: has-play-test-convention (r9)

## question

on ninth review: are journey tests named correctly?

## test files in this fix

| file | type |
|------|------|
| `route.mutate.guard.integration.test.ts` | integration |
| `driver.route.mutate.acceptance.test.ts` | acceptance |
| `driver.route.blocked.acceptance.test.ts` | acceptance |
| `getBlockedChallengeDecision.test.ts` | unit |
| `setStoneAsBlocked.test.ts` | unit |

## journey tests

no journey tests were added in this fix.

the blueprint specified:
- [case7] and [case8] as **integration** tests
- [case7] as **acceptance** test

these are scenario-based tests within the integration and acceptance runners, not standalone journey tests.

## convention compliance

the `.play.test.ts` convention applies to journey tests. since this fix adds no journey tests, the convention is not applicable.

## conclusion

no journey tests added. extant test files use correct runner conventions (`.integration.test.ts`, `.acceptance.test.ts`, `.test.ts`).
