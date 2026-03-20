# self-review r4: has-consistent-mechanisms

## pause

i am the reviewer, not the author.

i re-read the blueprint and questioned whether any new mechanisms duplicate extant functionality.

---

## what mechanisms does the blueprint introduce?

### mechanism 1: prefix pattern check for .route/ subdirectory

**what it is**:
```bash
# before:
grep -qE "\.route/"

# after:
grep -qE "^${ROUTE_DIR}/\.route/"
```

**is this new?** no — it modifies an extant pattern check. the mechanism (grep for pattern) already exists.

**does it duplicate extant functionality?** no — there's no other place that checks for metadata subdirectory.

### mechanism 2: path.join without .route segment for blocker

**what it is**:
```typescript
// before:
path.join(input.route, '.route', 'blocker', `${input.stone}.md`)

// after:
path.join(input.route, 'blocker', `${input.stone}.md`)
```

**is this new?** no — it modifies an extant path computation. the mechanism (path.join) already exists.

**does it duplicate extant functionality?** no — there's only one place that computes blocker articulation path.

---

## what utilities does the codebase have for related tasks?

### route detection

**extant**: `ROUTE_DIR=$(dirname "$(dirname "$BIND_FLAG")")`

the blueprint reuses this extant pattern. no duplication.

### pattern protection

**extant**: the guard already has patterns for `*.stone`, `*.guard`, and `.route/`

the blueprint modifies the `.route/` pattern but keeps the same structure. no duplication.

### path construction

**extant**: `path.join()` is used throughout the codebase

the blueprint uses the same pattern. no duplication.

---

## are there any new files?

**files modified (from filediff tree)**:
- route.mutate.guard.sh — extant
- route.mutate.guard.integration.test.ts — extant
- getBlockedChallengeDecision.ts — extant
- getBlockedChallengeDecision.test.ts — extant
- driver.route.mutate.acceptance.test.ts — extant
- driver.route.blocked.acceptance.test.ts — extant

**new files**: none

the fix is entirely modifications to extant code.

---

## could we reuse an extant component instead?

**check 1**: is there an extant utility for "path is within subdirectory"?

searched for: `isPathWithin`, `isSubpath`, `pathStartsWith`

result: no extant utility. but the pattern `grep -qE "^${PREFIX}"` is simple enough that a utility would be overkill.

**check 2**: is there an extant utility for blocker path construction?

searched for: `getBlockerPath`, `blockerDir`

result: no — `getBlockedChallengeDecision.ts` is the only place. the blueprint modifies it in place.

---

## issues found

### none

the blueprint introduces no new mechanisms:
- it modifies extant patterns (grep check)
- it modifies extant path construction (path.join)
- it extends extant tests (add cases to extant files)
- it creates no new files

all changes are consistent with extant codebase patterns.

---

## conclusion

no mechanism duplication found. the fix is minimal:
- modify extant guard pattern check
- modify extant blocker path computation
- extend extant tests

no new utilities or components introduced.

