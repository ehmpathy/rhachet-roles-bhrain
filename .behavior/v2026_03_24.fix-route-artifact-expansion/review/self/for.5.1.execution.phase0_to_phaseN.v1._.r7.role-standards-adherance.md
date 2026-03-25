# self-review: role-standards-adherance (r7)

## question

does the code follow mechanic role standards?

---

## brief directories checked

I enumerated all relevant subdirectories from `.agent/repo=ehmpathy/role=mechanic/briefs/practices/`:

1. `code.prod/evolvable.procedures/` — function patterns
2. `code.prod/readable.comments/` — jsdoc requirements
3. `code.prod/readable.narrative/` — flow patterns
4. `code.prod/pitofsuccess.errors/` — error patterns
5. `code.prod/pitofsuccess.procedures/` — idempotency
6. `lang.terms/` — forbidden terms, gerunds
7. `lang.tones/` — tone patterns

---

## getAllStoneArtifacts.ts line-by-line

### line 4-9: jsdoc comment

```ts
/**
 * .what = retrieves artifact files for a specific stone
 * .why = enables artifact presence to be verified before passage
 *
 * .note = globs run from repo root; $route is expanded to input.route
 */
```

| rule | requirement | code | holds? |
|------|-------------|------|--------|
| rule.require.what-why-headers | `.what` and `.why` in jsdoc | present | yes |
| rule.forbid.gerunds | no gerunds | "retrieves" (verb, not gerund) | yes |

### line 10-13: function signature

```ts
export const getAllStoneArtifacts = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<string[]> => {
```

| rule | requirement | code | holds? |
|------|-------------|------|--------|
| rule.require.arrow-only | no `function` keyword | arrow function | yes |
| rule.require.input-context-pattern | `(input, context?)` | single input object | yes |
| rule.forbid.io-as-interfaces | inline types | `{ stone, route }` inline | yes |

### line 15-19: glob determination

```ts
const hasCustomArtifacts =
  input.stone.guard?.artifacts && input.stone.guard.artifacts.length > 0;
const globs = hasCustomArtifacts
  ? input.stone.guard!.artifacts
  : [`${input.route}/${input.stone.name}*.md`];
```

| rule | requirement | code | holds? |
|------|-------------|------|--------|
| rule.require.immutable-vars | use `const` | all `const` | yes |
| rule.forbid.else-branches | no if/else | ternary for assignment | yes |
| rule.forbid.gerunds | no gerunds | none present | yes |

### line 22-31: enumeration loop

```ts
const allMatches: string[] = [];
for (const glob of globs) {
  // expand $route to input.route; patterns without $route are used as-is from repo root
  const expandedGlob = glob.replace(/\$route/g, input.route);
  const matches = await enumFilesFromGlob({
    glob: expandedGlob,
    cwd: process.cwd(),
  });
  allMatches.push(...matches);
}
```

| rule | requirement | code | holds? |
|------|-------------|------|--------|
| rule.require.narrative-flow | flat code, comments | comment precedes block | yes |
| rule.require.immutable-vars | no `let` | all `const` | yes |
| rule.forbid.gerunds | no gerunds | "expand" (imperative) | yes |

### line 33: return

```ts
return allMatches;
```

| rule | requirement | code | holds? |
|------|-------------|------|--------|
| (simple return) | — | — | yes |

---

## parseStoneGuard.ts line 148-151

```ts
// strip outer quotes (yaml string delimiters)
const unquoted = value.replace(/^["'](.*)["']$/, '$1');

if (currentKey === 'artifacts') {
  result.artifacts?.push(unquoted);
}
```

| rule | requirement | code | holds? |
|------|-------------|------|--------|
| rule.require.narrative-flow | comment before code | "strip outer quotes" | yes |
| rule.forbid.gerunds | no gerunds | "strip" (imperative) | yes |
| rule.require.immutable-vars | no `let` | `const unquoted` | yes |
| rule.forbid.else-branches | no else | single if block | yes |

**note**: this change follows the extant pattern for judges and protect. the guards/reviews don't strip quotes (they are commands, not globs).

---

## additional checks

### rule.forbid.buzzwords

searched for buzzwords in comments:
- "retrieves" — specific verb, not buzzword
- "enables" — specific verb
- "expand" — specific verb

**why it holds**: no buzzwords found.

### rule.require.ubiqlang

checked for consistent terminology:
- "artifacts" — used consistently
- "route" — used consistently
- "stone" — used consistently
- "glob" — used consistently

**why it holds**: all terms match extant usage.

### rule.require.fail-fast

checked for error paths:
- function has no explicit error paths
- relies on `enumFilesFromGlob` to throw on invalid glob
- returns `[]` for no matches (not an error)

**why it holds**: behavior is correct for a retrieval function.

---

## found issues: none

all 35 lines of changed code follow mechanic role standards. no violations detected.

---

## conclusion

code adheres to all checked mechanic standards:
- jsdoc with .what/.why
- arrow function with input pattern
- const declarations
- no gerunds
- narrative flow with comments
- no else branches
- no buzzwords
- consistent terminology
