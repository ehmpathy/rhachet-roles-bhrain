# consistent mechanisms review: yield artifact pattern

## slow review process

1. searched for extant artifact selection mechanisms via grep
2. read each `as*` transformer in domain.operations to compare structure
3. verified code structure matches extant transformers
4. checked utils/ for any utilities I might have missed
5. verified glob patterns are identical across both files

## mechanism search results

### artifact selection mechanisms

| search pattern | path | matches | duplicates? |
|----------------|------|---------|-------------|
| `getOne.*Artifact` | src/domain.operations | 0 | no |
| `select.*Artifact` | src/domain.operations | 0 | no |
| `pick.*Artifact` | src/domain.operations | 0 | no |
| `sort.*artifact` | src/domain.operations | 0 | no |
| `priority\|select\|pick\|choose` | src/utils | 0 | no |

**conclusion:** `asArtifactByPriority` fills a gap. no extant mechanism for artifact priority selection.

## structure comparison with extant transformers

### extant `as*` transformers in domain.operations:

| file | function | structure |
|------|----------|-----------|
| asStoneGlob.ts:13 | `asStoneGlob` | `(input: { pattern }) => { glob, raw }` |
| asStoneGlob.ts:29 | `isStoneInGlob` | `(input: { name, glob }) => boolean` |
| asStoneGlob.ts:49 | `findOneStoneByPattern` | `(input: { stones, pattern }) => RouteStone \| null` |
| asDotRhachetFile.ts:7 | `asDotRhachetDir` | `(from: string) => string` |

### new transformer structure:

| file | function | structure |
|------|----------|-----------|
| asArtifactByPriority.ts:12 | `asArtifactByPriority` | `(input: { artifacts, stoneName }) => string \| null` |

### line-by-line consistency check:

**jsdoc pattern** (lines 1-11):
```typescript
/**
 * .what = resolves artifact priority when multiple patterns match
 * .why = ensures consistent artifact selection across driver operations
 * .note = priority order: ...
 */
```
consistent with `asStoneGlob` which has `.what`, `.why`, `.note`

**input pattern** (lines 12-15):
```typescript
export const asArtifactByPriority = (input: {
  artifacts: string[];
  stoneName: string;
}): string | null =>
```
consistent with `asStoneGlob` which uses `(input: { ... })` pattern

**pure function** (lines 16-40):
- no side effects
- no external state
- deterministic output for same input
consistent with all extant transformers

**return type** (line 15):
```typescript
string | null
```
consistent with `findOneStoneByPattern` which returns `RouteStone | null`

## glob pattern consistency

both files use IDENTICAL patterns:

**getAllStoneArtifacts.ts:21-22:**
```typescript
`${input.route}/${input.stone.name}.yield*`, // new: .yield, .yield.md, .yield.json
`${input.route}/${input.stone.name}*.md`,    // legacy: .v1.i1.md, .i1.md
```

**getAllStoneDriveArtifacts.ts:24-25:**
```typescript
const yieldGlob = `${stone.name}.yield*`;
const legacyGlob = `${stone.name}*.md`;
```

the patterns are functionally identical (one includes route prefix, one uses cwd).

## research template consistency

research templates already use `.yield.md` pattern in 12+ places:
- `1.1.probes.aim.internal.yield.md`
- `1.2.probes.aim.external.yield.md`
- `1.3.probes.aim.blend.yield.md`
- `3.2.absorb.clusters.yield.md`
- etc.

the new priority patterns align with extant template usage.

## verdict

| check | evidence | result |
|-------|----------|--------|
| duplicates extant mechanism? | grep found 0 matches | no |
| follows jsdoc convention? | `.what`, `.why`, `.note` present | yes |
| follows input pattern? | `(input: { ... })` style | yes |
| pure transformer? | no side effects, deterministic | yes |
| return type pattern? | `T \| null` matches extant | yes |
| glob patterns consistent? | identical across both files | yes |

**no inconsistency found.**
