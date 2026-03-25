# self-review: role-standards-coverage (r8)

## question

are all applicable mechanic role standards covered in the implementation?

---

## standards inventory

I opened `.agent/repo=ehmpathy/role=mechanic/briefs/practices/` and enumerated relevant subdirectories:

1. `code.prod/evolvable.procedures/` — function patterns (arrow-only, input-context, etc.)
2. `code.prod/readable.comments/` — jsdoc requirements (.what/.why headers)
3. `code.prod/readable.narrative/` — flow patterns (no else, narrative flow)
4. `code.prod/pitofsuccess.errors/` — error patterns (fail-fast, no failhide)
5. `code.prod/pitofsuccess.procedures/` — idempotency requirements
6. `code.prod/pitofsuccess.typedefs/` — type safety (no as-cast, shapefit)
7. `lang.terms/` — forbidden terms, gerunds, treestruct names
8. `lang.tones/` — lowercase preference, no buzzwords

---

## getAllStoneArtifacts.ts line-by-line verification

I opened the file and read each line:

### lines 1-2: imports

```ts
import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';
```

| standard | requirement | code | holds? | why |
|----------|-------------|------|--------|-----|
| rule.require.directional-deps | import from lower layers | RouteStone from domain.objects, enumFilesFromGlob from utils | yes | both are lower than domain.operations |

### lines 4-9: jsdoc header

```ts
/**
 * .what = retrieves artifact files for a specific stone
 * .why = enables artifact presence to be verified before passage
 *
 * .note = globs run from repo root; $route is expanded to input.route
 */
```

| standard | requirement | code | holds? | why |
|----------|-------------|------|--------|-----|
| rule.require.what-why-headers | .what and .why in jsdoc | present | yes | lines 5-6 have both |
| rule.forbid.gerunds | no -ing nouns | "retrieves" is present tense verb | yes | not a gerund |
| rule.prefer.lowercase | lowercase in comments | all lowercase | yes | matches preference |

### lines 10-13: function signature

```ts
export const getAllStoneArtifacts = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<string[]> => {
```

| standard | requirement | code | holds? | why |
|----------|-------------|------|--------|-----|
| rule.require.arrow-only | arrow function | `=> {` syntax | yes | no function keyword |
| rule.require.input-context-pattern | (input, context?) args | single `input` object | yes | no positional args |
| rule.forbid.io-as-interfaces | inline types | `{ stone, route }` inline | yes | not extracted to interface |
| rule.require.treestruct | [verb][...noun] name | getAll + Stone + Artifacts | yes | verb first, noun hierarchy |
| rule.forbid.gerunds | no gerunds in name | "getAllStoneArtifacts" | yes | no -ing suffix |

### lines 14-19: glob determination

```ts
  // determine glob pattern from guard or default
  const hasCustomArtifacts =
    input.stone.guard?.artifacts && input.stone.guard.artifacts.length > 0;
  const globs = hasCustomArtifacts
    ? input.stone.guard!.artifacts
    : [`${input.route}/${input.stone.name}*.md`];
```

| standard | requirement | code | holds? | why |
|----------|-------------|------|--------|-----|
| rule.require.immutable-vars | use const | `const hasCustomArtifacts`, `const globs` | yes | no let or var |
| rule.forbid.else-branches | no if/else | ternary `? :` | yes | ternary for assignment is allowed |
| rule.require.narrative-flow | comment before code | line 14 comment precedes block | yes | explains what follows |
| rule.forbid.gerunds | no gerunds | hasCustomArtifacts, globs | yes | neither has -ing |
| rule.forbid.as-cast | no as X casts | `input.stone.guard!.artifacts` | yes | `!` assertion, not `as` cast |

**note on `!` assertion**: the `!` at line 18 is safe because `hasCustomArtifacts` guarantees `guard.artifacts` exists. this is not a rule.forbid.as-cast violation since `!` is a non-null assertion, not a type cast.

### lines 21-31: enumeration loop

```ts
  // enumerate all matches across all globs
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

| standard | requirement | code | holds? | why |
|----------|-------------|------|--------|-----|
| rule.require.narrative-flow | flat code | single for loop, no nested blocks | yes | one level deep |
| rule.require.immutable-vars | const declarations | `const allMatches`, `const expandedGlob`, `const matches` | yes | array mutation via push is acceptable |
| rule.forbid.gerunds | no gerunds | expandedGlob, allMatches, matches | yes | none have -ing |
| rule.require.narrative-flow | comment before block | line 21, line 24 | yes | both blocks preceded by comment |
| rule.prefer.lowercase | lowercase comments | all lowercase | yes | matches preference |

**note on array mutation**: `allMatches.push(...matches)` mutates the array but does not reassign the variable. this is acceptable per rule.require.immutable-vars which forbids `let`/`var`, not array methods.

### line 33: return

```ts
  return allMatches;
```

simple return, no standards applicable.

---

## parseStoneGuard.ts lines 147-151 verification

I opened the file and read the change:

```ts
      // strip outer quotes (yaml string delimiters)
      const unquoted = value.replace(/^["'](.*)["']$/, '$1');

      if (currentKey === 'artifacts') {
        result.artifacts?.push(unquoted);
```

| standard | requirement | code | holds? | why |
|----------|-------------|------|--------|-----|
| rule.require.narrative-flow | comment before code | line 147 precedes line 148 | yes | explains the regex |
| rule.require.immutable-vars | const | `const unquoted` | yes | not let |
| rule.forbid.gerunds | no gerunds | "strip" is imperative verb | yes | comment uses verb, not gerund |
| rule.forbid.else-branches | no else | single if block | yes | no else clause |

**note on pattern consistency**: this change follows the extant pattern at lines 152-155 where `judges` and `protect` push values. the only difference is quote removal for artifacts, which is necessary because artifact values are glob patterns that should not contain literal quotes.

---

## standards not applicable

| standard | why not applicable |
|----------|-------------------|
| rule.require.fail-fast | no invalid inputs possible; empty route produces empty results |
| rule.forbid.failhide | no try/catch blocks |
| rule.require.idempotent-procedures | read-only operation, no state mutation |
| rule.forbid.nonidempotent-mutations | no mutations to external state |
| rule.require.dependency-injection | no dependencies to inject (uses global process.cwd) |

---

## gaps found: none

I checked each line of both changed files against the standards inventory. all applicable standards are present:

1. jsdoc with .what/.why at lines 4-9
2. arrow function at line 10
3. input pattern at lines 10-13
4. inline types at lines 11-12
5. const declarations throughout
6. no gerunds in any name or comment
7. narrative flow with comments at lines 14, 21, 24, 147
8. no else branches
9. no as-casts
10. treestruct name: getAll + Stone + Artifacts

---

## conclusion

every line of changed code covers all applicable mechanic standards. no gaps, no omissions, no violations.
