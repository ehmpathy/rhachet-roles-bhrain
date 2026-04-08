# self-review r2: has-questioned-deletables

## verdict: pass (with one simplification noted)

## feature traceability

| feature | traced to | delete? |
|---------|-----------|---------|
| `.yield.md` recognition | criteria usecase.1, vision | no - core requirement |
| `.yield.*` recognition | criteria usecase.1, vision | no - core requirement |
| `.yield` extensionless | criteria usecase.1, vision | no - core requirement |
| `.v1.i1.md` backwards compat | criteria usecase.1, vision | no - explicit requirement |
| `.i1.md` test pattern | research: test fixtures use it | no - needed for test compat |
| priority resolution | criteria usecase.2, vision | no - core requirement |

all features trace to requirements. no deletable features.

## component analysis

### `asArtifactByPriority` transformer

**question**: can we delete priority resolution and return all matches?

**answer**: no. criteria usecase.2 says:
```
then('prefers .yield.md over .v1.i1.md')
```

the driver must select one artifact when multiple exist. priority is required.

### glob patterns

**question**: can we simplify from 3 globs to 2?

blueprint proposes:
```typescript
const globs = [
  `${stone.name}.yield.*`,   // .yield.md, .yield.json
  `${stone.name}.yield`,     // extensionless
  `${stone.name}*.md`,       // legacy
];
```

simpler alternative:
```typescript
const globs = [
  `${stone.name}.yield*`,    // matches .yield, .yield.md, .yield.json
  `${stone.name}*.md`,       // legacy
];
```

**decision**: the simpler version works. `.yield*` matches both `.yield` (extensionless) and `.yield.md` (with extension). one glob covers both cases.

**action**: update blueprint implementation details to use 2 globs instead of 3.

### test files

**question**: do we need all proposed tests?

| test file | purpose | delete? |
|-----------|---------|---------|
| `asArtifactByPriority.test.ts` | unit tests for transformer | no - pure logic needs tests |
| `getAllStoneArtifacts.test.ts` changes | integration test | no - verify integration |
| `getAllStoneDriveArtifacts.test.ts` changes | integration test | no - verify integration |
| acceptance test | contract verification | no - proves feature works |

all tests serve distinct purposes. no deletable tests.

## found issue

the glob pattern can be simplified from 3 to 2 patterns.

## fix applied

updated blueprint implementation details section.
