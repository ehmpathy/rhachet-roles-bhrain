# self-review: has-preserved-test-intentions (r4)

## question

on fourth review: am I certain test intentions were preserved?

## final verification

### the key question

> "did you change what the test asserts, or fix why it failed?"

for each modified test:

| test | assertion change | why? |
|------|-----------------|------|
| getBlockedChallengeDecision.test.ts | path expectation changed | requirement changed per wish |
| setStoneAsBlocked.test.ts | path expectation changed | requirement changed per wish |
| driver.route.blocked.acceptance.test.ts | path expectation changed | requirement changed per wish |

in all cases: the test still asserts the same **type** of thing (correct blocker path). the **expected value** changed because the wish explicitly changed the requirement.

### evidence chain

1. **wish states**: "blocker explanation files should go into $route/blocker, not $route/.route/blocker"
2. **code was changed**: blocker path logic updated to use new location
3. **tests were updated**: expected paths updated to match new requirement
4. **tests pass**: code produces expected output

this is **requirement-driven** change, not **output-driven** change.

### what would a violation look like?

a violation would be:
- code produces wrong output
- test expectation changed to match wrong output
- no documented requirement for the change

that is not what happened here. the wish documents the requirement. the code and tests implement it.

## conclusion

fourth pass confirms: all test intentions preserved. changes follow documented wish requirement.
