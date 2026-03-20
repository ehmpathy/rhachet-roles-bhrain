# self-review r1: has-questioned-assumptions

## pause

i am the reviewer, not the author.

i re-read the blueprint and questioned the technical assumptions.

---

## assumption 1: prefix check `^$ROUTE_DIR/\.route/` is correct

**the assumption**: `grep -qE "^${ROUTE_DIR}/\.route/"` will correctly distinguish the metadata subdirectory from the route directory itself.

**what if the opposite were true?** if the pattern were wrong, we'd either:
- still block artifacts (pattern too broad)
- allow metadata access (pattern too narrow)

**verification**: let's trace through examples.

given ROUTE_DIR=`.route/xyz`:
- `.route/xyz/artifact.md` — does NOT match `^.route/xyz/\.route/` → allowed ✓
- `.route/xyz/.route/passage.jsonl` — DOES match `^.route/xyz/\.route/` → blocked ✓

given ROUTE_DIR=`.behavior/xyz`:
- `.behavior/xyz/artifact.md` — does NOT match `^.behavior/xyz/\.route/` → allowed ✓
- `.behavior/xyz/.route/passage.jsonl` — DOES match `^.behavior/xyz/\.route/` → blocked ✓

**why it holds**: the pattern correctly requires `.route/` to appear AFTER `$ROUTE_DIR/`, not anywhere in the path.

---

## assumption 2: bash tool detection can use the same pattern

**the assumption**: the bash command check can be fixed with the same prefix pattern for extracted paths.

**what if the opposite were true?** bash commands are free-form strings. path extraction is imprecise.

**evidence from code** (lines 131-136):
```bash
TARGET_PATH=$(echo "$COMMAND" | grep -oE "[^ \"']+\.route/[^ \"']*" | head -n1)
```

this extracts the first path-like segment. but what if the command has multiple paths? what if the path has different quotes?

**counterexample**: `cat ".route/xyz/artifact.md"` with quotes — the regex expects unquoted paths.

**issue found?** potentially. the extant pattern is imprecise. but this is an extant issue, not one introduced by the fix. the fix does not change the extraction logic, only what happens after extraction.

**resolution**: the fix should update the match check, not the extraction. the extraction imprecision is out of scope.

---

## assumption 3: path match works with shell string comparison

**the assumption**: `echo "$FILE_PATH" | grep -qE "^${ROUTE_DIR}/\.route/"` works correctly.

**what if the opposite were true?** shell variable expansion or regex escape could fail.

**edge cases**:
- ROUTE_DIR with dots: `.route/v2026.03.19.xyz` — dots in regex match any character
- ROUTE_DIR with special chars: theoretically possible but unlikely in practice

**evidence**: ROUTE_DIR is derived from bind flag location, which follows name conventions. dots are valid in route names but the risk is low — `.` that matches any char is broader than exact, which is safe (more blocks, not less).

**why it holds**: the pattern is safe because overmatch blocks (safe), not allows (unsafe).

---

## assumption 4: blocker path change only affects getBlockedChallengeDecision.ts

**the assumption**: the change to the blocker path in one file is sufficient.

**what if the opposite were true?** other code might construct blocker paths.

**verification**: i searched for `blocker` in the codebase in research. the articulation path is generated in `getBlockedChallengeDecision.ts` (lines 22-28). other references are:
- test assertions (need update)
- `.drive.blockers.latest.json` — different file, stores state, not articulation

**why it holds**: blocker articulation path is centralized in one place. the change propagates via the returned `articulationPath`.

---

## assumption 5: extant tests at `.behavior/` routes continue to pass

**the assumption**: the fix does not break tests for routes at `.behavior/`.

**what if the opposite were true?** if the new pattern broke `.behavior/` routes, extant tests would fail.

**verification**: for ROUTE_DIR=`.behavior/xyz`:
- `.behavior/xyz/.route/passage.jsonl` matches `^.behavior/xyz/\.route/` → blocked ✓

the pattern works identically for both `.route/` and `.behavior/` route locations.

**why it holds**: the fix generalizes to any route location, not just `.route/`.

---

## issues found

### none critical

the only potential issue (bash command path extraction imprecision) is extant, not introduced by this fix. it's out of scope for this behavior.

---

## conclusion

technical assumptions are sound:
- prefix pattern correctly distinguishes metadata from artifacts
- blocker path is centralized
- extant tests continue to work

no hidden assumptions that would break the fix.
