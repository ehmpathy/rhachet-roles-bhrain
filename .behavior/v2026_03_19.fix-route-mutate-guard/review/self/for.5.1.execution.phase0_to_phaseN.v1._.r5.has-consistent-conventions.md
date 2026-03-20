# review.self: has-consistent-conventions (r5)

## what was reviewed

fifth pass, deeper inspection of convention alignment with fresh perspective.

## detailed convention analysis

### guard logic pattern

**extant guard pattern** (lines 161-163):
```bash
elif echo "$FILE_PATH" | grep -qE "\.stone$"; then
```

**new guard pattern** (line fixed):
```bash
elif echo "$FILE_PATH" | grep -qE "^${ROUTE_DIR}/\.route/"; then
```

**holds**: same structure — `elif echo $VAR | grep -qE "pattern"; then`

### test structure convention

**extant structure** in all cases:
```typescript
given('[caseN] description', () => {
  const scene = useBeforeAll(async () => { ... });
  when('[tN] action', () => {
    then('outcome', async () => { ... });
  });
});
```

**new code** follows identical structure.

**holds**: consistent with BDD pattern from test-fns.

### blocker directory name

reviewed usages of "blocker" across codebase:
- `blocker` is the canonical term for blocked stone articulations
- no synonyms (e.g., "block", "blockage", "halt") used

**holds**: the directory name `blocker/` uses the canonical term.

### snapshot test convention

**extant**: `expect(res.cli.stderr).toMatchSnapshot()`

**new code**: same pattern for stderr snapshots

**holds**: consistent.

## conclusion

all conventions verified. no divergence found.
