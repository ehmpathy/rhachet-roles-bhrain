# has-ergonomics-validated review (r9)

## slow review process

1. locate the repros artifact for planned input/output
2. identify alternative sources for ergonomics validation
3. read the actual implementation line by line
4. read the actual tests line by line
5. map each criteria contract to implementation
6. articulate why each ergonomic holds

---

## step 1: locate repros artifact

no `3.2.distill.repros*` artifact exists. this is valid because:
- this is an internal infrastructure change
- users don't interact with artifact pattern resolution directly
- the "ergonomics" are file name conventions, not UI/API contracts

---

## step 2: alternative ergonomics sources

| artifact | validation type |
|----------|-----------------|
| 1.vision.md | before/after name examples |
| 2.1.criteria.blackbox | usecase contracts |
| implementation | actual code |
| tests | actual assertions |

---

## step 3: read implementation line by line

**file:** `src/domain.operations/route/stones/asArtifactByPriority.ts`

```typescript
// lines 12-15: input contract
export const asArtifactByPriority = (input: {
  artifacts: string[];
  stoneName: string;
}): string | null => {
```

**input:**
- `artifacts: string[]` — list of file paths
- `stoneName: string` — stone identifier (e.g., "1.vision")

**output:**
- `string | null` — highest priority artifact or null

```typescript
// lines 20-26: priority patterns
const patterns: Array<{
  suffix: string | RegExp;
  priority: number;
}> = [
  { suffix: '.yield.md', priority: 1 },
  { suffix: /\.yield\.[^.]+$/, priority: 2 }, // .yield.*
  { suffix: '.yield', priority: 3 },
  { suffix: '.v1.i1.md', priority: 4 },
  { suffix: '.i1.md', priority: 5 },
];
```

**priority order:**
1. `.yield.md` — new default
2. `.yield.*` — non-markdown yields
3. `.yield` — extensionless
4. `.v1.i1.md` — legacy
5. `.i1.md` — test pattern

---

## step 4: read tests line by line

**file:** `src/domain.operations/route/stones/asArtifactByPriority.test.ts`

### test case 1: priority preference (lines 6-17)

```typescript
given('[case1] .yield.md and .v1.i1.md both present', () => {
  const artifacts = ['1.vision.yield.md', '1.vision.v1.i1.md'];

  when('[t0] priority is resolved', () => {
    then('.yield.md is preferred over .v1.i1.md', () => {
      const result = asArtifactByPriority({
        artifacts,
        stoneName: '1.vision',
      });
      expect(result).toEqual('1.vision.yield.md');
    });
  });
});
```

**input:** `['1.vision.yield.md', '1.vision.v1.i1.md']`
**output:** `'1.vision.yield.md'`
**why it holds:** priority 1 (`.yield.md`) beats priority 4 (`.v1.i1.md`)

### test case 4: backwards compat (lines 48-60)

```typescript
given('[case4] only .v1.i1.md present (backwards compat)', () => {
  const artifacts = ['1.vision.v1.i1.md'];

  when('[t0] priority is resolved', () => {
    then('.v1.i1.md is recognized', () => {
      const result = asArtifactByPriority({
        artifacts,
        stoneName: '1.vision',
      });
      expect(result).toEqual('1.vision.v1.i1.md');
    });
  });
});
```

**input:** `['1.vision.v1.i1.md']`
**output:** `'1.vision.v1.i1.md'`
**why it holds:** prior behaviors continue to work

### test case 9: fallback (lines 118-130)

```typescript
given('[case9] fallback to any .md if no pattern matched', () => {
  const artifacts = ['1.vision.notes.md', '1.vision.other.txt'];

  when('[t0] priority is resolved', () => {
    then('first .md file is returned as fallback', () => {
      const result = asArtifactByPriority({
        artifacts,
        stoneName: '1.vision',
      });
      expect(result).toEqual('1.vision.notes.md');
    });
  });
});
```

**input:** `['1.vision.notes.md', '1.vision.other.txt']`
**output:** `'1.vision.notes.md'`
**why it holds:** graceful degradation for non-standard patterns

---

## step 5: map criteria to implementation

### criteria usecase.1

| criteria | test case | input | output | verified |
|----------|-----------|-------|--------|----------|
| `{stone}.yield.md` recognized | case1 | `['1.vision.yield.md', '1.vision.v1.i1.md']` | `'1.vision.yield.md'` | ✓ |
| `{stone}.yield.json` recognized | case2 | `['1.vision.yield.json']` | `'1.vision.yield.json'` | ✓ |
| `{stone}.yield` (extensionless) | case3 | `['1.vision.yield']` | `'1.vision.yield'` | ✓ |
| `{stone}.v1.i1.md` recognized | case4 | `['1.vision.v1.i1.md']` | `'1.vision.v1.i1.md'` | ✓ |

### criteria usecase.2

| criteria | test case | input | output | verified |
|----------|-----------|-------|--------|----------|
| `.yield.md` > `.v1.i1.md` | case1 | `['1.vision.yield.md', '1.vision.v1.i1.md']` | `'1.vision.yield.md'` | ✓ |
| `.yield.md` > `.yield.*` | case7 | `['1.vision.yield.json', '1.vision.yield.md']` | `'1.vision.yield.md'` | ✓ |
| `.yield.*` > `.yield` | case8 | `['1.vision.yield', '1.vision.yield.json']` | `'1.vision.yield.json'` | ✓ |

---

## step 6: why each ergonomic holds

### ergonomic 1: new pattern preferred

**criteria:** `.yield.md` is the new default
**implementation:** priority 1 in patterns array (line 21)
**test:** case1 verifies `.yield.md` beats `.v1.i1.md`
**why it holds:** users who adopt the new pattern get the clearer name

### ergonomic 2: backwards compat preserved

**criteria:** `.v1.i1.md` must still work
**implementation:** priority 4 in patterns array (line 24)
**test:** case4 verifies `.v1.i1.md` alone is recognized
**why it holds:** prior behaviors don't break

### ergonomic 3: flexible extensions

**criteria:** `.yield.*` supports non-markdown
**implementation:** regex `/\.yield\.[^.]+$/` at priority 2 (line 22)
**test:** case2 verifies `.yield.json` is recognized
**why it holds:** users can yield JSON, YAML, etc.

### ergonomic 4: graceful degradation

**criteria:** (implied) don't fail on unusual patterns
**implementation:** fallback to first `.md` file (line 39)
**test:** case9 verifies `notes.md` works when no pattern matched
**why it holds:** non-standard artifacts don't cause errors

---

## summary

| question | answer | evidence |
|----------|--------|----------|
| input contract match? | yes | `{ artifacts, stoneName }` matches criteria |
| output contract match? | yes | `string \| null` returns artifact or null |
| priority order match? | yes | implementation lines 20-26 match criteria usecase.2 |
| backwards compat? | yes | case4 verifies `.v1.i1.md` works |
| drift identified? | none | extra cases (5, 9) enhance without drift |

**ergonomics validated.** each criteria contract maps directly to a test case with concrete input/output. implementation follows the priority order specified in criteria. no drift detected.

