# self-review r9: has-role-standards-coverage

## what i found

i checked the blueprint for patterns that should be present but might be absent.

---

## rule directories enumerated

1. `code.prod/readable.comments/` — .what/.why headers
2. `code.prod/pitofsuccess.errors/` — error handle patterns
3. `code.test/` — test coverage patterns
4. `code.prod/evolvable.procedures/` — hook wrapper pattern

---

## pattern check 1: .what/.why headers (rule.require.what-why-headers)

**rule says:**
> require jsdoc .what and .why for every named procedure

**blueprint proposes new operations:**
- `getGoalBlockerState.ts`
- `setGoalBlockerState.ts`
- `delGoalBlockerState.ts` (was resetGoalBlockerState)

**what blueprint shows:**
The filediff tree shows these files but doesn't explicitly specify the jsdoc comments.

**check against extant:**
```ts
// getDriveBlockerState.ts
/**
 * .what = reads current drive blocker state from .route/.drive.blockers.json
 * .why = enables track of consecutive stop blocks
 */
```

**verdict:** blueprint should specify these headers. absent.

**fix needed:** add .what/.why comment specification to operation entries in blueprint.

---

## pattern check 2: error handle for scope detection

**blueprint proposes:**
```ts
validateScopeWhenBound()  // fail-fast if --scope repo while bound to route
```

**but what about the reverse case?**

extant getScopeDir already handles:
```ts
if (scope === 'route') {
  const bind = await getRouteBindByBranch({ branch: null });
  if (!bind) {
    throw new BadRequestError('--scope route requires bound to a route', {
      scope,
    });
  }
}
```

so: `--scope route` when NOT bound already fails. the blueprint only needs to add `--scope repo` when bound.

**verdict:** ✓ error handle is complete. extant + proposed covers all cases.

---

## pattern check 3: test coverage for new operations

**rule.require.test-coverage-by-grain says:**
| grain | test type |
|-------|-----------|
| transformer | unit test |
| communicator | integration test |
| orchestrator | integration test |

**blueprint proposes:**
```
src/domain.operations/goal/
├─ getGoalBlockerState.integration.test.ts
├─ setGoalBlockerState.integration.test.ts
└─ resetGoalBlockerState.integration.test.ts
```

these are communicators (file i/o) → integration tests are correct.

**but:** the blueprint changed resetGoalBlockerState to delGoalBlockerState per r9 adherance review.

**fix needed:** update test filename in blueprint to `delGoalBlockerState.integration.test.ts`.

---

## pattern check 4: hook wrapper pattern (rule.require.hook-wrapper-pattern)

**rule says:**
```ts
const _procedureName = (input, context) => { ... };
export const procedureName = withHook(_procedureName);
```

**blueprint proposes:**
add `handleOnBootMode()` to goalTriageNext.

**check:** is this a hook wrapper or a mode handler?

the blueprint codepath:
```
goalTriageNext()
   └─ [+] handleOnBootMode()
      └─ emit goal state to refresh context after compaction
```

this is a mode handler, not a hook wrapper. no rule violation.

**verdict:** ✓ not applicable here. handleOnBootMode is internal logic, not a hook wrapper.

---

## pattern check 5: skill header format

**blueprint proposes:**
> rewrite headers with recommended patterns (flags one-by-one)

**extant skill header format:**
```bash
######################################################################
# .what = ...
#
# .why = ...
#
# usage:
#   ...
#
# options:
#   ...
######################################################################
```

**blueprint shows:**
```bash
# (proposed header content with examples, best practices)
```

**check:** does the blueprint specify the exact header format to use?

the blueprint's "skill headers" section:
```
src/domain.roles/achiever/skills/
├─ [~] goal.memory.set.sh
│  └─ header
│     ├─ [-] usage shows stdin primary
│     ├─ [+] usage shows flags one-by-one
│     ├─ [+] example: create goal
│     ├─ [+] example: update status
│     └─ [+] best practice note
```

this shows WHAT to add but not the exact format.

**verdict:** acceptable. blueprint is high-level; exact format follows extant convention.

---

## summary of absent patterns

| pattern | rule | status |
|---------|------|--------|
| .what/.why headers on new operations | rule.require.what-why-headers | absent |
| test filename for delGoalBlockerState | rule.require.test-coverage-by-grain | needs update |
| error handle for all scope cases | rule.require.failfast | ✓ complete |
| hook wrapper pattern | rule.require.hook-wrapper-pattern | N/A |
| skill header format | extant convention | ✓ follows extant |

---

## fixes needed

1. **add .what/.why specification** to new operation entries:
   ```
   getGoalBlockerState.ts
     .what = reads goal blocker state
     .why = enables track of consecutive onStop reminders

   setGoalBlockerState.ts
     .what = increments goal blocker count
     .why = tracks consecutive reminders for escalation

   delGoalBlockerState.ts
     .what = clears goal blocker state
     .why = progress clears the reminder streak
   ```

2. **update test filename** in blueprint:
   - change `resetGoalBlockerState.integration.test.ts` to `delGoalBlockerState.integration.test.ts`

---

## conclusion

2 coverage gaps found:
1. .what/.why headers not specified for new operations
2. test filename inconsistent with renamed operation (del not reset)

these are documentation completeness issues, not structural gaps.

