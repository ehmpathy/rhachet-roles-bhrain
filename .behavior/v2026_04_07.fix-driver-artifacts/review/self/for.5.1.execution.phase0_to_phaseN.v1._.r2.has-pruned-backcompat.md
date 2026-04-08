# backwards compat review (r2): yield artifact pattern

## slow review process

1. read `asArtifactByPriority.ts` line by line
2. checked each pattern against wish/vision/criteria
3. grepped codebase for usage evidence

## backwards compat elements

| element | location | explicitly requested? |
|---------|----------|----------------------|
| `.v1.i1.md` pattern | asArtifactByPriority.ts:24 | yes (wish, vision, criteria) |
| `.i1.md` pattern | asArtifactByPriority.ts:25 | no |
| legacy glob | getAllStoneArtifacts.ts:22 | yes (wish) |
| legacy glob | getAllStoneDriveArtifacts.ts:25 | yes (wish) |

## `.i1.md` pattern - deep analysis

### was it requested?
no. the wish mentions `.v1.i1.md` but not `.i1.md`.

### why was it added?
test fixtures use `.i1.md` pattern extensively:

```
blackbox/driver.route.failsafe.acceptance.test.ts:41: '1.review-pass.i1.md'
blackbox/driver.route.failsafe.acceptance.test.ts:85: '2.review-constraint.i1.md'
blackbox/driver.route.drive.acceptance.test.ts:122: '1.stone.i1.md'
blackbox/driver.route.drive.acceptance.test.ts:180: '1.stone.i1.md'
blackbox/driver.route.blocked.acceptance.test.ts:37: '1.design.i1.md'
blackbox/driver.route.self-review.acceptance.test.ts:70: '1.stone.i1.md'
... (20+ occurrences)
```

### verdict
the `.i1.md` pattern is NOT explicitly requested in wish/vision/criteria.
however, to remove it would break 20+ test fixtures.

**open question for wisher:**
should `.i1.md` support be:
1. kept (implicit backwards compat for test fixtures)
2. removed (and test fixtures updated to use `.v1.i1.md` or `.yield.md`)

## `.v1.i1.md` pattern - verification

wish states:
> "we want to support the priors as artifacts by default too (.v1.i1.md)"

✅ explicitly requested

## legacy globs - verification

wish states:
> "we want to support the priors as artifacts by default too"

vision states:
> "backwards compat required - `.v1.i1.md` remains a valid artifact pattern"

✅ explicitly requested

## conclusion

| element | status | action |
|---------|--------|--------|
| `.v1.i1.md` | explicitly requested | keep |
| `.i1.md` | NOT requested | **open question** |
| legacy globs | explicitly requested | keep |

**found:** `.i1.md` support was added without explicit request. flagged as open question.
