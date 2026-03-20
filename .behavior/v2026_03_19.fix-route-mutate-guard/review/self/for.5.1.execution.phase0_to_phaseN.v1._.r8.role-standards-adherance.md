# review.self: role-standards-adherance (r8)

## what was reviewed

eighth pass. final verification of mechanic standards with fresh perspective.

## explicit standards check

### 1. rule.require.fail-fast (error patterns)

**route.mutate.guard.sh**:
- exits with code 2 on guard blocks
- prints clear error message before exit
- no silent failures

**holds**: fail-fast pattern followed.

### 2. rule.require.what-why-headers (comment discipline)

**shell entrypoint header**:
```bash
######################################################################
# .what = guard writes to route artifacts
# .why  = protect stone instructions from modification
######################################################################
```

**TypeScript functions**: have .what and .why JSDoc comments.

**holds**: header comments present.

### 3. rule.forbid.nonidempotent-mutations

**getBlockedChallengeDecision**: pure function, no side effects.

**stepRouteDrive blocker creation**: uses fs.mkdir with `recursive: true` (idempotent).

**holds**: all mutations are idempotent.

### 4. rule.require.snapshots (test patterns)

**acceptance tests**: include `toMatchSnapshot()` assertions for stderr output.

**holds**: snapshots capture vibecheck.

### 5. rule.require.given-when-then (test patterns)

**test structure**:
```typescript
given('[case7]...', () => {
  const scene = useBeforeAll(async () => { ... });
  when('[t0]...', () => {
    then('...', async () => { ... });
  });
});
```

**holds**: BDD structure followed.

## conclusion

all mechanic role standards followed in all changed files. no violations.
