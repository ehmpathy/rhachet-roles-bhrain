# self-review: has-preserved-test-intentions (r3)

## question

on third review, with fresh eyes: are all test intentions truly preserved?

## systematic re-examination

### what does "preserve intent" mean?

a test has an intent — the behavior it verifies. to preserve intent means:
1. the test still verifies the same behavior
2. no assertions were weakened
3. no test cases were removed
4. expected values changed only when requirements changed

### review each modified file

#### getBlockedChallengeDecision.test.ts

**original intent**: verify that blocked challenge decisions produce the correct articulation path

**change made**: path expectation from `.route/blocker/` to `blocker/`

**intent preserved?** yes — still verifies correct path. the "correct path" definition changed per wish.

#### setStoneAsBlocked.test.ts

**original intent**: verify stone blocked state produces articulation at correct location

**change made**: path expectation from `.route/blocker/` to `blocker/`

**intent preserved?** yes — same logic as above.

#### driver.route.blocked.acceptance.test.ts

**original intent**: verify end-to-end blocker flow writes to correct location

**change made**: fixture setup and assertions for new path

**intent preserved?** yes — still tests the same e2e flow.

### forbidden pattern check (third pass)

| forbidden | evidence of violation? |
|-----------|----------------------|
| weaken assertions | no — same assertion strictness |
| remove test cases | no — all cases present |
| match broken output | no — output changed intentionally per wish |
| delete tests | no — all tests remain |

## conclusion

verified on third pass: all test intentions preserved. the only changes are path expectations that follow the explicit wish requirement.
