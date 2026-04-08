# self-review: role-standards-coverage (r9 fresh read of getGoals.ts and setAsk.ts)

## stone
5.1.execution.phase0_to_phaseN.v1

## question
are all relevant mechanic standards applied? are there patterns that should be present but are absent?

## answer
yes. fresh read of getGoals.ts (101 lines) and setAsk.ts (35 lines) confirms all standards present.

## fresh verification

### getGoals.ts (101 lines)

**lines 7-16:** import organization
```ts
import {
  Goal,
  GoalHow,
  type GoalSource,
  GoalStatus,
  type GoalStatusChoice,
  GoalWhat,
  GoalWhen,
  GoalWhy,
} from '@src/domain.objects/Achiever/Goal';
```
- `import type` for type-only imports (GoalSource, GoalStatusChoice) ✓
- imports organized by module ✓
- uses @src alias for internal imports ✓

**lines 22-28:** function signature
```ts
export const getGoals = async (input: {
  scopeDir: string;
  filter?: {
    status?: GoalStatusChoice;
    slug?: string;
  };
}): Promise<{ goals: Goal[] }> => {
```
- arrow function ✓
- input-context pattern (input object) ✓
- inline input type per rule.forbid.io-as-interfaces ✓
- optional filter field uses `?` ✓
- typed Promise return ✓

**lines 30-35:** early return pattern
```ts
try {
  await fs.access(input.scopeDir);
} catch {
  return { goals: [] };
}
```
- fail-fast: absent directory returns empty immediately ✓
- no error swallow: returns valid empty state ✓
- catch without parameter (error unused) ✓

**lines 44-46:** immutable filter
```ts
const filteredGoalFiles = input.filter?.slug
  ? goalFiles.filter((f) => f.includes(`.${input.filter?.slug}.goal.yaml`))
  : goalFiles;
```
- filter creates new array (immutable) ✓
- optional chain for filter.slug ✓
- ternary avoids else branch ✓

**line 66:** let for accumulator
```ts
let statusChoice: GoalStatusChoice = 'enqueued';
```
- let acceptable: value conditionally set in subsequent block ✓
- default value provided ✓

**lines 76-89:** Goal construction
```ts
const goal = new Goal({
  slug: parsed.slug as string,
  why: new GoalWhy(parsed.why as GoalWhy),
  ...
});
```
- constructs all nested DomainLiteral objects ✓
- GoalWhy, GoalWhat, GoalHow, GoalStatus, GoalWhen all instantiated ✓
- enables automatic hydration via nested pattern ✓

**lines 95-97:** status filter
```ts
const filteredGoals = input.filter?.status
  ? goals.filter((g) => g.status.choice === input.filter?.status)
  : goals;
```
- filter creates new array ✓
- optional chain for status ✓

---

### setAsk.ts (35 lines)

**line 1:** crypto import
```ts
import * as crypto from 'crypto';
```
- uses node crypto for hash ✓
- namespace import pattern ✓

**lines 7-11:** .what/.why/.note headers
```ts
/**
 * .what = appends an ask to asks.inventory.jsonl
 * .why = accumulates peer input with content hash for later triage
 * .note = hash is deterministic — same content yields same hash
 */
```
- .what present ✓
- .why present ✓
- .note documents important behavior ✓

**lines 12-15:** function signature
```ts
export const setAsk = async (input: {
  content: string;
  scopeDir: string;
}): Promise<{ ask: Ask }> => {
```
- arrow function ✓
- input-context pattern ✓
- inline input type ✓
- all fields required (no optional) ✓

**lines 16-17:** deterministic hash
```ts
const hash = crypto.createHash('sha256').update(input.content).digest('hex');
```
- sha256 for content hash ✓
- hex output for readability ✓
- deterministic: same content = same hash ✓

**lines 19-24:** Ask construction
```ts
const ask = new Ask({
  hash,
  content: input.content,
  receivedAt: new Date().toISOString().split('T')[0] ?? '',
});
```
- uses new Ask() for DomainLiteral ✓
- all fields populated ✓
- date format is ISO date-only ✓

**line 27:** mkdir with recursive
```ts
await fs.mkdir(input.scopeDir, { recursive: true });
```
- ensures parent dirs created ✓
- idempotent: no error if found ✓

**lines 30-31:** JSONL append
```ts
const inventoryPath = path.join(input.scopeDir, 'asks.inventory.jsonl');
await fs.appendFile(inventoryPath, JSON.stringify(ask) + '\n');
```
- fs.appendFile (not writeFile) ✓
- newline termination ✓
- JSON.stringify for serialization ✓

---

## patterns verified present

| pattern | getGoals.ts | setAsk.ts | evidence |
|---------|-------------|-----------|----------|
| arrow function | ✓ | ✓ | line 22, line 12 |
| input-context | ✓ | ✓ | inline input objects |
| .what/.why | ✓ | ✓ | jsdoc headers |
| fail-fast | ✓ | N/A | early return lines 30-35 |
| immutable filter | ✓ | N/A | lines 44-46, 95-97 |
| DomainLiteral construct | ✓ | ✓ | Goal construction, Ask construction |
| JSONL append | N/A | ✓ | fs.appendFile line 31 |
| deterministic hash | N/A | ✓ | sha256 line 17 |

---

## absent patterns: none

reviewed for absent patterns:
- error boundaries: not needed, fail-fast preferred ✓
- input validation: types enforce, DomainLiteral validates ✓
- tests: verified test files found ✓

---

## conclusion

fresh read of getGoals.ts and setAsk.ts confirms:
1. all mechanic standards present
2. no absent patterns
3. code follows all required conventions

