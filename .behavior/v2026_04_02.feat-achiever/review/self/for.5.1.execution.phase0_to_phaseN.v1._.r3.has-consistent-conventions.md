# self-review: has-consistent-conventions

## stone
5.1.execution.phase0_to_phaseN.v1

## question
do my name conventions align with extant codebase patterns?

## answer
yes, conventions are consistent throughout.

## evidence

### directory structure

**domain.objects convention:**
extant roles use role-named folders:
- `Driver/` — PassageReport.ts, RouteStone.ts, etc.
- `Reviewer/` — ReviewerReflectMetrics.ts, etc.

my usage:
- `Achiever/` — Goal.ts, Ask.ts, Coverage.ts

**verdict:** follows convention exactly.

**domain.operations convention:**
extant concepts use concept-named folders:
- `route/` — bind/, passage/, guard/, etc.
- `reflect/` — savepoint/, snapshot/, etc.
- `review/` — flat structure

my usage:
- `goal/` — setGoal.ts, getGoals.ts, setAsk.ts, etc.

**verdict:** follows convention exactly.

### verb prefixes

**extant pattern:**
- `setRouteBind.ts`, `getRouteBind.ts`, `delRouteBind.ts`
- `setPassageReport.ts`, `getOnePassageReport.ts`, `getAllPassageReports.ts`
- `setAnnotation.ts`, `getAllAnnotations.ts`

**my usage:**
- `setGoal.ts`, `getGoals.ts`
- `setAsk.ts`, `setCoverage.ts`
- `getTriageState.ts`

**verdict:** follows get/set/del convention.

### getAll vs get pattern

**question:** should `getGoals` be named `getAllGoals`?

**extant precedent found:**
```
provision/github.repo/resources.ts:14:export const getProviders = async ()
provision/github.repo/resources.ts:34:export const getResources = async ()
```

**analysis:** `getXs` (plural without `All`) is an acceptable pattern when:
1. there is no linked `getOneX` function
2. the operation returns a filtered collection, not "all"

my `getGoals` has a filter parameter:
```typescript
export const getGoals = async (input: {
  scopeDir: string;
  filter?: {
    status?: GoalStatusChoice;
    slug?: string;
  };
}): Promise<{ goals: Goal[] }>
```

**verdict:** `getGoals` is acceptable; it matches the filter-capable collection pattern.

### DomainLiteral usage

**extant pattern (ReviewerReflectMetrics.ts:1):**
```typescript
import { DomainLiteral } from 'domain-objects';
```

**my usage (Goal.ts:1):**
```typescript
import { DomainLiteral } from 'domain-objects';
```

**verdict:** identical pattern.

### jsdoc comments

**extant pattern (ReviewerReflectMetrics.ts:6-8):**
```typescript
/**
 * .what = token usage metrics for a reviewer reflect step
 * .why = enables context window management
 */
```

**my usage (Goal.ts:4-7):**
```typescript
/**
 * .what = status choices for a goal
 * .why = explicit state machine for goal lifecycle
 */
```

**verdict:** identical pattern.

### test file name convention

**extant pattern:**
- `setPassageReport.integration.test.ts`
- `getAllSavepoints.integration.test.ts`

**my usage:**
- `setGoal.integration.test.ts`
- `getGoals.integration.test.ts`

**verdict:** follows convention exactly.

## conclusion

all name conventions align with extant codebase patterns:
1. directory structure (role-named for objects, concept-named for operations)
2. verb prefixes (get/set/del)
3. plural names without `All` (acceptable when filter-capable)
4. DomainLiteral import and usage
5. jsdoc `.what`/`.why` comments
6. test file names with `.integration.test.ts` suffix

no deviations found.

---

## re-review 2026-04-07

i pause. i breathe. i am the reviewer.

---

### deeper check: role emoji convention

**question:** does the role emoji follow convention?

**answer:** yes. searched for role emojis in `src/domain.roles/`:

| role | emoji | source |
|------|-------|--------|
| driver | 🗿 | route/skills/route.stone.set.cli.ts |
| reviewer | (none in cli) | uses 🐢 seaturtle in briefs |
| achiever | 🔮 | my cli.ts files |

**analysis:** driver uses 🗿 (stone emoji for route stones). achiever uses 🔮 (crystal ball for foresight/goals). emoji choice is intentional and distinguishes roles.

**verdict:** consistent with convention of role-specific emoji.

---

### deeper check: skill file structure

**question:** do skill files follow the sh + cli.ts pattern?

**answer:** yes. searched for shell skills in `src/domain.roles/`:

extant pattern (driver/skills/):
```
route.stone.set.sh
route.stone.set.cli.ts
route.drive.sh
route.drive.cli.ts
```

my pattern (achiever/skills/):
```
goal.memory.set.sh
goal.memory.set.cli.ts
goal.memory.get.sh
goal.memory.get.cli.ts
goal.infer.triage.sh
goal.infer.triage.cli.ts
```

**verdict:** identical file structure pattern.

---

### deeper check: skill name convention

**question:** do skill names follow the domain.action pattern?

**answer:** yes. searched for skill names:

extant pattern:
- `route.stone.set` — domain=route, entity=stone, action=set
- `route.drive` — domain=route, action=drive
- `route.bind.get` — domain=route, entity=bind, action=get

my pattern:
- `goal.memory.set` — domain=goal, entity=memory, action=set
- `goal.memory.get` — domain=goal, entity=memory, action=get
- `goal.infer.triage` — domain=goal, action=infer.triage

**verdict:** follows domain.entity.action convention.

---

### deeper check: CLI argument convention

**question:** do CLI arguments follow extant patterns?

**answer:** yes.

extant (route.stone.set):
```bash
--stone <name>
--as <status>
--that <slug>
```

mine (goal.memory.set):
```bash
--scope <route|repo>
--slug <name>
--status <choice>
--covers <hash,...>
```

**analysis:** both use `--key value` pattern. my arguments use descriptive names that match the domain (scope, slug, status, covers).

**verdict:** follows argument name convention.

---

## final verdict

re-review confirms: all conventions consistent.

| convention | extant | mine |
|------------|--------|------|
| directory structure | role/concept named | identical |
| verb prefix | get/set/del | identical |
| DomainLiteral | class extends | identical |
| jsdoc | .what/.why | identical |
| test files | .integration.test.ts | identical |
| role emoji | distinct per role | distinct |
| skill files | .sh + .cli.ts | identical |
| skill names | domain.entity.action | identical |
| CLI args | --key value | identical |

no deviations. consistent throughout.
