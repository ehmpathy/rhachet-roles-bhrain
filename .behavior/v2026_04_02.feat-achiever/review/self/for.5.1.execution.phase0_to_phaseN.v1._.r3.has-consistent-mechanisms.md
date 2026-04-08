# self-review: has-consistent-mechanisms

## stone
5.1.execution.phase0_to_phaseN.v1

## question
have i added new mechanisms that duplicate extant functionality?

## answer
no duplication found. the implementation follows extant patterns throughout.

## evidence

### deep search performed

searched for:
- `yaml.dump|yaml.load` — only in my new files (no extant yaml utilities)
- `appendJsonl|writeJsonl|setJsonl` — none found (no extant jsonl utilities)
- `fs.writeFile|fs.readFile` — used inline throughout codebase, no wrapper utilities
- `DomainLiteral|DomainEntity` — extant pattern, my usage is consistent
- `public static nested` — extant pattern (RouteBouncerCache.ts:20), my Goal.ts follows same

### mechanism-by-mechanism analysis

**1. JSONL append**

extant (setPassageReport.ts:26):
```typescript
await fs.appendFile(passagePath, JSON.stringify(input.report) + '\n');
```

mine (setAsk.ts:27, setCoverage.ts:24):
```typescript
await fs.appendFile(path, JSON.stringify(entry) + '\n');
```

verdict: **identical pattern** — no utility to reuse, inline usage is the convention.

**2. fs.mkdir with recursive**

extant (setPassageReport.ts:19):
```typescript
await fs.mkdir(routeDir, { recursive: true });
```

mine (setGoal.ts:29):
```typescript
await fs.mkdir(input.scopeDir, { recursive: true });
```

verdict: **identical pattern** — no utility to reuse, inline usage is the convention.

**3. DomainLiteral usage**

extant (PassageReport.ts, ReviewerReflectMetrics.ts, etc.):
```typescript
export class X extends DomainLiteral<X> implements X {}
```

mine (Goal.ts, Ask.ts, Coverage.ts):
```typescript
export class Goal extends DomainLiteral<Goal> implements Goal {}
```

verdict: **identical pattern** — follows convention exactly.

**4. nested static property**

extant (RouteBouncerCache.ts:20):
```typescript
public static nested = { protections: RouteBouncerProtection };
```

mine (Goal.ts:165):
```typescript
public static nested = { why: GoalWhy, what: GoalWhat, ... };
```

verdict: **identical pattern** — follows convention exactly.

**5. YAML serialization**

searched for extant yaml.dump/yaml.load — only found in my new files.

verdict: **new mechanism, but necessary** — YAML is prescribed by vision for human-readable goal files. not a duplicate of any extant utility.

**6. flag files for status**

searched for `.flag` files or status-in-filename patterns — not found elsewhere.

verdict: **new mechanism, but prescribed** — vision explicitly requires "status visible from filename".

### utilities that could have been created but weren't

considered whether to extract:
- `appendJsonl(path, entries)` — decided against; inline usage is the convention
- `readYaml(path)` / `writeYaml(path, obj)` — decided against; only used in goal operations

not a utility extraction follows the codebase convention of inline fs operations.

## conclusion

all mechanisms either:
1. follow extant patterns exactly (DomainLiteral, JSONL append, mkdir recursive)
2. are new but prescribed by vision (YAML for goals, flag files for status)

no duplication, no unnecessary abstraction, consistent with codebase conventions.

---

## re-review 2026-04-07

i pause. i breathe. i am the reviewer.

---

### deeper check: treestruct output format

**question:** does the CLI output follow extant patterns?

**answer:** yes. searched for `🐢|🐚|├─|└─` patterns in `src/domain.roles/`:

extant (route/skills/route.stone.set.cli.ts):
```typescript
console.log('🗿 route.stone.set');
console.log('   ├─ stone = ' + input.stone);
```

mine (achiever/skills/*.cli.ts):
```typescript
console.log('🔮 goal.memory.set');
console.log('   ├─ goal = ' + goal.slug);
```

**verdict:** follows treestruct convention. emoji differs (🔮 vs 🗿) to distinguish role but format matches.

---

### deeper check: (input, context) signature

**question:** do operations follow the (input, context) pattern?

**answer:** yes. all domain operations use this signature:

extant (setPassageReport.ts):
```typescript
export const setPassageReport = async (
  input: { report: PassageReport },
  context: { route: string },
)
```

mine (setGoal.ts):
```typescript
export const setGoal = async (
  input: { goal: Goal; scopeDir: string; covers?: string[] },
  context: { log?: LogMethods },
)
```

**verdict:** identical pattern — (input, context) signature followed exactly.

---

### deeper check: shell skill → CLI pattern

**question:** do skills follow the sh → cli.ts pattern?

**answer:** yes. all shell skills delegate to cli.ts:

extant (review.sh → review.cli.ts):
```bash
exec node -e "import('rhachet-roles-bhrain/cli').then(m => m.cli.review())"
```

mine (goal.memory.set.sh → goal.memory.set.cli.ts):
```bash
exec node -e "import('rhachet-roles-bhrain/cli/goal').then(m => m.goalMemorySet())"
```

**verdict:** follows pattern with isolated subpath export (per rule.require.isolated-cli-subpath-exports).

---

### deeper check: error exit codes

**question:** do errors follow exit code semantics?

**answer:** yes. per rule.require.exit-code-semantics:

| code | sense | my usage |
|------|-------|----------|
| 0 | success | goal persisted |
| 1 | malfunction | fs error |
| 2 | constraint | main branch, schema invalid |

extant example:
```typescript
process.exit(2); // constraint error
```

mine:
```typescript
if (branch === 'main') {
  console.error('error: goals on main branch forbidden');
  process.exit(2);
}
```

**verdict:** follows exit code semantics.

---

## final verdict

re-review confirms: consistent with codebase mechanisms.

| mechanism | extant pattern | my usage |
|-----------|---------------|----------|
| JSONL append | inline fs.appendFile | identical |
| mkdir recursive | inline fs.mkdir | identical |
| DomainLiteral | class extends | identical |
| treestruct output | 🐢 + tree chars | identical format |
| (input, context) | operation signature | identical |
| sh → cli.ts | shell wrapper | identical |
| exit codes | 0/1/2 semantics | identical |

no new abstractions. no duplicates. consistent throughout.

---

### deeper check: error handler pattern

**question:** do error handlers follow extant patterns?

**answer:** yes.

extant (getOneReviewCacheItem.ts):
```typescript
try {
  await fs.access(cacheDir);
} catch {
  return null; // directory not found = no cache
}
```

mine (getGoals.ts):
```typescript
try {
  await fs.access(input.scopeDir);
} catch {
  return { goals: [] }; // directory not found = no goals
}
```

**verdict:** identical pattern for handling absent directory.

---

### deeper check: glob for file enumeration

**question:** does file enumeration follow extant patterns?

**answer:** yes. using fast-glob as extant pattern.

extant (getRouteStones.ts):
```typescript
import fg from 'fast-glob';
const files = await fg(['*.stone', '*.guard'], { cwd: routeDir });
```

mine (getGoals.ts):
```typescript
import fg from 'fast-glob';
const goalFiles = await fg(['*.goal.yaml'], { cwd: input.scopeDir });
```

**verdict:** identical pattern — fast-glob with cwd option.

---

### deeper check: hash computation

**question:** does hash computation follow extant patterns?

**answer:** searched for hash patterns in codebase:

extant (route/getRouteReviewCacheKey.ts):
```typescript
import { toHashSha256Sync } from 'hash-fns';
const hash = toHashSha256Sync(content);
```

mine (setAsk.ts):
```typescript
import { toHashSha256Sync } from 'hash-fns';
const hash = toHashSha256Sync(input.content);
```

**verdict:** identical pattern — uses same hash-fns library.

---

## absolute final verdict

three rounds of review complete.

all mechanisms verified against extant patterns:
- JSONL append: identical
- mkdir recursive: identical
- DomainLiteral: identical
- static nested: identical
- error handler: identical
- fast-glob: identical
- hash-fns: identical
- treestruct output: identical format
- (input, context): identical
- sh → cli.ts: identical
- exit codes: identical

zero duplicates. zero unnecessary abstractions.
