# self-review: has-preserved-test-intentions (r1)

## question

did I preserve the intent of every test I touched?

## examination

### tests added (no prior intent to preserve)

| file | change type |
|------|-------------|
| route.mutate.guard.integration.test.ts | added [case7], [case8] for `.route/xyz/` routes |
| driver.route.mutate.acceptance.test.ts | added [case7] for `.route/xyz/` route journey |

these are **new test cases** — they add coverage for the new behavior. no prior intent exists to preserve.

### tests modified (intent analysis)

| file | change | intent preserved? |
|------|--------|-------------------|
| getBlockedChallengeDecision.test.ts | blocker path `.route/blocker/` → `blocker/` | yes — deliberate per wish |
| setStoneAsBlocked.test.ts | blocker path updated | yes — follows wish requirement |
| driver.route.blocked.acceptance.test.ts | blocker path updated | yes — follows wish requirement |

### why blocker path changes preserve intent

the wish explicitly states:

> "lets add the requirement that the blocker explanation files should go into $route/blocker, not $route/.route/blocker"

the test changes implement this requirement. the tests still verify:
- blockers are written to the correct path
- blocker content is correct
- blocker flow works end-to-end

the **intent** (verify blocker path and content) is preserved. the **expected path** changed per documented requirement.

### forbidden patterns check

| forbidden | present? |
|-----------|----------|
| weaken assertions to make tests pass | no |
| remove test cases that "no longer apply" | no |
| change expected values to match broken output | no |
| delete tests that fail instead of fix code | no |

## conclusion

all modified tests preserve their original intent:
- new tests add coverage (no prior intent)
- blocker path changes follow explicit wish requirement
- no assertions weakened, no tests removed
