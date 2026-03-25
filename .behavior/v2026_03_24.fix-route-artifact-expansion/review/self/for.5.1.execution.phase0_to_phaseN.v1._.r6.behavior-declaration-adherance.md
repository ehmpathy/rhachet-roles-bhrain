# self-review: behavior-declaration-adherance (r6)

## question

does each implementation correctly follow the spec?

---

## deep review

I traced every code path that calls `getAllStoneArtifacts` and verified the route value is correct.

### call site verification

**call site 1**: `setStoneAsPassed.ts:60`
```ts
const artifactFiles = await getAllStoneArtifacts({
  stone: stoneMatched,
  route: input.route,
});
```
- `input.route` comes from the skill invocation (e.g., `.behavior/v2026_03_24.xyz/`)
- this is the correct expansion value

**call site 2**: `delStone.ts:17`
```ts
const artifacts = await getAllStoneArtifacts({
  stone: input.stone,
  route: input.route,
});
```
- same pattern, `input.route` is the route path

**call site 3**: `stepRouteStoneDel.ts:80`
```ts
const artifacts = await getAllStoneArtifacts({
  stone,
  route: input.route,
});
```
- same pattern

**call site 4**: `computeStoneReviewInputHash.ts:20`
```ts
const allFiles = await getAllStoneArtifacts(input);
```
- passes input directly, which has `{ stone, route }`
- same contract

**why it holds**: all four call sites pass `route` as the actual route path (e.g., `.behavior/xyz/`). no caller passes a modified or incorrect route value.

---

### line-by-line code verification

I read `getAllStoneArtifacts.ts` from top to bottom:

**line 1-2**: imports
- `RouteStone` type for input.stone
- `enumFilesFromGlob` for file enumeration
- both are correct

**line 4-9**: jsdoc comment
- documents that globs run from repo root
- documents that $route is expanded to input.route
- accurate description of behavior

**line 10-13**: function signature
- takes `{ stone: RouteStone; route: string }`
- returns `Promise<string[]>`
- matches extant pattern

**line 15-16**: hasCustomArtifacts check
- `input.stone.guard?.artifacts && input.stone.guard.artifacts.length > 0`
- correctly checks for non-empty artifacts array
- safe optional chain

**line 17-19**: glob determination
- if hasCustomArtifacts: use guard artifacts
- else: default to `${input.route}/${input.stone.name}*.md`
- the `!` assertion is safe because hasCustomArtifacts guarantees existence

**line 22**: allMatches initialization
- `const allMatches: string[] = [];`
- correct type for aggregation

**line 23**: for loop
- `for (const glob of globs)`
- iterates all glob patterns

**line 24-25**: $route expansion
- comment accurately describes behavior
- `glob.replace(/\$route/g, input.route)` replaces all instances
- if no $route in pattern, returns unchanged

**line 26-29**: enumFilesFromGlob call
- passes `glob: expandedGlob` (the expanded pattern)
- passes `cwd: process.cwd()` (repo root)
- this matches spec: glob runs from repo root

**line 30**: aggregation
- `allMatches.push(...matches)` adds all matches
- correct spread syntax

**line 33**: return
- returns aggregated matches

---

### criteria trace

| criteria | code line | implementation |
|----------|-----------|----------------|
| "expands $route to actual route path" | 25 | `glob.replace(/\$route/g, input.route)` |
| "runs glob from repo root" | 28 | `cwd: process.cwd()` |
| "all $route instances expanded" | 25 | `/\$route/g` has `g` flag |
| "patterns without $route used as-is" | 25 | `.replace()` returns original if no match |
| "default pattern includes route prefix" | 19 | `${input.route}/${input.stone.name}*.md` |
| "empty array for no matches" | (contract) | `enumFilesFromGlob` returns `[]` |

---

### parseStoneGuard.ts verification

**line 148**: quote strip regex
```ts
const unquoted = value.replace(/^["'](.*)["']$/, '$1');
```
- `^["']` matches start quote (single or double)
- `(.*)` captures content between quotes
- `["']$` matches end quote
- `'$1'` replaces with captured content

**question**: does this break patterns without quotes?

test: `value = "$route/file.md"` (with quotes)
- regex matches, returns `$route/file.md`

test: `value = "$route/file.md"` (without quotes, if somehow parsed that way)
- regex does NOT match (no start quote), returns original

**why it holds**: the regex only strips quotes if both start and end quotes exist. patterns without quotes pass through unchanged.

---

## found issues: none

all code correctly implements the spec:
- $route expansion uses correct regex with global flag
- cwd explicitly set to repo root via process.cwd()
- default pattern correctly prefixes with route path
- quote strip handles quoted YAML patterns
- all call sites pass correct route value

---

## conclusion

every line of implementation correctly adheres to the spec. no deviations found.
