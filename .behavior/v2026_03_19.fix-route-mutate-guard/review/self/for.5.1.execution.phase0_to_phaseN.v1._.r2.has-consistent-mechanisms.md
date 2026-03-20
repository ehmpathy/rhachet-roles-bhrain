# review.self: has-consistent-mechanisms (r2)

## what was reviewed

searched for new mechanisms that might duplicate extant functionality.

## mechanism analysis

### guard logic changes (route.mutate.guard.sh)

**new mechanism added?**
no. uses same `grep -qE` pattern as extant guard checks.

**extant patterns reused?**
yes. the fix follows the exact same structure:
```bash
# extant pattern for stone check
elif echo "$FILE_PATH" | grep -qE "\.stone$"; then

# fixed pattern for .route/ check (same structure)
elif echo "$FILE_PATH" | grep -qE "^${ROUTE_DIR}/\.route/"; then
```

### blocker path changes (getBlockedChallengeDecision.ts, stepRouteDrive.ts)

**new mechanism added?**
no. uses same `path.join()` calls as extant code.

**extant patterns reused?**
yes. the fix changes only the path segments:
```typescript
// before
path.join(input.route, '.route', 'blocker', `${input.stone}.md`)

// after (same mechanism, different path)
path.join(input.route, 'blocker', `${input.stone}.md`)
```

### test additions

**new test utilities added?**
no. uses extant `genTempDirForRhachet`, `execAsync`, `given/when/then` patterns.

**extant patterns reused?**
yes. new test cases follow the same structure as extant [case1] through [case6].

## conclusion

no new mechanisms were added. all changes reuse extant patterns with minimal modifications.
