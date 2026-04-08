# role standards coverage review

## slow review process

1. enumerated relevant briefs directories
2. identified which standards apply to each file
3. verified all applicable standards are present
4. checked for patterns that SHOULD be present but are absent

## briefs directories checked

| directory | standards that apply |
|-----------|---------------------|
| `code.test/` | test coverage for transformers |
| `code.prod/readable.comments/` | what-why headers |
| `code.prod/readable.narrative/` | code paragraphs, no else branches |
| `code.prod/evolvable.procedures/` | input-context, arrow functions, immutable vars |
| `code.prod/pitofsuccess.typedefs/` | explicit types, no `as` casts |
| `code.prod/pitofsuccess.procedures/` | single responsibility, idempotency |
| `lang.tones/` | lowercase comments |

## files reviewed

```
src/domain.operations/route/stones/asArtifactByPriority.ts (new)
src/domain.operations/route/stones/asArtifactByPriority.test.ts (new)
src/domain.operations/route/stones/getAllStoneArtifacts.ts (modified)
src/domain.operations/route/stones/getAllStoneDriveArtifacts.ts (modified)
```

## coverage check by file

### asArtifactByPriority.ts

#### rule.require.test-coverage-by-grain

**rule requires:**
- transformers need unit tests
- pure transformers are testable without mocks

**coverage:**
- `asArtifactByPriority.test.ts` exists
- 9 test cases cover:
  - case1-5: individual pattern recognition
  - case6: no match returns null
  - case7-9: priority between patterns

**why it holds:**
- the transformer is pure (no i/o, no dependencies)
- all 5 priority patterns are tested individually
- edge cases (null return, fallback to any .md) are covered
- priority comparisons between patterns are tested

#### rule.require.explicit-types

**rule requires:**
- return types must be explicit
- input types must be explicit

**code (lines 12-15):**
```typescript
export const asArtifactByPriority = (input: {
  artifacts: string[];
  stoneName: string;
}): string | null => {
```

**why it holds:**
- input is typed inline: `{ artifacts: string[]; stoneName: string }`
- return is explicit: `string | null`
- internal type at line 17-20 is explicit: `Array<{ suffix: string | RegExp; priority: number }>`
- no `any` anywhere in file
- no `as` casts anywhere in file

#### rule.forbid.as-cast

**rule requires:**
- no `as` casts unless at external boundary

**verification:**
- grep for `as ` in file: no matches
- grep for `: any` in file: no matches

**why it holds:**
- types fit naturally without casts
- `Array.find()` returns `string | undefined`, nullish coalesce handles undefined
- no external data parsing needed

#### rule.require.narrative-flow

**rule requires:**
- flat code paragraphs with comment titles
- no nested if/else blocks
- early returns

**code paragraph verification:**
- line 16: `// define priority patterns (order matters)` — paragraph 1
- line 28: `// find highest priority match` — paragraph 2
- line 38: `// fallback: return first .md match or null` — paragraph 3

**why it holds:**
- three distinct code paragraphs, each with comment title
- no `else` branches in file
- early return at line 35: `if (match) return match;`
- flat structure: no nested conditionals

#### rule.require.immutable-vars

**rule requires:**
- all variables must be `const`
- no `let` or `var`

**verification line by line:**
- line 17: `const patterns` — immutable
- line 30: `const match` — immutable inside loop

**why it holds:**
- no `let` declarations in file
- no `var` declarations in file
- no mutations of arrays or objects

#### rule.require.single-responsibility

**rule requires:**
- one export per file
- filename matches export name

**verification:**
- single export: `export const asArtifactByPriority`
- filename: `asArtifactByPriority.ts`
- purpose: resolve artifact priority (one responsibility)

**why it holds:**
- only one `export` statement in file
- no helper functions exported
- name matches filename exactly

#### rule.prefer.lowercase

**rule requires:**
- comments use lowercase
- capitalize only code constructs

**verification:**
- line 2: `.what = resolves artifact priority...` — lowercase
- line 3: `.why = ensures consistent artifact...` — lowercase
- line 16: `// define priority patterns...` — lowercase
- line 28: `// find highest priority match` — lowercase
- line 38: `// fallback: return first .md...` — lowercase

**why it holds:**
- all comment content starts lowercase
- no shouting (ALL CAPS) in comments

### asArtifactByPriority.test.ts

#### howto.write-bdd-lesson coverage

**rule requires:**
- wrap tests in single describe
- use given/when/then structure
- label given with [caseN], when with [tN]

**verification line by line:**
- line 1: imports `{ given, then, when }` from test-fns
- line 5: `describe('asArtifactByPriority', () => {` — single describe
- line 6: `given('[case1]...` — labeled given
- line 9: `when('[t0]...` — labeled when
- line 10: `then('...` — then inside when

**all 9 cases verified:**
- case1 (line 6), case2 (line 20), case3 (line 34)
- case4 (line 48), case5 (line 62), case6 (line 76)
- case7 (line 90), case8 (line 104), case9 (line 118)
- all use `[t0]` for when (single action per case)

**why it holds:**
- imports given/when/then from test-fns (not describe/it)
- no bare `describe`, `it`, or `test` blocks
- consistent labeling pattern throughout

#### rule.require.immutable-vars (in tests)

**verification:**
- all `artifacts` declarations use `const`
- no `let` or mutation in tests

**why it holds:**
- tests follow same immutability pattern as prod code

### getAllStoneArtifacts.ts

#### extant coverage maintained

**question:** did changes break extant standards?

**verification:**
- .what/.why headers: preserved (lines 4-9)
- arrow function: preserved (line 10)
- input-context pattern: preserved (line 10-12)

**changes reviewed (lines 21-22):**
```typescript
`${input.route}/${input.stone.name}.yield*`,
`${input.route}/${input.stone.name}*.md`,
```

**why it holds:**
- changes only extended glob patterns
- no new variables introduced
- no new control flow
- no new error paths
- structure unchanged

### getAllStoneDriveArtifacts.ts

#### extant coverage maintained

**question:** did changes break extant standards?

**verification:**
- .what/.why headers: preserved (lines 9-12)
- arrow function: preserved (line 13)
- input-context pattern: preserved (line 13-15)

**changes reviewed:**
- line 24: `const yieldGlob` — new const
- line 25: `const legacyGlob` — new const
- lines 26-29: first enumFilesFromGlob call
- lines 30-33: second enumFilesFromGlob call
- line 35: `const outputs = [...new Set([...yieldMatches, ...legacyMatches])]`

**new code adheres to standards:**
- both new variables are `const`
- Set deduplication uses spread (no mutation)
- no new control flow branches
- no new error handling needed

**why it holds:**
- changes extend glob enumeration only
- immutability preserved via const + spread
- no new types or casts introduced

## gaps analysis: patterns that SHOULD be present

### checked for absent patterns

| standard | should apply? | is present? | notes |
|----------|---------------|-------------|-------|
| rule.require.failfast | no | n/a | pure transformer, no error paths |
| rule.require.failloud | no | n/a | no errors thrown |
| rule.forbid.else-branches | yes | yes | no else in any file |
| rule.forbid.gerunds | yes | yes | no gerunds found |
| rule.require.idempotent | yes | yes | pure function, same input = same output |

### verification: no error handling needed

**why failfast/failloud don't apply:**
- `asArtifactByPriority` is a pure transformer
- all inputs are valid (array of strings, string name)
- invalid inputs (empty array) return `null` as designed
- no external calls that could fail
- no file i/o, no network, no database

### verification: idempotency

**why it holds:**
- pure function: `f(x) = f(x)` always
- no side effects
- no external state
- deterministic: same artifacts + stoneName always yields same result

## gaps found

**none.** all applicable standards are present. standards that don't apply (error handling) were explicitly verified as not applicable.

## summary

| file | standards applicable | standards present | verified absent |
|------|---------------------|-------------------|-----------------|
| asArtifactByPriority.ts | 7 | 7 | 2 (n/a) |
| asArtifactByPriority.test.ts | 2 | 2 | 0 |
| getAllStoneArtifacts.ts | extant | extant | 0 |
| getAllStoneDriveArtifacts.ts | extant | extant | 0 |

**all applicable mechanic standards are covered. absent patterns verified as not applicable.**
