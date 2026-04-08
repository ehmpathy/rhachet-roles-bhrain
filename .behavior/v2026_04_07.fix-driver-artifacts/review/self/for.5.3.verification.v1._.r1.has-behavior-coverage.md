# has-behavior-coverage review

## slow review process

1. read the wish (0.wish.md) line by line
2. read the vision (1.vision.md) line by line
3. for each behavior, verify it appears in the verification checklist
4. for each checklist entry, verify the test file exists and contains the case

## the question

does the verification checklist show every behavior from wish/vision has a test?

## answer

**yes.** every behavior from wish and vision is covered in the verification checklist.

---

## wish coverage (0.wish.md)

### wish line 3-4: `.yield.md` as new default

wish says: replace `v1.i1.md` pattern with `yield.md` pattern as the default artifact symbol.

**verification checklist entry (5.3.verification.v1.i1.md line 8):**
```
| recognize `{stone}.yield.md` as artifact | `asArtifactByPriority.test.ts` case1, case7 | n/a (unit) | ✓ |
```

**test file evidence (asArtifactByPriority.test.ts lines 6-17):**
```typescript
given('[case1] .yield.md and .v1.i1.md both present', () => {
  const artifacts = ['1.vision.yield.md', '1.vision.v1.i1.md'];
  // ...
  then('.yield.md is preferred over .v1.i1.md', () => {
    expect(result).toEqual('1.vision.yield.md');
  });
});
```

**why it holds:** test case creates both patterns, asserts `.yield.md` is selected.

---

### wish line 9: support `.yield.*` variants

wish says: support `.yield`, `.yield.md`, `.yield.*` variants.

**verification checklist entry (5.3.verification.v1.i1.md line 9):**
```
| recognize `{stone}.yield.*` variants | `asArtifactByPriority.test.ts` case2 | n/a (unit) | ✓ |
```

**test file evidence (asArtifactByPriority.test.ts lines 20-32):**
```typescript
given('[case2] .yield.json present', () => {
  const artifacts = ['1.vision.yield.json'];
  // ...
  then('.yield.json is recognized', () => {
    expect(result).toEqual('1.vision.yield.json');
  });
});
```

**why it holds:** test case uses `.yield.json` (a non-md extension), asserts it is recognized.

---

### wish line 9: support `.yield` extensionless

**verification checklist entry (5.3.verification.v1.i1.md line 10):**
```
| recognize `{stone}.yield` extensionless | `asArtifactByPriority.test.ts` case3 | n/a (unit) | ✓ |
```

**test file evidence (asArtifactByPriority.test.ts lines 34-46):**
```typescript
given('[case3] .yield extensionless present', () => {
  const artifacts = ['1.vision.yield'];
  // ...
  then('.yield extensionless is recognized', () => {
    expect(result).toEqual('1.vision.yield');
  });
});
```

**why it holds:** test case uses extensionless `.yield`, asserts it is recognized.

---

### wish line 8: backwards compat for `.v1.i1.md`

wish says: support priors as artifacts by default too (.v1.i1.md).

**verification checklist entry (5.3.verification.v1.i1.md line 11):**
```
| recognize `{stone}.v1.i1.md` (backwards compat) | `asArtifactByPriority.test.ts` case4 | n/a (unit) | ✓ |
```

**test file evidence (asArtifactByPriority.test.ts lines 48-60):**
```typescript
given('[case4] only .v1.i1.md present (backwards compat)', () => {
  const artifacts = ['1.vision.v1.i1.md'];
  // ...
  then('.v1.i1.md is recognized', () => {
    expect(result).toEqual('1.vision.v1.i1.md');
  });
});
```

**why it holds:** test case uses legacy pattern alone, asserts it is recognized.

---

## vision coverage (1.vision.md)

### vision table: priority order

from vision "artifact pattern flexibility" section:

| pattern | priority |
|---------|----------|
| `{stone}.yield.md` | 1 (highest) |
| `{stone}.yield.*` | 2 |
| `{stone}.yield` | 3 |
| `{stone}.v1.i1.md` | 4 (lowest) |

**verification checklist entries (5.3.verification.v1.i1.md lines 13-15):**
```
| priority: `.yield.md` over `.v1.i1.md` | `asArtifactByPriority.test.ts` case1 | n/a (unit) | ✓ |
| priority: `.yield.md` over `.yield.*` | `asArtifactByPriority.test.ts` case7 | n/a (unit) | ✓ |
| priority: `.yield.*` over `.yield` | `asArtifactByPriority.test.ts` case8 | n/a (unit) | ✓ |
```

**test file evidence for case7 (asArtifactByPriority.test.ts lines 90-102):**
```typescript
given('[case7] .yield.md preferred over .yield.json', () => {
  const artifacts = ['1.vision.yield.json', '1.vision.yield.md'];
  // ...
  then('.yield.md takes precedence', () => {
    expect(result).toEqual('1.vision.yield.md');
  });
});
```

**test file evidence for case8 (asArtifactByPriority.test.ts lines 104-116):**
```typescript
given('[case8] .yield.* preferred over .yield extensionless', () => {
  const artifacts = ['1.vision.yield', '1.vision.yield.json'];
  // ...
  then('.yield.json takes precedence over .yield', () => {
    expect(result).toEqual('1.vision.yield.json');
  });
});
```

**why it holds:** case1 tests md over legacy, case7 tests md over non-md extension, case8 tests extension over extensionless.

---

## edge cases coverage

### no match (case6)

**verification checklist entry (5.3.verification.v1.i1.md line 16):**
```
| no match returns null | `asArtifactByPriority.test.ts` case6 | n/a (unit) | ✓ |
```

**test file evidence (asArtifactByPriority.test.ts lines 76-88):**
```typescript
given('[case6] no matched artifacts', () => {
  const artifacts = ['1.vision.txt', '1.vision.json'];
  // ...
  then('null is returned', () => {
    expect(result).toBeNull();
  });
});
```

### fallback (case9)

**verification checklist entry (5.3.verification.v1.i1.md line 17):**
```
| fallback to any `.md` | `asArtifactByPriority.test.ts` case9 | n/a (unit) | ✓ |
```

**test file evidence (asArtifactByPriority.test.ts lines 118-130):**
```typescript
given('[case9] fallback to any .md if no pattern matched', () => {
  const artifacts = ['1.vision.random.md'];
  // ...
  then('first .md file is returned as fallback', () => {
    expect(result).toEqual('1.vision.random.md');
  });
});
```

---

## gaps found

**none.** all behaviors from wish and vision are covered in the verification checklist, and all checklist entries point to test files with verifiable test cases.

## summary

| source | behaviors specified | behaviors tested |
|--------|--------------------:|----------------:|
| wish | 4 | 4 |
| vision (patterns) | 4 | 4 |
| vision (priority) | 3 | 3 |
| edge cases | 2 | 2 |
| **total** | **13** | **13** |

every behavior has test coverage. no gaps.
