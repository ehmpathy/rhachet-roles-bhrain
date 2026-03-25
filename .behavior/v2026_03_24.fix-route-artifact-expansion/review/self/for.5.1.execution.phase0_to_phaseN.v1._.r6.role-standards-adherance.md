# self-review: role-standards-adherance (r6)

## question

does the code follow mechanic role standards?

---

## brief directories checked

1. `briefs/practices/code.prod/evolvable.procedures/`
2. `briefs/practices/code.prod/readable.comments/`
3. `briefs/practices/code.prod/readable.narrative/`
4. `briefs/practices/lang.terms/`

---

## verification against each standard

### rule.require.what-why-headers

**requirement**: every named procedure needs `.what` and `.why` in jsdoc

**getAllStoneArtifacts.ts lines 4-9**:
```ts
/**
 * .what = retrieves artifact files for a specific stone
 * .why = enables artifact presence to be verified before passage
 *
 * .note = globs run from repo root; $route is expanded to input.route
 */
```

**why it holds**: jsdoc has `.what`, `.why`, and optional `.note`. follows the pattern exactly.

---

### rule.require.input-context-pattern

**requirement**: procedures take `(input, context?)` arguments

**getAllStoneArtifacts.ts line 10**:
```ts
export const getAllStoneArtifacts = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<string[]> => {
```

**why it holds**: takes single `input` object with named properties. no context needed (pure computation). follows pattern.

---

### rule.require.arrow-only

**requirement**: use arrow functions, not `function` keyword

**getAllStoneArtifacts.ts**:
```ts
export const getAllStoneArtifacts = async (input: {...}): Promise<string[]> => {
```

**why it holds**: uses arrow function syntax. no `function` keyword.

---

### rule.forbid.gerunds

**requirement**: no gerunds in code

**checked**: variable names and comments in getAllStoneArtifacts.ts
- `hasCustomArtifacts` — no gerund
- `expandedGlob` — no gerund
- `allMatches` — no gerund
- comment: "expand $route to input.route" — no gerund (uses imperative "expand")

**why it holds**: no gerunds found in changed code.

---

### rule.require.narrative-flow

**requirement**: flat linear code, no nested if/else

**getAllStoneArtifacts.ts lines 14-31**:
```ts
// determine glob pattern from guard or default
const hasCustomArtifacts = ...;
const globs = hasCustomArtifacts ? ... : ...;

// enumerate all matches across all globs
const allMatches: string[] = [];
for (const glob of globs) {
  // expand $route to input.route; ...
  const expandedGlob = glob.replace(...);
  const matches = await enumFilesFromGlob({...});
  allMatches.push(...matches);
}

return allMatches;
```

**why it holds**: code is flat. ternary for simple assignment, single for loop. no nested if/else. comments precede code paragraphs.

---

### rule.forbid.else-branches

**requirement**: no else or if/else

**getAllStoneArtifacts.ts**: uses ternary `? :` for assignment, not if/else

**why it holds**: ternary is allowed for assignment. no if/else blocks.

---

### rule.require.immutable-vars

**requirement**: use const, no let

**getAllStoneArtifacts.ts**:
- line 15: `const hasCustomArtifacts`
- line 17: `const globs`
- line 22: `const allMatches` (mutation via push, not reassignment)
- line 25: `const expandedGlob`
- line 26: `const matches`

**why it holds**: all variables are `const`. array mutation (`push`) is standard and acceptable.

---

### parseStoneGuard.ts change

**line 148-151**:
```ts
// strip outer quotes (yaml string delimiters)
const unquoted = value.replace(/^["'](.*)["']$/, '$1');

if (currentKey === 'artifacts') {
  result.artifacts?.push(unquoted);
}
```

**why it holds**:
- comment uses imperative "strip", not gerund
- `const unquoted` — no gerund in name
- single if block (no else)
- follows extant pattern for other keys (judges, protect)

---

## found issues: none

all changed code follows mechanic role standards:
- jsdoc with .what/.why
- input pattern
- arrow function
- no gerunds
- narrative flow
- const declarations
- no else branches

---

## conclusion

code adheres to all mechanic role standards checked. no violations found.
