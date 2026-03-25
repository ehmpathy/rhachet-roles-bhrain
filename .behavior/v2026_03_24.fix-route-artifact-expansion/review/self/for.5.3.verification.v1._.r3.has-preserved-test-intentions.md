# self-review: has-preserved-test-intentions

## the question

did you preserve test intentions?
- what did each test verify before?
- does it still verify the same behavior after?
- did you change what the test asserts, or fix why it failed?

## test files touched

7 test files were modified in this PR:

| file | change type |
|------|-------------|
| `getAllStoneArtifacts.test.ts` | fixture update |
| `parseStoneGuard.test.ts` | fixture update |
| `stepRouteStoneSet.integration.test.ts` | fixture update |
| `setStoneAsPassed.test.ts` | fixture update |
| `setStoneAsPassed.integration.test.ts` | fixture update |
| `driver.route.bounce.acceptance.test.ts` | fixture update |
| `driver.route.escape-hatch.acceptance.test.ts` | fixture update |

## analysis

### what changed

every test change follows the same pattern:
- artifact patterns in fixtures changed from `1.design*.md` to `"$route/1.design*.md"`
- this aligns fixtures with the $route expansion feature

### intentions preserved

| before | after | intention |
|--------|-------|-----------|
| `artifacts: ['1.test*.md']` | `artifacts: ['$route/1.test*.md']` | same: verify artifacts are found |
| guards detect artifacts | guards detect artifacts | same: guard behavior works |
| route proceeds when artifacts present | route proceeds when artifacts present | same: passage logic |

### what was NOT done

- no assertions weakened
- no test cases removed
- no expected values changed to match broken output
- no tests deleted instead of code fixed

### why these changes are valid

the fix changes HOW artifacts are found (via $route expansion), not WHAT the tests verify. the test intentions remain:
1. verify guard parse works
2. verify artifact detection works
3. verify route passage logic works

the fixtures now use $route because that's the documented way to reference route-relative paths.

## conclusion

all test intentions preserved. changes are fixture updates to exercise the $route expansion feature, not weakened assertions.
