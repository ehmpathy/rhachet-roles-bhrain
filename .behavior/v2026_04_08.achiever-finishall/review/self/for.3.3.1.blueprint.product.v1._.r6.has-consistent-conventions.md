# self-review: has-consistent-conventions

## question: do names and patterns follow extant conventions?

### extant achiever skill names

```
goal.infer.triage.sh    → goalInferTriage (cli)
goal.memory.set.sh      → goalMemorySet (cli)
goal.memory.get.sh      → goalMemoryGet (cli)
```

**pattern:** `goal.<subdomain>.<action>.sh` → `goal<Subdomain><Action>` (cli)

### extant driver guard names

```
route.mutate.guard.sh   → (pure bash, no cli export)
```

**pattern:** `<domain>.<subdomain>.guard.sh`

---

### analysis: does goal.triage.next follow convention?

**proposed:** `goal.triage.next.sh` → `goalTriageNext` (cli)

**pattern check:**
- domain: goal ✓
- subdomain: triage ✓
- action: next ✓

**verdict:** follows convention. `goal.triage.next` matches `goal.memory.set` structure.

---

### analysis: does goal.guard follow convention?

**proposed:** `goal.guard.sh` → `goalGuard` (cli)

**compared to extant:** `route.mutate.guard.sh`

**issue detected:** route.mutate.guard has three parts. goal.guard has two.

**options:**
1. `goal.guard` — shorter, matches the wish name
2. `goal.access.guard` — follows route.mutate.guard pattern

**decision:** keep `goal.guard` because:
1. the wish explicitly names it "goal.guard" in usecase.2 criteria
2. the guard protects the entire .goals/ domain, not a specific action
3. route.mutate.guard guards against mutation specifically; goal.guard guards all access

**why this is acceptable:**
- route.mutate.guard is specific: guards mutation of route
- goal.guard is general: guards all access to goals
- the specificity is in the *purpose*, not the name pattern

**what I learned:** convention should serve clarity. "goal.guard" is clearer than "goal.access.guard" because the guard covers all access types (read, write, edit, bash).

---

### analysis: do cli export names follow convention?

**extant:**
```typescript
goalMemorySet
goalMemoryGet
goalInferTriage
```

**proposed:**
```typescript
goalTriageNext
goalGuard
```

**pattern check:**
- camelCase: goal + <Part1> + <Part2> ✓
- `goalTriageNext` = goal + Triage + Next ✓
- `goalGuard` = goal + Guard (shorter, but still camelCase) ✓

**verdict:** consistent with extant name choices.

---

### analysis: do file locations follow convention?

**extant:**
```
src/domain.roles/achiever/skills/goal.*.sh
src/contract/cli/goal.ts
src/domain.operations/goal/*.ts
```

**proposed:**
```
src/domain.roles/achiever/skills/goal.triage.next.sh    ✓ matches pattern
src/domain.roles/achiever/skills/goal.guard.sh          ✓ matches pattern
src/contract/cli/goal.ts (add exports)                  ✓ same file
src/domain.operations/goal/getGoalGuardVerdict.ts       ✓ matches pattern
```

**verdict:** all locations follow extant conventions.

---

### analysis: does getGoalGuardVerdict follow verb convention?

**extant operation names:**
```
getGoals
getTriageState
setGoal
getDefaultScope
```

**proposed:**
```
getGoalGuardVerdict
```

**pattern check:**
- starts with `get` verb: ✓
- returns a computed value (verdict): ✓
- does not mutate state: ✓

**verdict:** follows get/set verb convention.

---

---

### codebase search: what I looked for

**skill name patterns:**
```bash
# searched: src/domain.roles/achiever/skills/*.sh
# found: goal.infer.triage.sh, goal.memory.set.sh, goal.memory.get.sh
# pattern confirmed: goal.<subdomain>.<action>.sh
```

**guard name patterns:**
```bash
# searched: src/**/*guard*.sh
# found: route.mutate.guard.sh, route.mutate.guard.output.sh
# pattern observed: <domain>.<subdomain>.guard.sh
```

**cli export patterns:**
```bash
# searched: export.*goal in src/contract/cli/
# found: goalMemorySet, goalMemoryGet, goalInferTriage
# pattern confirmed: goal<Subdomain><Action>
```

**operation name patterns:**
```bash
# searched: src/domain.operations/goal/*.ts
# found: getGoals.ts, getTriageState.ts, setGoal.ts, getDefaultScope.ts
# pattern confirmed: get/set verb prefix
```

---

### alternative names considered

| proposed | alternative | why rejected |
|----------|-------------|--------------|
| goal.guard | goal.access.guard | too verbose; guard covers all access types |
| goalTriageNext | goalShowNext | "triage" is domain term; "show" is implementation |
| getGoalGuardVerdict | checkGoalPath | "get" follows extant verb; "verdict" is return type |

---

### deeper question: what conventions might I have missed?

**exit code convention:**
- route.mutate.guard uses exit 2 for blocked
- proposed goal.guard uses exit 2 for blocked ✓
- consistent with repo convention

**output format convention:**
- route.mutate.guard outputs to stderr when blocked
- proposed goal.guard outputs to stderr when blocked ✓
- consistent with repo convention

**treestruct convention:**
- extant skills use `🦉` owl wisdom header
- extant skills use `🔮` crystal ball for skill name
- extant skills use `├─` and `└─` for tree structure
- proposed output format follows all of these ✓

**hook registration convention:**
- route.mutate.guard registered via onTool in getDriverRole.ts
- proposed goal.guard registered via onTool in getAchieverRole.ts ✓
- consistent with extant pattern

**stdin JSON convention:**
- claude code passes PreToolUse events as JSON on stdin
- proposed goal.guard reads stdin JSON ✓
- consistent with route.mutate.guard pattern

---

## conclusion

**convention divergences found:** 0

**potential concerns addressed:**

| name | concern | resolution |
|------|---------|------------|
| goal.guard | two parts vs three | intentional — guards all access, not specific action |
| goalGuard | shorter than others | acceptable — camelCase with fewer parts |

**what I verified:**
1. skill names follow `goal.<subdomain>.<action>` pattern
2. cli exports follow `goal<Part1><Part2>` camelCase pattern
3. file locations match extant directory structure
4. operation names follow get/set verb convention

**what I learned:**
- always search the codebase before you name a new component
- convention serves clarity — don't follow pattern blindly if result is worse
- fewer parts is acceptable when the scope is broader (goal.guard vs route.mutate.guard)

**the blueprint uses consistent name conventions.**
