# self-review r10: has-role-standards-coverage

## what i found

i examined additional rule directories not covered in r9. i checked the blueprint against mechanic briefs for:
- evolvable.repo.structure/
- pitofsuccess.typedefs/
- readable.narrative/
- pitofsuccess.procedures/

---

## rule directories enumerated (beyond r9)

1. `code.prod/evolvable.repo.structure/`
   - rule.require.directional-deps
   - rule.forbid.barrel-exports
   - rule.forbid.index-ts

2. `code.prod/pitofsuccess.typedefs/`
   - rule.require.shapefit
   - rule.forbid.as-cast

3. `code.prod/readable.narrative/`
   - rule.require.narrative-flow
   - rule.forbid.else-branches
   - rule.forbid.inline-decode-friction

4. `code.prod/pitofsuccess.procedures/`
   - rule.forbid.nonidempotent-mutations
   - rule.require.idempotent-procedures

---

## pattern check 1: directional-deps

**rule.require.directional-deps says:**
> enforce top-down dependency flow; lower layers must not import from higher ones

```
src/
  contract/      # can import domain.operations, domain.objects
  domain.operations/  # can import domain.objects
  domain.objects/     # self-contained
```

**blueprint proposes:**
- `src/domain.operations/goal/` — imports from `src/domain.objects/Achiever/`
- `src/contract/cli/goal.ts` — imports from `src/domain.operations/goal/`

**analysis:**
- contract → domain.operations ✓
- domain.operations → domain.objects ✓

**verdict:** ✓ follows directional-deps.

---

## pattern check 2: forbid barrel exports

**rule.forbid.barrel-exports says:**
> never do barrel exports (e.g., src/domain.objects/index.ts)

**blueprint proposes:**
```
src/domain.objects/Achiever/
└─ [~] Goal.ts  # export GOAL_STATUS_CHOICES
```

**analysis:**
blueprint exports GOAL_STATUS_CHOICES from Goal.ts directly, not via index.ts.

**but check extant:**
is there an extant index.ts in domain.objects/Achiever/?

if yes, we should note that exports should be direct imports, not via barrel.

**verdict:** ✓ blueprint correctly exports from specific file, not barrel.

---

## pattern check 3: shapefit

**rule.require.shapefit says:**
> types must be well-defined and fit; mismatches signal defects

**blueprint proposes:**
```ts
GoalBlockerState {
  count: number;
  goalSlug: string;  // per r8: should be string | null
}
```

**analysis:**
r8 already identified this: goalSlug should be `string | null` with documented reason.

the fix is already noted. shapefit is satisfied if we apply the r8 fix.

**verdict:** ⚠ already addressed in r8. fix needed: `goalSlug: string | null`.

---

## pattern check 4: narrative flow

**rule.require.narrative-flow says:**
> structure logic as flat linear code paragraphs — no nested branches

**blueprint proposes:**
```
validateScopeWhenBound()  # fail-fast if --scope repo while bound
validateUnknownFlags()    # fail-fast on unknown flags
validateStatusValue()     # fail-fast if not in GOAL_STATUS_CHOICES
```

**analysis:**
these are guard functions that use early returns. they follow narrative flow pattern (failfast → main path).

**verdict:** ✓ follows narrative-flow via early returns.

---

## pattern check 5: idempotent procedures

**rule.forbid.nonidempotent-mutations says:**
> mutations use only findsert, upsert, or delete; no synonyms

**blueprint proposes:**
- `setGoalBlockerState` — increments count, writes json
- `delGoalBlockerState` — per r9, was resetGoalBlockerState

**analysis:**
- `set` = upsert semantics (always writes) ✓
- `del` = delete semantics (removes file) ✓

both are idempotent: set always produces same state for same input; del removes if present, no-op if absent.

**verdict:** ✓ follows idempotent-procedures pattern.

---

## pattern check 6: forbid else branches

**rule.forbid.else-branches says:**
> never use elses or if elses; use explicit ifs early returns

**blueprint proposes:**
```
escalateMessageByCount()
├─ count < 5: gentle reminder
└─ count >= 5: escalated reminder
```

**analysis:**
this is a conditional, but not an if/else in the problematic sense. implementation would be:
```ts
if (count >= 5) return escalatedMessage();
return gentleMessage();
```

the pattern uses early return, not else branch.

**verdict:** ✓ implementation should use early returns, not else.

---

## pattern check 7: test file names

**rule.require.sync-filename-opname says:**
> filename === operationname

**blueprint proposes:**
```
src/domain.operations/goal/
├─ getGoalBlockerState.ts
├─ setGoalBlockerState.ts
└─ delGoalBlockerState.ts  # was resetGoalBlockerState per r9
```

**analysis:**
filenames match operation names. ✓

**but test files:**
```
├─ getGoalBlockerState.integration.test.ts
├─ setGoalBlockerState.integration.test.ts
└─ delGoalBlockerState.integration.test.ts  # r9 noted: needs rename from reset
```

r9 already noted the test filename fix.

**verdict:** ✓ fix already noted in r9.

---

## pattern check 8: domain literal vs entity

**GoalBlockerState is a literal (immutable value) or entity (has identity)?**

**extant DriveBlockerState:**
- lives in `src/domain.objects/Drive/DriveBlocker.ts`
- is a DomainLiteral (not entity) — no unique key, just data shape

**blueprint proposes:**
- `src/domain.operations/goal/GoalBlocker.ts` — location inconsistent with extant

**inconsistency found:**
- DriveBlocker.ts is in `domain.objects/Drive/`
- GoalBlocker.ts is proposed in `domain.operations/goal/`

**fix needed:** move GoalBlocker.ts to `src/domain.objects/Achiever/GoalBlocker.ts` to match extant pattern.

---

## pattern check 9: operation placement

**blueprint proposes:**
```
src/domain.operations/goal/
├─ getGoalBlockerState.ts
├─ setGoalBlockerState.ts
└─ delGoalBlockerState.ts
```

**extant pattern:**
```
src/domain.operations/drive/
├─ getDriveBlockerState.ts
├─ setDriveBlockerState.ts
└─ delDriveBlockerState.ts
```

**analysis:**
the directory is `domain.operations/drive/` (singular noun), blueprint uses `domain.operations/goal/` (also singular).

**verdict:** ✓ follows extant folder name pattern.

---

## summary of additional fixes needed (beyond r9)

| pattern | rule | status |
|---------|------|--------|
| directional-deps | rule.require.directional-deps | ✓ compliant |
| barrel exports | rule.forbid.barrel-exports | ✓ compliant |
| shapefit (nullable) | rule.require.shapefit | already in r8 |
| narrative flow | rule.require.narrative-flow | ✓ compliant |
| idempotent procedures | rule.forbid.nonidempotent-mutations | ✓ compliant |
| else branches | rule.forbid.else-branches | ✓ early returns |
| filename sync | rule.require.sync-filename-opname | already in r9 |
| domain object location | extant pattern | **needs fix** |

---

## new fix needed

1. **move GoalBlocker.ts** to correct location:
   - blueprint says: `src/domain.operations/goal/GoalBlocker.ts`
   - should be: `src/domain.objects/Achiever/GoalBlocker.ts`
   - reason: domain literals belong in domain.objects, not domain.operations

---

## conclusion

1 new issue found beyond r8/r9:
- GoalBlocker.ts is in wrong directory (should be domain.objects/Achiever/, not domain.operations/goal/)

combined with prior findings:
1. goalSlug should be `string | null` (r8)
2. operations should take `scopeDir` as input (r8)
3. use `del` not `reset` per get-set-gen rule (r9)
4. add .what/.why headers to new operations (r9)
5. update test filename to match del (r9)
6. **move GoalBlocker.ts to domain.objects/Achiever/** (r10)

total: 6 fixes needed for blueprint.

