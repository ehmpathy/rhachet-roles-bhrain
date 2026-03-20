# self-review: has-behavior-coverage (r1)

## question

does the verification checklist show every behavior from wish/vision has a test?

## verification

### behaviors from 0.wish.md

| behavior | test coverage |
|----------|---------------|
| writes to .route/xyz allowed when bound | integration [case8] t0, t1; acceptance [case7] t0 |
| writes to .route/xyz/.route blocked | integration [case8] t2, t3; acceptance [case7] t1 |
| blockers go to $route/blocker/ | getBlockedChallengeDecision.test.ts [case3]; driver.route.blocked.acceptance.test.ts |

### behaviors from 1.vision.md

| behavior | test coverage |
|----------|---------------|
| allow artifact writes to bound route at .route/ | integration [case8] t0, t1 |
| block metadata writes to .route/ subdirectory | integration [case8] t2, t3 |
| move blockers to $route/blocker/ | unit test path assertions; acceptance blocker flow |
| backwards compatible with .behavior/ routes | integration [case1]-[case7]; acceptance [case1]-[case6] |
| stone/guard protection unchanged | integration [case1] t0, t1; acceptance [case1] t0, t1 |

### test file to behavior map

| test file | behaviors covered |
|-----------|-------------------|
| route.mutate.guard.integration.test.ts | artifact writes, metadata blocks, stone/guard protection, backwards compat |
| driver.route.mutate.acceptance.test.ts | artifact writes, metadata blocks, privilege management |
| getBlockedChallengeDecision.test.ts | blocker path at $route/blocker/ |
| setStoneAsBlocked.test.ts | blocker path assertions |
| driver.route.blocked.acceptance.test.ts | blocker flow with new path |

## conclusion

all behaviors from wish and vision are covered by tests:
- 3 behaviors from wish: all covered
- 5 behaviors from vision: all covered
- can point to specific test files and cases for each
