# self-review: has-play-test-convention

## the question

are journey test files named correctly?

## no journey tests exist

this repo has no `.play.test.ts` files. the glob pattern `**/*.play.*.ts` returns no matches.

## why journey tests are not appropriate

this is a bug fix to a pure function (`getAllStoneArtifacts`):
- single transformation: expand `$route` in glob patterns
- no multi-step user flow
- no state progression to test

journey tests verify sequential user actions over time. this fix is a single function correction with no temporal aspect.

## the test coverage

the fix is verified by:

| test type | file | coverage |
|-----------|------|----------|
| unit | `getAllStoneArtifacts.test.ts` | $route expansion logic |
| acceptance | `driver.route.artifact-expansion.acceptance.test.ts` | end-to-end artifact detection |

both test types pass. complete coverage without journey tests.

## criterion disposition

| assessment | value |
|------------|-------|
| journey tests exist? | no |
| journey tests needed? | no |
| `.play.test.ts` files? | 0 |
| criterion applicable? | no |
| verdict | n/a |

## conclusion

this criterion is n/a because:
1. the repo uses no `.play.test.ts` convention
2. this is a bug fix to a pure function
3. unit and acceptance tests provide complete coverage
4. journey tests would add no value for a stateless transformation
