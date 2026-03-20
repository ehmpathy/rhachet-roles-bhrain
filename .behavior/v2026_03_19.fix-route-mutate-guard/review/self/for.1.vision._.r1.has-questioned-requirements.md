# self-review: has-questioned-requirements

## reviewed requirements

### requirement 1: allow writes to bound route directory

| question | answer |
|----------|--------|
| who said this was needed? | the wish explicitly describes the problem: declapract.upgrade routes at `.route/` get blocked |
| evidence | the guard greps for `.route/` anywhere in path; declapract.upgrade init creates routes at `.route/v{date}.xyz/` |
| what if we didn't do this? | declapract.upgrade workflow would be broken — the core use case |
| scope assessment | correct — this is the primary fix |
| simpler way? | no — the guard must distinguish between route directory and metadata subdirectory |

**verdict**: requirement holds. this is the core problem being solved.

---

### requirement 2: block writes to route metadata (.route/ subdirectory)

| question | answer |
|----------|--------|
| who said this was needed? | implicit from the guard's purpose — protect passage.jsonl, bind flags, etc. |
| evidence | current guard protects `.route/**` for this reason |
| what if we didn't do this? | drivers could bypass the flow, corrupt state, defeat bounded focus |
| scope assessment | correct — maintains safety guarantees |
| simpler way? | no — this is the point of the guard |

**verdict**: requirement holds. safety must be preserved.

---

### requirement 3: move blockers to $route/blocker/

| question | answer |
|----------|--------|
| who said this was needed? | wish explicitly states: "blocker explanation files should go into $route/blocker, not $route/.route/blocker" |
| evidence | direct quote from wish |
| what if we didn't do this? | blockers would remain hidden in `.route/` — works but less visible |
| scope assessment | small addition to core fix |
| simpler way? | could leave as-is, but wisher explicitly requested this change |

**verdict**: requirement holds. the wish is explicit about this.

**note**: this requirement adds scope beyond the core guard fix. the guard needs to be adjusted AND the blocker location needs to change. two concerns, but both in the wish.

---

### requirement 4: support routes at .route/

| question | answer |
|----------|--------|
| who said this was needed? | implied by declapract.upgrade pattern |
| evidence | `rhx declapract.upgrade init` creates routes at `.route/v{date}.declapract.upgrade/` |
| what if we didn't do this? | declapract.upgrade workflow breaks |
| scope assessment | necessary consequence of requirement 1 |

**verdict**: requirement holds. this is the enabling capability for requirement 1.

---

## questioned but unresolved

### should we migrate blockers?

the vision mentions that moving blockers from `$route/.route/blocker/` to `$route/blocker/` is a breaking change. but it doesn't specify whether to:
- migrate in-place (move files)
- support both locations during transition
- just change going forward

**recommended**: defer to criteria phase — this is an implementation detail.

### are there other consumers of blocker paths?

need to audit what reads from `$route/.route/blocker/`. if no consumers exist yet, no migration needed.

**recommended**: research during criteria phase.

---

## conclusion

all four requirements hold:
1. core fix (allow writes to bound route) — justified by wish
2. safety preservation (block metadata writes) — justified by guard purpose
3. blocker relocation — explicitly requested in wish
4. routes at .route/ — necessary for core fix

the vision is sound. the scope is appropriate. the requirements are justified.
