# self-review r3: has-play-test-convention

third pass: why journey tests are not needed.

---

## what are journey tests?

journey tests (`.play.test.ts`) simulate multi-step user flows:
- step 1 → step 2 → step 3 → outcome
- state accumulates across steps
- tests verify full workflow

---

## why this feature doesn't need journey tests

### the feature is a pure format function

```typescript
const formatRouteDrive = (input: FormatRouteDriveInput): string[] => {
  const lines: string[] = [];
  // ... pure transformation ...
  return lines;
};
```

- no side effects
- no state accumulation
- input → output transformation

### unit tests are appropriate

| test type | use case | appropriate here? |
|-----------|----------|-------------------|
| unit | pure functions | yes |
| integration | external dependencies | no |
| journey | multi-step flows | no |

### coverage is complete

| variant | test |
|---------|------|
| count <= 5 (no tea pause) | [case7] [t0] |
| count > 5 (tea pause) | [case7] [t1] |
| visual snapshot | [case7] [t2] |

all variants covered by unit tests.

---

## conclusion

journey tests are not needed because:
1. feature is pure function
2. no multi-step flow
3. unit tests cover all variants

criterion is n/a.

