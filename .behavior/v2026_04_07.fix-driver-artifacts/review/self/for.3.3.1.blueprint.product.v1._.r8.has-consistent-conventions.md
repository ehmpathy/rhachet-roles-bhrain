# self-review r8: has-consistent-conventions

## verdict: pass

## name convention audit

### function name conventions in `src/domain.operations/route/stones/`

| prefix | purpose | extant examples |
|--------|---------|-----------------|
| `as*` | transformers | `asStoneGlob` |
| `is*` | boolean checks | `isStoneInGlob` |
| `find*` | finders | `findOneStoneByPattern` |
| `get*` | getters | `getAllStones`, `getAllStoneArtifacts` |
| `set*` | setters | `setStonePassage`, `setStoneAsPassed` |
| `del*` | deleters | `delStone`, `delStoneGuardArtifacts` |
| `compute*` | computations | `computeNextStones` |

**blueprint proposes:** `asArtifactByPriority`

**analysis:** follows `as*` convention for transformers. ✓

### file name conventions

| pattern | extant examples |
|---------|-----------------|
| `{functionName}.ts` | `getAllStones.ts`, `asStoneGlob.ts` |
| `{functionName}.test.ts` | `getAllStones.test.ts` |
| `{functionName}.integration.test.ts` | `setStoneAsPassed.integration.test.ts` |

**blueprint proposes:**
- `asArtifactByPriority.ts`
- `asArtifactByPriority.test.ts`

**analysis:** follows file = function name convention. ✓

### acceptance test name conventions

| pattern | extant examples |
|---------|-----------------|
| `{domain}.{feature}.acceptance.test.ts` | `driver.route.drive.acceptance.test.ts` |
| | `driver.route.artifact-expansion.acceptance.test.ts` |
| | `driver.route.get.acceptance.test.ts` |

**blueprint proposes:** `driver.route.artifact-patterns.acceptance.test.ts`

**analysis:** follows `driver.route.{feature}.acceptance.test.ts` convention. ✓

### term consistency

| term | extant usage | blueprint usage | consistent? |
|------|--------------|-----------------|-------------|
| artifact | `getAllStoneArtifacts`, `RouteStoneDriveArtifacts` | `asArtifactByPriority` | ✓ |
| stone | `getAllStones`, `RouteStone` | `stoneName` parameter | ✓ |
| route | `stepRouteDrive`, `input.route` | `input.route` | ✓ |

## structure consistency

### file location

blueprint places new transformer in `src/domain.operations/route/stones/`

extant transformers in same directory: `asStoneGlob.ts`

**analysis:** correct location for stone-related transformers. ✓

### test file colocation

blueprint colocates tests with source:
- `asArtifactByPriority.ts` + `asArtifactByPriority.test.ts`

extant pattern:
- `getAllStones.ts` + `getAllStones.test.ts`

**analysis:** follows colocation convention. ✓

## conclusion

all name and structure choices align with extant conventions:
- `as*` prefix for transformers
- file names match function names
- tests colocated with source
- acceptance tests follow `driver.route.{feature}` pattern
- terms match extant usage (artifact, stone, route)
