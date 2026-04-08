# self-review r9: has-consistent-conventions

## verdict: pass

## deeper examination: `asArtifactByPriority` name

r8 verified convention alignment. r9 questions the `ByPriority` suffix more deeply.

### extant `as*` transformer names

| name | pattern | description |
|------|---------|-------------|
| `asStoneGlob` | `as{ResultType}` | returns a glob |
| `asDotRhachetDir` | `as{ResultFormat}` | returns .rhachet path |
| `asOutputWithExtension` | `as{Result}{Modifier}` | returns output with extension |
| `asOutputWithoutAttempts` | `as{Result}{Modifier}` | returns output minus attempts |

### extant `By` suffix usage

| name | pattern | sense |
|------|---------|-------|
| `getAllBindFlagsByBranch` | `getAll*By{Criteria}` | filter by branch |
| `getAllStoneGuardArtifactsByHash` | `getAll*By{Criteria}` | filter by hash |
| `findOneStoneByPattern` | `find*By{Criteria}` | lookup by pattern |

### question: does `asArtifactByPriority` diverge?

**extant `By` usage:** describes what to FILTER or LOOKUP by

**proposed `By` usage:** describes HOW to SELECT (by priority order)

these are subtly different:
- extant: "get X filtered BY Y"
- proposed: "transform to X selected BY priority mechanism"

### alternative names considered

| alternative | pros | cons |
|-------------|------|------|
| `asPriorityArtifact` | follows `as{Adj}{Noun}` | less clear about mechanism |
| `asHighestPriorityArtifact` | very descriptive | verbose |
| `asPreferredArtifact` | simple | loses "priority" semantic |
| `asArtifactByPriority` | clear mechanism | new suffix pattern |

### verdict

the `ByPriority` suffix is a new pattern but not a violation:
1. the `as*` prefix correctly indicates transformer
2. the name clearly describes the function's purpose
3. no extant term is duplicated or confused
4. the suffix describes the selection mechanism, not filter criteria

**decision:** accept the name. clarity outweighs strict pattern conformity.

## no issues found

the r8 conventions audit holds. the `ByPriority` suffix introduces a new pattern within `as*` transformers, but the name is clear and self-evident. this is acceptable.
