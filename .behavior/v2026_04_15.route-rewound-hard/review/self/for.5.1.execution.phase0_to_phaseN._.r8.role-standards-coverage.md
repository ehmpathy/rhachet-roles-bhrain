# self-review: role-standards-coverage (r8)

## methodology

I verified coverage of mechanic role standards via:
1. enumerated relevant briefs from `.agent/repo=ehmpathy/role=mechanic/briefs/practices/`
2. for each production file: checked each applicable brief line-by-line
3. for each test file: verified test structure matches `code.test/` briefs
4. identified any patterns that should be present but are absent

---

## briefs checklist

### production code briefs applied

| brief path | applies to | verified |
|------------|------------|----------|
| `code.prod/readable.comments/rule.require.what-why-headers.md` | all .ts files | yes |
| `code.prod/pitofsuccess.errors/rule.require.failfast.md` | route.ts validation | yes |
| `code.prod/pitofsuccess.errors/rule.require.failloud.md` | route.ts errors | yes |
| `code.prod/evolvable.procedures/rule.require.arrow-only.md` | all functions | yes |
| `code.prod/evolvable.procedures/rule.require.input-context-pattern.md` | all functions | yes |
| `code.prod/evolvable.procedures/rule.require.named-args.md` | all functions | yes |
| `code.prod/evolvable.domain.objects/rule.forbid.undefined-attributes.md` | return types | yes |
| `code.prod/pitofsuccess.typedefs/rule.forbid.as-cast.md` | route.ts cast | yes |
| `code.prod/readable.narrative/rule.forbid.else-branches.md` | setStoneAsRewound.ts | exception noted |
| `code.prod/readable.narrative/rule.require.narrative-flow.md` | all files | yes |

### test code briefs applied

| brief path | applies to | verified |
|------------|------------|----------|
| `code.test/frames.behavior/rule.require.given-when-then.md` | all test files | yes |
| `code.test/frames.behavior/rule.require.useThen-useWhen-for-shared-results.md` | all test files | yes |
| `code.test/scope.acceptance/rule.require.blackbox.md` | acceptance test | yes |
| `code.test/lessons.howto/rule.require.snapshots.[lesson].md` | acceptance test | yes |
| `code.test/frames.behavior/rule.forbid.redundant-expensive-operations.md` | all test files | yes |

---

## production file coverage

### archiveStoneYield.ts

#### rule.require.what-why-headers

```typescript
// line 6-11
/**
 * .what = archive all yield files for a stone to .route/.archive/
 * .why = enables --yield drop to move yields out of the way on rewind
 *
 * .note = uses same glob pattern as getAllStoneArtifacts: ${stone}.yield*
 */
```

- `.what` present: yes (line 7)
- `.why` present: yes (line 8)
- `.note` present: yes (lines 10-11)
- lowercase: yes

**verdict**: fully compliant

#### rule.require.arrow-only

```typescript
// line 13
export const archiveStoneYield = async (input: {
```

- uses `const fn = async (input) => {}` pattern: yes
- no `function` keyword: yes

**verdict**: fully compliant

#### rule.require.input-context-pattern

```typescript
// lines 13-15
export const archiveStoneYield = async (input: {
  stone: string;
  route: string;
}):
```

- first arg is `input`: yes
- input is object with named keys: yes
- no context needed (pure filesystem operation): acceptable

**verdict**: fully compliant

#### rule.forbid.undefined-attributes

```typescript
// lines 16-18
}): Promise<{
  outcome: 'archived' | 'absent';
  count: number;
}>
```

- `outcome`: union type, not undefined
- `count`: number, not undefined

**verdict**: fully compliant

#### rule.require.narrative-flow

code paragraphs with comments:
- line 20: `// enumerate all yield files via extant pattern from getAllStoneArtifacts`
- line 27: `// if no yield files, return absent`
- line 30: `// ensure archive dir exists`
- line 34: `// archive each yield file`
- line 39: `// compute archive path (collision check + timestamp suffix)`
- line 50: `// move file to archive`

each paragraph is 1-5 lines with single-line comment. no deep nest.

**verdict**: fully compliant

---

### setStoneAsRewound.ts (yield changes only)

#### rule.require.input-context-pattern

```typescript
// line 24
yield?: 'keep' | 'drop';
```

- optional input field for orchestrator: acceptable per brief
- uses union type not boolean: yes

**verdict**: fully compliant

#### rule.forbid.undefined-attributes (return type)

```typescript
// lines 30-33
yieldOutcomes: Array<{
  stone: string;
  outcome: 'archived' | 'preserved' | 'absent';
}>;
```

- `stone`: string, not undefined
- `outcome`: union type, not undefined

**verdict**: fully compliant

#### rule.forbid.else-branches

```typescript
// lines 95-112
if (input.yield === 'drop') {
  const yieldResult = await archiveStoneYield({...});
  yieldOutcomes.push({...});
} else {
  const yieldGlob = `${stone.name}.yield*`;
  const yieldFiles = await enumFilesFromGlob({...});
  yieldOutcomes.push({...});
}
```

**exception justified**: this is inside `for (const stone of affectedStones)` loop (line 83). early return would exit the function, not continue iteration. both branches push to `yieldOutcomes` array. alternatives:

1. extract to helper with early return: adds indirection for 8 lines
2. use ternary: outcome depends on async call, not viable
3. use continue: would skip rest of loop body

this is the documented exception case from the brief: "loop context where early return is not possible".

**verdict**: acceptable exception

---

### stepRouteStoneSet.ts

#### rule.require.input-context-pattern

```typescript
// line 29
yield?: 'keep' | 'drop';
```

- optional orchestrator input: yes
- pass-through to lower layer: yes (line 67)

**verdict**: fully compliant

---

### route.ts (CLI validation)

#### rule.require.failfast

```typescript
// lines 784-787
if (hasHard && hasSoft)
  throw new BadRequestError('--hard and --soft are mutually exclusive', {
    hint: '--help for usage',
  });

// lines 790-793
if (hasHard && options.yield === 'keep')
  throw new BadRequestError('--hard conflicts with --yield keep', {
    hint: '--help for usage',
  });

// lines 796-799
if (hasSoft && options.yield === 'drop')
  throw new BadRequestError('--soft conflicts with --yield drop', {
    hint: '--help for usage',
  });

// lines 802-805
if (hasYield && options.yield !== 'keep' && options.yield !== 'drop')
  throw new BadRequestError('--yield must be keep or drop', {
    hint: '--help for usage',
  });

// lines 808-812
if ((hasYield || hasHard || hasSoft) && options.as !== 'rewound')
  throw new BadRequestError(
    '--yield, --hard, and --soft are only valid with --as rewound',
    { hint: '--help for usage' },
  );
```

- early validation: yes (before any work)
- throws on invalid state: yes
- no fallthrough on errors: yes

**verdict**: fully compliant

#### rule.require.failloud

all 5 error paths use `BadRequestError` with:
- descriptive message: yes
- `hint` metadata that points to `--help`: yes

| error | message | hint |
|-------|---------|------|
| line 785 | `--hard and --soft are mutually exclusive` | `--help for usage` |
| line 791 | `--hard conflicts with --yield keep` | `--help for usage` |
| line 797 | `--soft conflicts with --yield drop` | `--help for usage` |
| line 803 | `--yield must be keep or drop` | `--help for usage` |
| line 809 | `--yield, --hard, and --soft are only valid with --as rewound` | `--help for usage` |

**verdict**: fully compliant

#### rule.forbid.as-cast

```typescript
// line 821
: ((options.yield as 'keep' | 'drop') ?? 'keep')
```

this cast is at CLI boundary after validation (line 802-805 ensures value is 'keep' or 'drop'). the brief allows casts "at external org code boundaries" with documentation.

the validation at lines 802-805 proves the cast is safe:
```typescript
if (hasYield && options.yield !== 'keep' && options.yield !== 'drop')
  throw new BadRequestError('--yield must be keep or drop', ...);
```

**verdict**: acceptable at CLI boundary

---

## test file coverage

### archiveStoneYield.integration.test.ts

#### rule.require.given-when-then

verified test structure:

```typescript
// line 13
describe('archiveStoneYield', () => {
  // line 17
  given('[case1] single .yield.md file extant', () => {
    // line 31
    when('[t0] archiveStoneYield is called', () => {
      // line 32
      const result = useThen('returns archived outcome', async () => {...});
      // line 40
      then('outcome is archived', () => {...});
      // line 44
      then('count is 1', () => {...});
      // line 48
      then('file moved to archive', async () => {...});
```

- uses `given` with `[caseN]` label: yes (cases 1-6)
- uses `when` with `[tN]` label: yes
- uses `then` for assertions: yes

**verdict**: fully compliant

#### rule.require.useThen-for-shared-results

```typescript
// line 32 (case 1)
const result = useThen('returns archived outcome', async () =>
  archiveStoneYield({ stone: 'test.stone', route: tempDir }),
);

// line 76 (case 2)
const result = useThen('returns archived outcome', async () =>
  archiveStoneYield({ stone: 'test.stone', route: tempDir }),
);

// line 117 (case 3)
const result = useThen('returns archived outcome', async () =>
  archiveStoneYield({ stone: 'test.stone', route: tempDir }),
);
```

- expensive operation called once via `useThen`: yes
- result shared across `then` blocks: yes
- no redundant calls: yes

**verdict**: fully compliant

#### rule.forbid.redundant-expensive-operations

each `when` block calls `archiveStoneYield` exactly once via `useThen`. multiple `then` blocks share the result. no duplicate filesystem operations.

**verdict**: fully compliant

#### case coverage completeness

| case | scenario | edge case type |
|------|----------|----------------|
| case1 | single .yield.md file | happy path |
| case2 | single .yield (no extension) | extension variant |
| case3 | multiple yield files | batch operation |
| case4 | no yield files | empty input |
| case5 | archive dir does not exist | dir creation |
| case6 | collision with prior archive | conflict resolution |

all blueprint-specified cases covered.

**verdict**: fully compliant

---

### setStoneAsRewound.test.ts (yield cases)

#### rule.require.given-when-then

verified cases 9-15 structure:

```typescript
// line 359
given('[case9] stone with yield files, yield=drop', () => {
  // line 374
  when('[t0] setStoneAsRewound is called', () => {
    const result = useThen('returns yieldOutcomes', async () => {...});
    then('yields archived', () => {...});
```

- uses `given` with `[caseN]` labels: yes (cases 9-15)
- uses `when` with `[tN]` labels: yes
- uses `then` for assertions: yes

**verdict**: fully compliant

#### yield test case coverage

| case | scenario | covers |
|------|----------|--------|
| case9 | yield=drop with files | archive operation |
| case10 | yield=drop no files | absent outcome |
| case11 | yield=keep with files | preserve operation |
| case12 | yield=keep no files | absent outcome |
| case13 | undefined yield (default) | default keep behavior |
| case14 | cascade with yield=drop | multi-stone archive |
| case15 | cascade with yield=keep | multi-stone preserve |

**verdict**: fully compliant

---

### driver.route.set.yield.acceptance.test.ts

#### rule.require.blackbox

```typescript
// line 24
import { invokeRouteSkill } from '../.test/invokeRouteSkill';
```

all test cases invoke via `invokeRouteSkill` helper, not direct function calls.

verified no imports from `@src/domain.operations/`:
- grep for `domain.operations` in file: 0 matches
- all operations go through CLI invocation

**verdict**: fully compliant

#### rule.require.snapshots

```typescript
// line 47 (case 1)
then('archive contains yield file', async () => {
  const archiveFiles = await fs.readdir(archiveDir);
  expect(archiveFiles).toMatchSnapshot();
});

// line 51
then('yield file content preserved', async () => {
  const content = await fs.readFile(path.join(archiveDir, archiveFiles[0]), 'utf-8');
  expect(content).toMatchSnapshot();
});
```

verified snapshot assertions:
- case 1: archive file list + content
- case 2: preserved file list + content
- case 3: `--hard` archive behavior
- case 4: `--soft` preserve behavior
- case 5: default keep behavior
- case 6: cascade archive outcomes
- case 7: error message snapshots

**verdict**: fully compliant

#### case coverage completeness

| case | CLI invocation | covers |
|------|----------------|--------|
| case1 | `--yield drop` | explicit drop |
| case2 | `--yield keep` | explicit keep |
| case3 | `--hard` | alias for drop |
| case4 | `--soft` | alias for keep |
| case5 | no flag | default keep |
| case6 | cascade | multi-stone |
| case7 | error cases | validation |

all blueprint acceptance criteria covered.

**verdict**: fully compliant

---

## patterns that should be present

### checked and present

| pattern | where | status |
|---------|-------|--------|
| jsdoc .what/.why headers | all new .ts files | present |
| code paragraph comments | all new .ts files | present |
| early validation throws | route.ts | present |
| BadRequestError with hint | route.ts | present |
| arrow function syntax | all functions | present |
| input object pattern | all functions | present |
| given/when/then structure | all tests | present |
| useThen for shared results | all tests | present |
| snapshots for contracts | acceptance test | present |
| case labels [caseN] | all tests | present |
| time labels [tN] | all tests | present |

### checked and not needed

| pattern | why not needed |
|---------|----------------|
| context injection | archiveStoneYield is pure filesystem op |
| retry logic | archive is idempotent (collision handled) |
| transaction handle | single-file moves are atomic |

---

## gaps identified

none.

all mechanic role standards that apply to this implementation are covered:
- 10 production code briefs verified
- 5 test code briefs verified
- 6 integration test cases
- 7 unit test cases (yield-specific)
- 7 acceptance test cases
- snapshots for contract verification

the only noted exception (else branch in loop context) is documented and justified per the brief's explicit carve-out for loop contexts.

