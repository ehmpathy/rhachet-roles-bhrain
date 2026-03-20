# self-review: has-preserved-test-intentions (r2)

## question

on second review: did I truly preserve the intent of every test I modified?

## deeper analysis

### categorize each test change

| category | files | assessment |
|----------|-------|------------|
| new tests | route.mutate.guard.integration.test.ts [case7, case8] | no prior intent — additive |
| new tests | driver.route.mutate.acceptance.test.ts [case7] | no prior intent — additive |
| path change | getBlockedChallengeDecision.test.ts | intent preserved, path updated per wish |
| path change | setStoneAsBlocked.test.ts | intent preserved, path updated per wish |
| path change | driver.route.blocked.acceptance.test.ts | intent preserved, path updated per wish |

### blocker path change analysis

the original test intent:
> verify that blocker articulations are written to the correct path

the change:
- before: expected path `$route/.route/blocker/stone.md`
- after: expected path `$route/blocker/stone.md`

the intent (verify correct path) is preserved. the **expected value** changed because the **requirement** changed.

this is NOT:
- "weakened assertions" — same strictness, different expected value
- "removed test cases" — all cases remain
- "matched broken output" — code was changed to produce new correct output
- "deleted tests that fail" — no tests deleted

### the wish explicitly changed the requirement

from 0.wish.md:
> "lets add the requirement that the blocker explanation files should go into $route/blocker, not $route/.route/blocker"

the tests now verify the new requirement. this is requirement-driven change, not output-driven change.

## conclusion

all test intentions preserved. path changes follow explicit wish requirement.
