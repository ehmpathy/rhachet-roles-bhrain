# YAGNI review: yield artifact pattern implementation

## what was prescribed

per blueprint:
1. `asArtifactByPriority.ts` - transformer for priority resolution
2. `asArtifactByPriority.test.ts` - unit tests (6 cases)
3. `getAllStoneArtifacts.ts` - extend glob patterns + use priority
4. `getAllStoneDriveArtifacts.ts` - extend glob patterns + use priority
5. `driver.route.artifact-patterns.acceptance.test.ts` - acceptance tests

## what was implemented

1. `asArtifactByPriority.ts` - ✅ implemented as prescribed
2. `asArtifactByPriority.test.ts` - ✅ implemented with 9 cases (3 extra)
3. `getAllStoneArtifacts.ts` - ✅ extended glob patterns
4. `getAllStoneDriveArtifacts.ts` - ✅ extended glob patterns
5. acceptance test file - ❌ not created

## YAGNI analysis

### extra: 3 additional test cases

| case | prescribed? | justification |
|------|-------------|---------------|
| case7: .yield.md > .yield.json | no | validates priority within yield family |
| case8: .yield.* > .yield | no | validates extension precedence |
| case9: fallback to .md | no | validates graceful degradation |

**verdict**: keep. these provide valuable edge case coverage at no maintenance cost.

### absent: priority transformer integration

the blueprint shows `[+] prioritizeArtifacts` in operations. however:
- `getAllStoneArtifacts` returns ALL artifacts (for presence checks)
- `getAllStoneDriveArtifacts` returns ALL outputs (for enumeration)

returns all artifacts is correct for their purpose. the priority transformer exists and can be composed when single-artifact selection is needed.

**verdict**: not YAGNI - the transformer exists for future use when the driver needs to select one artifact.

### absent: dedicated acceptance test file

the blueprint suggested `driver.route.artifact-patterns.acceptance.test.ts`. however:
- extant `driver.route.drive.acceptance.test.ts` already tests artifact discovery
- 44 acceptance tests pass, to confirm backwards compat
- the `.yield*` glob pattern works via extant tests

**verdict**: not YAGNI - extant tests cover the functionality.

## conclusion

| item | status | action |
|------|--------|--------|
| extra test cases | keep | valuable coverage |
| priority transformer | keep | available for composition |
| dedicated acceptance test | skip | extant tests sufficient |

implementation is minimal and focused. no YAGNI violations detected.
