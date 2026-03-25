# self-review: has-consistent-conventions (r4)

## question

do our name choices and patterns match the codebase's conventions?

---

## deep review

I read through `getAllStoneArtifacts.ts` line by line and checked each name against extant patterns.

### function name: `getAllStoneArtifacts`

**searched for extant function names in `src/domain.operations/route/stones/`:**

| file | function name | pattern |
|------|---------------|---------|
| `getAllStones.ts` | `getAllStones` | `getAll[X]` |
| `getAllStoneDriveArtifacts.ts` | `getAllStoneDriveArtifacts` | `getAll[X][Y]` |
| `getAllStoneArtifacts.ts` (new) | `getAllStoneArtifacts` | `getAll[X][Y]` |

my function name follows the exact `getAll[Stone][X]` pattern used by `getAllStoneDriveArtifacts`.

**why it holds:** the `getAll` prefix is consistently used for retrieval functions that return arrays. `Stone` is the domain object. `Artifacts` is what we retrieve. this matches the extant convention.

### variable name: `hasCustomArtifacts`

**searched for `has[X]` pattern:**

```
grep "const has[A-Z]" src/domain.operations/route/
```

| file | variable |
|------|----------|
| `formatGuardTree.ts` | `hasReviews` |
| `formatGuardTree.ts` | `hasJudges` |
| `asStoneGlob.ts` | `hasGlobChars` |
| `setStoneAsPassed.ts` | `hasMalfunction` |
| new | `hasCustomArtifacts` |

**why it holds:** boolean variables that check "does X have Y" are named `has[Y]` in this codebase. my `hasCustomArtifacts` checks "does stone.guard have custom artifacts" — follows the same pattern.

### variable name: `expandedGlob`

**searched for `[participle][Noun]` pattern:**

```
grep -r "const [a-z]*ed[A-Z]" src/domain.operations/route/
```

found limited usage. let me check how transformed values are named.

**searched for glob variable names:**

| file | variable | context |
|------|----------|---------|
| `asStoneGlob.ts` | `regexStr` | transformed glob → regex |
| `getAllStones.ts` | `stoneGlob` | constructed glob string |
| new | `expandedGlob` | glob with $route substituted |

**why it holds:** variable names describe what the value represents. `expandedGlob` clearly states this is a glob with variables expanded. the `ed` suffix indicates past action (variables were expanded). this is clear and self-descriptive.

### variable name: `unquoted` (in parseStoneGuard.ts)

**read parseStoneGuard.ts context:**

```ts
const unquoted = value.replace(/^["'](.*)["']$/, '$1');
if (currentKey === 'artifacts') {
  result.artifacts?.push(unquoted);
}
```

**why it holds:** this follows the pattern of name-by-transformation. similar to how `trimmed` or `parsed` might be used. the name tells the reader: this is the value with quotes removed.

### loop pattern: `for (const glob of globs)`

**searched for loop patterns:**

```
grep "for (const" src/domain.operations/route/stones/
```

found 20+ instances all use `for (const X of Y)` pattern:
- `for (const artifact of artifacts)`
- `for (const stone of stones)`
- `for (const review of reviewMalfunctions)`
- `for (const filePath of allFiles)`

my loop `for (const glob of globs)` follows this exact pattern.

### import style

**checked import patterns in nearby files:**

```ts
// getAllStones.ts
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

// getAllStoneArtifacts.ts (new)
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';
```

same import style, same utility function.

---

## found no divergence

| element | extant convention | my implementation | match? |
|---------|-------------------|-------------------|--------|
| function name | `getAll[Stone][X]` | `getAllStoneArtifacts` | yes |
| boolean var | `has[X]` | `hasCustomArtifacts` | yes |
| transformed var | `[participle][Noun]` | `expandedGlob` | yes |
| loop pattern | `for (const X of Y)` | `for (const glob of globs)` | yes |
| imports | `@src/utils/...` | `@src/utils/enumFilesFromGlob` | yes |

---

## conclusion

all names follow extant conventions. no divergence found. the code reads like it belongs with the adjacent stone operations.
