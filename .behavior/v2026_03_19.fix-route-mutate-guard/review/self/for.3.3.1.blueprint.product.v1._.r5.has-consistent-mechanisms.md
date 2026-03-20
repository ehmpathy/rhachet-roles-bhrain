# self-review r5: has-consistent-mechanisms

## pause

i am the reviewer, not the author.

r4 claimed to search but didn't show evidence. r5 performs actual codebase searches.

---

## search 1: extant path check utilities

**query**: `isPathWithin|isSubpath|pathStartsWith`

**result**: no files found in src/

**conclusion**: no extant utility for path prefix checks. the blueprint's grep pattern is acceptable.

---

## search 2: extant blocker path utilities

**query**: `blockerPath|blockerDir|getBlocker`

**result**: 2 files found
- src/domain.operations/route/blocked/getBlockedChallengeDecision.test.ts
- src/domain.operations/route/blocked/setStoneAsBlocked.test.ts

these are test files that reference blocker paths. the production code is `getBlockedChallengeDecision.ts`.

**conclusion**: blocker path is computed in one place. the blueprint modifies it correctly.

---

## search 3: extant .route/ pattern usage

**query**: files that reference `.route/`

**result**: 25 files found

**analysis**: most are domain operations, objects, and briefs that reference the `.route/` directory conceptually. none have pattern check utilities.

---

## search 4: extant grep patterns in guard

**query**: `grep -qE` in route.mutate.guard.sh

**result** (`.route/` related patterns):
```
line 131: if echo "$COMMAND" | grep -qE "\.route/"; then
line 141: if echo "$COMMAND" | grep -qE "\.route/"; then
line 161: elif echo "$FILE_PATH" | grep -qE "\.route/"; then
```

**analysis**:
- line 131: bash read commands
- line 141: bash write commands
- line 161: file tool commands

all three use the same pattern `\.route/`. the fix changes all three to use `^$ROUTE_DIR/\.route/`.

**consistency check**: the fix applies the same change to all three locations. this is consistent.

---

## search 5: other pattern checks in guard

**query**: what other patterns does the guard check?

**result**:
```
line 115: grep -qE "\.stone(\s|$|\"|\')"; then
line 123: grep -qE "\.guard(\s|$|\"|\')"; then
line 155: grep -qE "\.stone$"; then
line 158: grep -qE "\.guard$"; then
```

**analysis**: stone and guard checks use suffix patterns (`$`). the `.route/` check uses partial match (no anchors).

**consistency question**: should `.route/` check be consistent with stone/guard checks?

**answer**: no — they serve different purposes:
- stone/guard checks: match file extensions (`*.stone`, `*.guard`)
- .route/ check: match directory prefix (path contains `.route/`)

the blueprint changes the `.route/` check to use a prefix anchor (`^$ROUTE_DIR`), which is different from the suffix patterns. this is intentional — we want "path starts with $ROUTE_DIR/.route/" not "path ends with .route".

---

## search 6: is there a path utility library in use?

**query**: `import.*path` in src/

**result**: standard node `path` module used throughout. no custom path utilities.

**conclusion**: the codebase uses node's `path.join()` for path construction. the blueprint does the same.

---

## mechanisms in blueprint vs extant

| mechanism | blueprint | extant | consistent? |
|-----------|-----------|--------|-------------|
| grep pattern check | `^$ROUTE_DIR/\.route/` | `\.route/` | yes (modifies extant) |
| path.join for blocker | `path.join(route, 'blocker', stone)` | `path.join(route, '.route', 'blocker', stone)` | yes (modifies extant) |
| test case structure | given/when/then | given/when/then in extant tests | yes |

---

## issues found

### none

the blueprint:
- modifies extant grep patterns consistently across all 3 locations
- uses extant path.join pattern
- follows extant test structure

no new utilities introduced. no duplication of extant functionality.

---

## conclusion

codebase searches confirm:
- no extant path prefix utilities (grep pattern is appropriate)
- blocker path computed in one place (modification is correct)
- extant grep patterns all changed consistently
- test structure follows extant patterns

the blueprint is consistent with extant mechanisms.

