# self-review: has-consistent-mechanisms

## question: do new mechanisms duplicate extant functionality?

### new mechanisms in the blueprint

| mechanism | purpose |
|-----------|---------|
| goal.triage.next.sh | shell entrypoint for triage skill |
| goal.guard.sh | shell entrypoint for guard hook |
| goalTriageNext (cli) | cli handler for triage |
| goalGuard (cli) | cli handler for guard |
| getGoalGuardVerdict | path match for .goals/ |

---

### search for related extant code

**goal operations:**
```
src/domain.operations/goal/
├── getGoals.ts          # retrieves goals by scope and status
├── getTriageState.ts    # retrieves asks, coverage, goals by completeness
├── setGoal.ts           # persists a goal
└── getDefaultScope.ts   # detects scope from route bind
```

**route guard:**
```
src/domain.roles/driver/skills/route.mutate.guard.sh   # PreToolUse hook for route protection
```

---

### analysis: does goal.triage.next duplicate getTriageState?

**extant getTriageState:**
- reads asks inventory
- reads coverage
- partitions goals by completeness (complete/incomplete)
- purpose: "enables brain to know what needs triage"

**proposed goal.triage.next:**
- gets goals by status (inflight/enqueued)
- shows unfinished goals at session end
- purpose: "ensures bots see their unfinished work before they leave"

**verdict:** different purposes, different partitions. getTriageState partitions by completeness. goal.triage.next needs status (inflight vs enqueued). no duplication.

**action:** goalTriageNext calls getGoals with status filter. does not call getTriageState.

---

### analysis: does goal.guard duplicate route.mutate.guard?

**extant route.mutate.guard:**
- protects route stones, guards, passage.jsonl
- has privilege mode for authorized bypass
- pure bash implementation
- patterns: `*.stone`, `*.guard`, `.route/**`

**proposed goal.guard:**
- protects .goals/ directories
- no privilege mode (wish says absolute prohibition)
- shell+node pattern (consistent with achiever skills)
- pattern: `(^|/)\.goals(/|$)`

**verdict:** different paths protected. route.mutate.guard protects route artifacts. goal.guard protects goal files. no duplication.

**what I reused from route.mutate.guard:**
- same approach: read stdin JSON, extract path, match pattern
- same exit code semantics: 0 = allowed, 2 = blocked
- same output destination: stderr for block messages

**what is different:**
- shell+node vs pure bash (consistent with achiever role pattern)
- no privilege flag (per wish)
- different protected paths

---

### analysis: do shell entrypoints follow extant pattern?

**extant achiever skills:**
```bash
# goal.memory.set.sh
exec node -e "import('rhachet-roles-bhrain/cli/goal').then(m => m.goalMemorySet())" -- "$@"

# goal.memory.get.sh
exec node -e "import('rhachet-roles-bhrain/cli/goal').then(m => m.goalMemoryGet())" -- "$@"
```

**proposed entrypoints:**
```bash
# goal.triage.next.sh
exec node -e "import('rhachet-roles-bhrain/cli/goal').then(m => m.goalTriageNext())" -- "$@"

# goal.guard.sh
exec node -e "import('rhachet-roles-bhrain/cli/goal').then(m => m.goalGuard())" -- "$@"
```

**verdict:** consistent with extant achiever skills. same import pattern.

---

### analysis: could getGoalGuardVerdict reuse route path match?

**route.mutate.guard path match:**
```bash
# in pure bash
if [[ "$FILE_PATH" =~ \.stone$ ]] || [[ "$FILE_PATH" =~ \.guard$ ]] || [[ "$FILE_PATH" =~ \.route/ ]]; then
```

**proposed getGoalGuardVerdict:**
```typescript
const pattern = /(^|\/)\.goals(\/|$)/;
return pattern.test(path);
```

**verdict:** regex is different. route uses suffix/prefix match for specific extensions. goal uses contains match for directory name. cannot reuse.

---

---

### near-miss: considered but rejected reuse

**could goalTriageNext use getTriageState?**

I briefly considered: "maybe getTriageState could be extended to also return inflight/enqueued status."

why I rejected this:
1. getTriageState has a specific purpose: ask-to-goal triage (coverage, completeness)
2. goal.triage.next has a different purpose: session-end reminder (status)
3. a merge of them would violate single responsibility
4. getGoals already supports status filter — no wrapper needed

**could goal.guard be pure bash like route.mutate.guard?**

I considered pure bash for consistency with route.mutate.guard.

why I rejected this:
1. achiever role skills use shell+node pattern (goal.memory.set, goal.memory.get)
2. consistency within a role is more important than across roles
3. future extension of getGoalGuardVerdict is easier in typescript

---

## conclusion

**mechanisms that duplicate extant code:** none

**duplication near-misses:**

| candidate | reason rejected |
|-----------|-----------------|
| getTriageState | different purpose (completeness vs status) |
| route.mutate.guard | different protected paths (route vs goals) |

**mechanisms that reuse extant patterns:**

| mechanism | reuses from |
|-----------|-------------|
| goal.triage.next.sh | same shell+node pattern as goal.memory.*.sh |
| goal.guard.sh | same shell+node pattern as goal.memory.*.sh |
| goalTriageNext | calls extant getGoals, getDefaultScope |
| goalGuard | same stdin/exit pattern as route.mutate.guard |
| getGoalGuardVerdict | new — path pattern is unique |

**what I verified:**
1. getTriageState does a distinct task (completeness vs status)
2. route.mutate.guard protects different paths (route vs goals)
3. shell entrypoints follow extant achiever pattern
4. cli handlers call extant operations where possible

**what I learned:**
- check for operations with similar names before you add new ones
- same pattern used for different purposes is not duplication
- consistency within a role trumps consistency across roles

**the blueprint is consistent with extant mechanisms.**
