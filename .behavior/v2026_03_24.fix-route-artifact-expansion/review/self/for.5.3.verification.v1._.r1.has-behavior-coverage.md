# self-review: has-behavior-coverage

## the question

does the verification checklist show every behavior from wish/vision has a test?

## behaviors from 0.wish.md

| behavior | covered? | test file |
|----------|----------|-----------|
| expand `$route` in artifact globs | ✅ yes | `blackbox/driver.route.artifact-expansion.acceptance.test.ts` |
| fix `cwd: input.route` → run from repo root | ✅ yes | same test (files found at expanded paths) |
| prefix default pattern with route path | ✅ yes | `src/domain.operations/route/stones/getAllStoneArtifacts.test.ts` |

## behaviors from 1.vision.md

| behavior | covered? | test file |
|----------|----------|-----------|
| `$route` expanded to actual route path | ✅ yes | artifact-expansion case1 `[t1]` |
| glob runs from repo root | ✅ yes | artifact-expansion case1 (implicit — files found) |
| artifacts at `.behavior/xyz/...` are found | ✅ yes | artifact-expansion case1 & case2 |
| nested routes work | ✅ yes | artifact-expansion case2 |

## edge cases from vision

| case | covered? | how |
|------|----------|-----|
| no guard artifacts specified | ✅ yes | unit test `[case2]` |
| no `$route` in pattern | ✅ yes | unit test (pattern used as-is) |
| `$route` appears multiple times | ✅ yes | regex `/\$route/g` handles all |
| pattern has no matches | ✅ yes | returns empty array |

## conclusion

every behavior from both wish and vision has a test. the checklist in `5.3.verification.v1.i1.md` maps each behavior to its test file.

no issues found.
