# review.self: has-consistent-mechanisms (r3)

## what was reviewed

third pass: searched the codebase more thoroughly for related patterns that might be duplicated.

## mechanism search

### searched for path validation patterns

```bash
grep -r "grep -qE" src/domain.roles/driver/skills/
```

found extant patterns in route.mutate.guard.sh:
- `grep -qE "\.stone$"` for stone detection
- `grep -qE "\.guard$"` for guard detection
- `grep -qE "\.route/"` for metadata detection (the one we fixed)

**conclusion**: the fix follows the same grep pattern style. no duplication.

### searched for blocker path construction

```bash
grep -r "blocker" src/domain.operations/route/
```

found:
- `getBlockedChallengeDecision.ts` uses `path.join(input.route, '.route', 'blocker', ...)`
- `stepRouteDrive.ts` uses template literal for same path
- `setStoneAsBlocked.ts` uses same pattern

**conclusion**: the path construction mechanism is consistent. we just changed the path segments from `.route/blocker` to `blocker`.

### searched for test fixture patterns

```bash
grep -r "genTempDirForRhachet" blackbox/
```

found: all acceptance tests use the same fixture pattern with:
- `genTempDirForRhachet` for temp directories
- `execAsync` for command execution
- `useBeforeAll` for scene setup

**conclusion**: new test cases follow the extant pattern exactly.

## no issues found

all changes reuse extant mechanisms. no new utilities, operations, or abstractions were introduced.
