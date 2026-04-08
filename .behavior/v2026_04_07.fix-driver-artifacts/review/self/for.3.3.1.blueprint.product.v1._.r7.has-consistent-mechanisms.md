# self-review r7: has-consistent-mechanisms

## verdict: pass

## mechanisms introduced

the blueprint introduces:
1. `asArtifactByPriority` - NEW transformer for priority-based artifact selection
2. extended globs in `getAllStoneArtifacts` and `getAllStoneDriveArtifacts`

## extant mechanism search

### searched codepaths

| search | result |
|--------|--------|
| `priority\|prioritize\|prefer` in src | 15 files, none related to artifact selection |
| `asArtifact\|getArtifact\|artifact.*pattern` in src | 12 files, none do priority selection |
| `endsWith\|match.*pattern\|sort.*priority` in src/utils | only enumFilesFromGlob.ts |
| `\.yield\|v1\.i1` in src | no matches (patterns not yet implemented) |
| `^export const as[A-Z]` in src | 3 transformers found |

### related extant transformers

| file | function | purpose | overlap? |
|------|----------|---------|----------|
| `asStoneGlob.ts` | `isStoneInGlob` | glob→regex for stone NAMES | no (different domain) |
| `asStoneGlob.ts` | `findOneStoneByPattern` | find stone by pattern | no (stones, not artifacts) |
| `asDotRhachetFile.ts` | `asDotRhachetFile` | file path format | no (file format) |
| `setSkillOutputSrc.ts` | N/A | skill output handler | no (skill outputs) |

### extant artifact enumeration

| file | mechanism | reusable? |
|------|-----------|-----------|
| `getAllStoneArtifacts.ts` | glob enumeration via `enumFilesFromGlob` | yes - EXTEND this |
| `getAllStoneDriveArtifacts.ts` | glob enumeration via `enumFilesFromGlob` | yes - EXTEND this |

## analysis

### `asArtifactByPriority` - NEW, no duplicate

the transformer performs:
- suffix-based pattern match
- priority order of matches
- first-match return

no extant mechanism does suffix-based priority selection on artifact lists. the `isStoneInGlob` function does glob→regex match but:
- operates on stone names, not file suffixes
- returns boolean, not selected match
- no priority order

**verdict:** new mechanism, not a duplicate.

### extended globs - MODIFICATION, consistent

the blueprint extends extant globs from:
```typescript
[`${input.route}/${input.stone.name}*.md`]
```
to:
```typescript
[
  `${input.route}/${input.stone.name}.yield*`,
  `${input.route}/${input.stone.name}*.md`,
]
```

this is a modification of extant patterns, not a new mechanism. the `enumFilesFromGlob` utility remains the base mechanism.

**verdict:** extension of extant patterns, consistent.

## conclusion

| mechanism | status |
|-----------|--------|
| `asArtifactByPriority` | NEW - no extant duplicate found |
| extended globs | EXTEND - builds on extant patterns |
| `enumFilesFromGlob` usage | REUSE - uses extant utility |

no duplication of extant functionality. new transformer fills a gap (priority selection) that no extant mechanism addresses.
