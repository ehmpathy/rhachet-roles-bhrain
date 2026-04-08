# role standards adherance review

## slow review process

1. enumerated relevant briefs directories
2. read each changed file line by line
3. checked against each standard category

## briefs directories checked

| directory | purpose |
|-----------|---------|
| `lang.terms/` | name conventions, forbidden terms |
| `lang.tones/` | lowercase, no buzzwords, no shouts |
| `code.prod/evolvable.procedures/` | arrow functions, input-context, contracts |
| `code.prod/readable.comments/` | what-why headers |
| `code.prod/readable.narrative/` | narrative flow, no else branches |
| `code.test/frames.behavior/` | bdd tests with given-when-then |

## files reviewed

```
src/domain.operations/route/stones/asArtifactByPriority.ts (new)
src/domain.operations/route/stones/asArtifactByPriority.test.ts (new)
src/domain.operations/route/stones/getAllStoneArtifacts.ts (modified)
src/domain.operations/route/stones/getAllStoneDriveArtifacts.ts (modified)
```

## file-by-file standards check

### asArtifactByPriority.ts

#### rule.require.what-why-headers

**rule requires:**
- every named procedure must have jsdoc with `.what` and `.why`
- `.what` explains intent (1 line)
- `.why` explains reason (up to 3 lines)

**code (lines 1-11):**
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

**why it holds:**
- `.what` is present: "resolves artifact priority when multiple patterns match"
- `.why` is present: "ensures consistent artifact selection across driver operations"
- `.note` adds useful context about priority order
- all are concise (1-3 lines each)

#### rule.require.arrow-only

**rule requires:**
- use arrow functions for all procedures
- never use `function` keyword (except class methods)

**code (line 12):**
```typescript
export const asArtifactByPriority = (input: {
```

**why it holds:**
- uses `const` assignment with arrow syntax `=>`
- no `function` keyword present in file
- ensures lexical `this` is bound and uniform style

#### rule.require.input-context-pattern

**rule requires:**
- procedures accept `(input, context?)` as args
- input is an object with named properties
- enables change-resilient signatures

**code (lines 12-15):**
```typescript
export const asArtifactByPriority = (input: {
  artifacts: string[];
  stoneName: string;
}): string | null => {
```

**why it holds:**
- first arg is named `input` (not positional args)
- input is an inline typed object `{ artifacts, stoneName }`
- no context needed (pure transformer with no dependencies)
- return type is explicit: `string | null`

#### rule.require.narrative-flow

**rule requires:**
- eliminate if/else and nested if blocks
- use early returns
- structure as flat code paragraphs with comment titles

**code (lines 29-36):**
```typescript
// find highest priority match
for (const pattern of patterns) {
  const match = input.artifacts.find((artifact) =>
    typeof pattern.suffix === 'string'
      ? artifact.endsWith(pattern.suffix)
      : pattern.suffix.test(artifact),
  );
  if (match) return match;
}
```

**why it holds:**
- line 16 has comment title: `// define priority patterns (order matters)`
- line 28 has comment title: `// find highest priority match`
- line 38 has comment title: `// fallback: return first .md match or null`
- uses early return `if (match) return match;` instead of else
- no nested if/else blocks
- flat structure reads as narrative

#### rule.prefer.lowercase

**rule requires:**
- use lowercase for comments and copy
- capitalize only code constructs and proper nouns

**why it holds:**
- line 16: `// define priority patterns (order matters)` — lowercase
- line 28: `// find highest priority match` — lowercase
- line 38: `// fallback: return first .md match or null` — lowercase
- jsdoc content uses lowercase except code terms

#### rule.forbid.gerunds

**rule requires:**
- never use -ing form as noun in names or comments
- use verb, agent, or result form instead

**why it holds:**
- scanned file for `-ing` words: no gerunds found
- no variable names like `*ing`
- comments use verb forms: "find", "return", "define"

#### rule.require.treestruct

**rule requires:**
- mechanisms: `[verb][...nounhierarchy]`
- transformers use `as*` prefix for cast/parse operations

**why it holds:**
- function name: `asArtifactByPriority`
- follows `as` + `Artifact` + `ByPriority` structure
- `as*` is the correct prefix for cast/parse transformers
- consistent with extant transformers like `asStoneGlob`

### asArtifactByPriority.test.ts

#### rule.require.given-when-then

**rule requires:**
- tests use `given`, `when`, `then` from test-fns
- not raw `describe`, `it`, `test`

**code (lines 1, 6):**
```typescript
import { given, then, when } from 'test-fns';
...
given('[case1] .yield.md and .v1.i1.md both present', () => {
```

**why it holds:**
- line 1 imports `{ given, then, when }` from test-fns
- every test block uses given/when/then, not describe/it
- verified all 9 test cases follow this pattern

#### howto.write-bdd-lesson

**rule requires:**
- `[caseN]` labels for given blocks
- `[tN]` labels for when blocks (reset per given)
- one behavioral assertion per then block

**why it holds:**
- labels verified line by line:
  - line 6: `[case1]`
  - line 20: `[case2]`
  - line 34: `[case3]`
  - line 48: `[case4]`
  - line 62: `[case5]`
  - line 76: `[case6]`
  - line 90: `[case7]`
  - line 104: `[case8]`
  - line 118: `[case9]`
- each when has `[t0]` label (single action per given)
- each then has exactly one `expect()` call

### getAllStoneArtifacts.ts

#### rule.require.what-why-headers

**code (lines 4-9):**
```typescript
/**
 * .what = retrieves artifact files for a specific stone
 * .why = enables artifact presence to be verified before passage
 *
 * .note = globs run from repo root; $route is expanded to input.route
 */
```

**why it holds:**
- `.what` explains intent: "retrieves artifact files for a specific stone"
- `.why` explains purpose: "enables artifact presence to be verified before passage"
- `.note` documents glob behavior

#### rule.require.arrow-only

**code (line 10):**
```typescript
export const getAllStoneArtifacts = async (input: {
```

**why it holds:**
- uses `const` with async arrow: `async (input: {...}) =>`
- no `function` keyword in file

#### rule.require.narrative-flow

**code (lines 25-35):**
```typescript
// enumerate all matches across all globs
const allMatches: string[] = [];
for (const glob of globs) {
  // expand $route to input.route; patterns without $route are used as-is from repo root
  const expandedGlob = glob.replace(/\$route/g, input.route);
  const matches = await enumFilesFromGlob({...});
  allMatches.push(...matches);
}
```

**why it holds:**
- line 14-15 has comment paragraph: `// determine glob pattern from guard or default`
- line 25 has comment paragraph: `// enumerate all matches across all globs`
- flat for loop, no nested conditionals
- returns directly at end

### getAllStoneDriveArtifacts.ts

#### rule.require.what-why-headers

**code (lines 9-12):**
```typescript
/**
 * .what = retrieves drive artifacts for all stones in a route
 * .why = enables progress to be assessed along a route
 */
```

**why it holds:**
- `.what` present: "retrieves drive artifacts for all stones in a route"
- `.why` present: "enables progress to be assessed along a route"

#### rule.require.arrow-only

**code (line 13):**
```typescript
export const getAllStoneDriveArtifacts = async (input: {
```

**why it holds:**
- uses `const` with async arrow syntax
- no `function` keyword in file

#### rule.require.narrative-flow

**code structure verified line by line:**
- line 16: `// get all stones in the route`
- line 19: `// build artifacts for each stone`
- line 22: `// find output files via glob`
- line 34: `// combine and dedupe (some files match both patterns)`
- line 37: `// check for passage report in passage.jsonl`

**why it holds:**
- each code paragraph has a comment title
- flat for loop with no nested conditionals
- no if/else branches
- returns directly at end

## violations found

**none.** all files adhere to mechanic role standards.

## summary

| file | standards checked | violations |
|------|-------------------|------------|
| asArtifactByPriority.ts | 7 | 0 |
| asArtifactByPriority.test.ts | 2 | 0 |
| getAllStoneArtifacts.ts | 3 | 0 |
| getAllStoneDriveArtifacts.ts | 3 | 0 |

**all files follow mechanic role standards.**
