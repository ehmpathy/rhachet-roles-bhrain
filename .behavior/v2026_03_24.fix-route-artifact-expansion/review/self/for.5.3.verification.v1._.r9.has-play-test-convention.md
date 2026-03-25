# self-review: has-play-test-convention

## the question

are journey test files named correctly?

## no journey tests exist

this repo has no `.play.test.ts` files. this is not an oversight.

## why journey tests are not appropriate here

this is a bug fix to `getAllStoneArtifacts`:
- pure function: input → output
- single transformation: expand `$route` in glob patterns
- no multi-step flow to test

journey tests verify multi-step user flows. this fix is a single function correction.

## test coverage

the fix is covered by:
- unit tests in `getAllStoneArtifacts.test.ts`
- acceptance tests in `driver.route.artifact-expansion.acceptance.test.ts`

both verify the fix works. journey tests would add no value.

## criterion disposition

| assessment | value |
|------------|-------|
| journey tests exist? | no |
| journey tests needed? | no |
| criterion applicable? | no |
| verdict | n/a |

## conclusion

this criterion is n/a. no journey tests exist because:
1. this is a bug fix, not a multi-step feature
2. unit and acceptance tests provide complete coverage
3. journey tests would not add value for a pure function fix
