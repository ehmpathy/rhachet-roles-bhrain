# consistent conventions review: yield artifact pattern

## slow review process

1. searched codebase for `stoneName` vs `stone.name` usage patterns
2. verified parameter name conventions match extant code
3. checked glob pattern conventions
4. verified comment style conventions

## name conventions

### `stoneName` vs `stone.name` parameter

searched for usage across domain.operations/route:

| pattern | count | where used |
|---------|-------|------------|
| `stoneName: string` | 4 | simple string inputs |
| `stone.name` | 50+ | when full stone object available |

**examples of `stoneName: string`:**
- `getAllStones.ts:73` — `(input: { stoneName: string; ... })`
- `computeStoneOrderPrefix.ts:12` — `getStoneOrderPrefixFromName(stoneName: string)`
- `stepRouteReview.ts:53` — `let stoneName = input.stone;`

**my code:**
```typescript
// asArtifactByPriority.ts:12-15
export const asArtifactByPriority = (input: {
  artifacts: string[];
  stoneName: string;
}): string | null =>
```

**verdict:** consistent. uses `stoneName: string` because function receives a simple string, not the full stone object.

### glob pattern conventions

**extant patterns:**
```typescript
// getAllStoneDriveArtifacts.ts:24-25
const yieldGlob = `${stone.name}.yield*`;
const legacyGlob = `${stone.name}*.md`;

// getAllStoneArtifacts.ts:21-22
`${input.route}/${input.stone.name}.yield*`,
`${input.route}/${input.stone.name}*.md`,

// guard patterns (getAllStoneGuardArtifactsByHash.ts:33,40)
const reviewGlob = `${input.stone.name}.guard.review.*.${input.hash}.*.md`;
const judgeGlob = `${input.stone.name}.guard.judge.*.${input.hash}.*.md`;
```

**pattern structure:** `{stone.name}.{type}.*` or `{stone.name}*.md`

**my code recognizes:**
```typescript
// asArtifactByPriority.ts:21-25
{ suffix: '.yield.md', priority: 1 },
{ suffix: /\.yield\.[^.]+$/, priority: 2 },
{ suffix: '.yield', priority: 3 },
{ suffix: '.v1.i1.md', priority: 4 },
{ suffix: '.i1.md', priority: 5 },
```

**verdict:** consistent. patterns follow extant `{stone.name}.{type}*` convention.

### jsdoc comment conventions

**extant pattern (asStoneGlob.ts:5-11):**
```typescript
/**
 * .what = converts raw user input into a proper stone glob pattern
 * .why = enables natural word input without glob syntax knowledge
 *
 * .note = @all is an alias for * (avoids shell expansion issues)
 */
```

**my code (asArtifactByPriority.ts:1-11):**
```typescript
/**
 * .what = resolves artifact priority when multiple patterns match
 * .why = ensures consistent artifact selection across driver operations
 *
 * .note = priority order:
 *   1. .yield.md — new default: markdown yield
 *   ...
 */
```

**verdict:** consistent. uses `.what`, `.why`, `.note` format.

### function name conventions

**extant transformers:**
| function | pattern |
|----------|---------|
| `asStoneGlob` | `as` + `Stone` + `Glob` |
| `asDotRhachetDir` | `as` + `DotRhachet` + `Dir` |

**my function:**
| function | pattern |
|----------|---------|
| `asArtifactByPriority` | `as` + `Artifact` + `ByPriority` |

**verdict:** consistent. follows `as` + `[Domain]` + `[Modifier]` pattern.

## all files changed

reviewed ALL files changed in this behavior, not just the new transformer:

### asArtifactByPriority.ts (new file)
- function name: `as` + domain + modifier ✓
- jsdoc: `.what`, `.why`, `.note` ✓
- input pattern: `(input: { ... })` ✓
- parameter name: `stoneName: string` ✓

### getAllStoneArtifacts.ts (modified)

**line 15 comment:**
```typescript
// default globs: .yield* (new pattern) + *.md (legacy pattern)
```
follows extant comment style (lowercase, brief)

**line 21-22 globs:**
```typescript
`${input.route}/${input.stone.name}.yield*`, // new: .yield, .yield.md, .yield.json
`${input.route}/${input.stone.name}*.md`,    // legacy: .v1.i1.md, .i1.md
```
follows extant pattern: `${path}/${stone.name}*` style

### getAllStoneDriveArtifacts.ts (modified)

**line 23 comment:**
```typescript
// globs: .yield* (new pattern) + *.md (legacy pattern)
```
follows same comment style as getAllStoneArtifacts.ts

**line 24-25 variables:**
```typescript
const yieldGlob = `${stone.name}.yield*`;
const legacyGlob = `${stone.name}*.md`;
```
follows extant variable pattern: `{type}Glob`

**line 35 deduplication:**
```typescript
const outputs = [...new Set([...yieldMatches, ...legacyMatches])];
```
follows extant Set spread pattern for deduplication

## summary

| file | convention | consistent? |
|------|------------|-------------|
| asArtifactByPriority.ts | function name, jsdoc, input pattern | yes |
| getAllStoneArtifacts.ts | comment style, glob pattern | yes |
| getAllStoneDriveArtifacts.ts | comment style, variable name, dedup pattern | yes |

**no divergence from extant conventions found across ALL changed files.**
