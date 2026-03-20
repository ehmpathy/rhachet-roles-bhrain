# self-review: has-play-test-convention (r10)

## question

on tenth review: are journey test files named correctly?

## what is a journey test?

a journey test verifies a full user workflow from start to finish:
- multiple steps in sequence
- state that accumulates across steps
- end-to-end user experience

convention: `feature.play.test.ts` or `feature.play.{runner}.test.ts`

## files changed in this fix

| file | type | is journey? |
|------|------|------------|
| `getBlockedChallengeDecision.test.ts` | unit | no |
| `setStoneAsBlocked.test.ts` | unit | no |
| `route.mutate.guard.integration.test.ts` | integration | no |
| `driver.route.mutate.acceptance.test.ts` | acceptance | no |
| `driver.route.blocked.acceptance.test.ts` | acceptance | no |

## why these are not journey tests

the tests added are scenario-based tests within runners:
- unit tests verify isolated logic
- integration tests verify guard behavior with subprocess
- acceptance tests verify feature through blackbox invocation

none of them represent full user workflows from start to finish.

## what a journey test would look like

```
given('[journey] declapract.upgrade route')
  when('[t0] route is bound')
    then('artifacts can be written')
  when('[t1] metadata write attempted')
    then('guard blocks with guidance')
  when('[t2] privilege granted')
    then('metadata write allowed')
  when('[t3] stone passed')
    then('route progresses')
```

this fix does not include such a test.

## convention compliance

| convention | applicable? | compliant? |
|-----------|-------------|------------|
| `.play.test.ts` | no (no journey tests) | n/a |
| `.test.ts` | yes (unit tests) | yes |
| `.integration.test.ts` | yes | yes |
| `.acceptance.test.ts` | yes | yes |

## conclusion

no journey tests added. all test files use correct runner conventions.
