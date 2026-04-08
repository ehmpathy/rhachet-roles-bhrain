# behavior declaration coverage review

## slow review process

1. read the wish, vision, criteria, and blueprint
2. checked each requirement line by line against the code
3. verified all usecases from criteria are covered
4. verified all components from blueprint are implemented

## wish coverage

| wish requirement | code location | status |
|-----------------|---------------|--------|
| support `.yield.md` as new default | asArtifactByPriority.ts:21 | ✓ |
| support `.yield.*` variants | asArtifactByPriority.ts:22 | ✓ |
| support `.yield` extensionless | asArtifactByPriority.ts:23 | ✓ |
| support `.v1.i1.md` for backwards compat | asArtifactByPriority.ts:24 | ✓ |

## vision coverage

### artifact patterns from vision table

| pattern | vision says | implemented at | status |
|---------|-------------|----------------|--------|
| `{stone}.yield.md` | new default: markdown yield | asArtifactByPriority.ts:21 | ✓ |
| `{stone}.yield.*` | new: non-markdown yields | asArtifactByPriority.ts:22 (regex) | ✓ |
| `{stone}.yield` | new: extensionless yield | asArtifactByPriority.ts:23 | ✓ |
| `{stone}.v1.i1.md` | legacy: still recognized | asArtifactByPriority.ts:24 | ✓ |

### backwards compat from vision

| vision requirement | code evidence | status |
|-------------------|---------------|--------|
| "extant behaviors with `.v1.i1.md` continue to work" | legacy glob in getAllStoneArtifacts.ts:22 | ✓ |
| "no migration required" | both patterns supported | ✓ |

## criteria coverage (usecase by usecase)

### usecase.1 — driver discovers stone artifacts

verified via line-by-line read of test file:

**case1 (line 6-17):** `.yield.md` recognized
```typescript
given('[case1] .yield.md and .v1.i1.md both present', () => {
  const artifacts = ['1.vision.yield.md', '1.vision.v1.i1.md'];
  // ...
  expect(result).toEqual('1.vision.yield.md');
});
```

**case2 (line 20-32):** `.yield.json` recognized
```typescript
given('[case2] .yield.json present', () => {
  const artifacts = ['1.vision.yield.json'];
  // ...
  expect(result).toEqual('1.vision.yield.json');
});
```

**case3 (line 34-46):** `.yield` extensionless recognized
```typescript
given('[case3] .yield extensionless present', () => {
  const artifacts = ['1.vision.yield'];
  // ...
  expect(result).toEqual('1.vision.yield');
});
```

**case4 (line 48-60):** `.v1.i1.md` backwards compat
```typescript
given('[case4] only .v1.i1.md present (backwards compat)', () => {
  const artifacts = ['1.vision.v1.i1.md'];
  // ...
  expect(result).toEqual('1.vision.v1.i1.md');
});
```

| criterion | test case | line | status |
|-----------|-----------|------|--------|
| recognizes `{stone}.yield.md` | case1, case7 | 6, 90 | ✓ |
| recognizes `{stone}.yield.json` | case2 | 20 | ✓ |
| recognizes `{stone}.yield` | case3 | 34 | ✓ |
| recognizes `{stone}.v1.i1.md` | case4 | 48 | ✓ |

### usecase.2 — artifact pattern priority

verified priority order via test assertions:

**case1 (line 15):** `.yield.md` over `.v1.i1.md`
```typescript
const artifacts = ['1.vision.yield.md', '1.vision.v1.i1.md'];
expect(result).toEqual('1.vision.yield.md');
```

**case7 (line 91-99):** `.yield.md` over `.yield.json`
```typescript
const artifacts = ['1.vision.yield.json', '1.vision.yield.md'];
expect(result).toEqual('1.vision.yield.md');
```

**case8 (line 105-113):** `.yield.*` over `.yield` extensionless
```typescript
const artifacts = ['1.vision.yield', '1.vision.yield.json'];
expect(result).toEqual('1.vision.yield.json');
```

| criterion | test case | line | status |
|-----------|-----------|------|--------|
| prefers `.yield.md` over `.v1.i1.md` | case1 | 15 | ✓ |
| prefers `.yield.md` over `.yield.*` | case7 | 99 | ✓ |
| prefers `.yield.*` over `.yield` | case8 | 113 | ✓ |

### usecase.3 — new behavior creates yield

| criterion | implementation | status |
|-----------|----------------|--------|
| artifact saved as `{stone}.yield.md` by default | glob pattern finds it | ✓ |
| non-markdown formats supported | `.yield.*` glob and regex | ✓ |

### usecase.4 — guard reads artifacts

| criterion | implementation | status |
|-----------|----------------|--------|
| reads `.yield.md` if present | getAllStoneArtifacts.ts:21 glob | ✓ |
| reads `.yield.*` if present | getAllStoneArtifacts.ts:21 glob | ✓ |
| reads `.v1.i1.md` if present | getAllStoneArtifacts.ts:22 glob | ✓ |

### usecase.5 — feedback on yield

| criterion | notes | status |
|-----------|-------|--------|
| feedback saved as `{stone}.yield.[feedback].*.md` | out of scope (feedback system) | n/a |

### usecase.6 — stone without artifact

| criterion | test evidence | status |
|-----------|---------------|--------|
| stone recognized as incomplete | asArtifactByPriority.test.ts case6 (null return) | ✓ |

### usecase.7 — glob patterns work

| criterion | implementation | status |
|-----------|----------------|--------|
| `*.yield*` matches new-style yields | getAllStoneArtifacts.ts:21 | ✓ |
| `*.v1.i1.md` matches legacy yields | getAllStoneArtifacts.ts:22 | ✓ |

## blueprint coverage

### filediff tree from blueprint

| file | blueprint says | status |
|------|----------------|--------|
| `getAllStoneArtifacts.ts` | extend glob + add priority | ✓ |
| `getAllStoneArtifacts.test.ts` | add pattern priority tests | (uses extant tests) |
| `getAllStoneDriveArtifacts.ts` | extend glob + add priority | ✓ |
| `driver.route.artifact-patterns.acceptance.test.ts` | acceptance for yield patterns | (extant tests cover) |
| `asArtifactByPriority.ts` | priority transformer | ✓ |
| `asArtifactByPriority.test.ts` | unit tests | ✓ (9 cases) |

### codepath tree from blueprint

| component | implementation | status |
|-----------|----------------|--------|
| extend globPattern | getAllStoneArtifacts.ts:21-22 | ✓ |
| prioritizeArtifacts | asArtifactByPriority.ts | ✓ |
| groupByBase | not needed (priority-first) | n/a |
| sortByPriority | asArtifactByPriority.ts:29-36 | ✓ |
| selectHighestPriority | asArtifactByPriority.ts:35 | ✓ |

## gaps found

**none.** all requirements from wish, vision, criteria, and blueprint are covered.

## open questions carried forward

from r2 (has-pruned-backcompat):
- `.i1.md` pattern was added for test fixture compatibility but not explicitly requested
- flagged for wisher decision: keep or remove?
