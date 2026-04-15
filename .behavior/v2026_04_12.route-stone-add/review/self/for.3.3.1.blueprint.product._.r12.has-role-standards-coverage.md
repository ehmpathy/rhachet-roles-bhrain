# self-review r12: has-role-standards-coverage

stone: 3.3.1.blueprint.product
reviewer: mechanic
round: 12
date: 2026-04-12

---

## pause and breathe

i paused. let me verify all relevant mechanic standards are covered.

---

## briefs directories to check

| directory | relevant? | checked? |
|-----------|-----------|----------|
| lang.terms/ | yes — name conventions | yes |
| lang.tones/ | yes — output style | yes |
| code.prod/evolvable.procedures/ | yes — function patterns | yes |
| code.prod/evolvable.domain.operations/ | yes — verbs, grains | yes |
| code.prod/pitofsuccess.errors/ | yes — error patterns | yes |
| code.prod/readable.narrative/ | yes — code flow | yes |
| code.prod/readable.comments/ | yes — what-why headers | need to verify |
| code.test/ | yes — test patterns | yes |

---

## coverage check

### code.prod/readable.comments: what-why headers

**rule:** rule.require.what-why-headers — every named procedure has .what and .why

**blueprint declares:**
```
/**
 * .what = orchestrates stone creation with validation and collision check
 * .why = enables drivers to add stones to their route
 */
export const stepRouteStoneAdd = async (input, context) => { ... }
```

**is this present?**

checked blueprint... the blueprint describes the operation but doesn't show explicit .what/.why headers.

**verdict:** .what/.why headers should be included in implementation. flagged.

---

### code.prod/evolvable.procedures: single-responsibility

**rule:** rule.require.single-responsibility — one operation per file

**blueprint declares:**
- `stepRouteStoneAdd.ts` — one operation ✓
- `isValidStoneName.ts` — one operation ✓
- `getContentFromSource.ts` — one operation ✓

**verdict:** single-responsibility covered ✓

---

### code.prod/evolvable.procedures: hook-wrapper-pattern

**rule:** rule.require.hook-wrapper-pattern — wrap with hooks, don't inline

**blueprint declares:**
```
const _stepRouteStoneAdd = async (input, context) => { ... };
export const stepRouteStoneAdd = withLogTrail(_stepRouteStoneAdd);
```

**is this present?**

checked blueprint... no hook wrapper mentioned.

**question:** does stepRouteStoneAdd need a hook wrapper?

**analysis:**
- withLogTrail adds observability
- step* operations typically use it

**verdict:** hook wrapper should be included. flagged.

---

### code.prod/pitofsuccess.errors: exit-code-semantics

**rule:** rule.require.exit-code-semantics — exit 1 for malfunction, exit 2 for constraint

**blueprint declares cli:**
```
if (blocked) process.exit(2);  // constraint
if (error) process.exit(1);    // malfunction
```

**is this present?**

checked blueprint... error types use BadRequestError which maps to exit 2.

**verdict:** exit-code semantics covered ✓

---

### code.test: redundant-expensive-operations

**rule:** rule.forbid.redundant-expensive-operations — use useThen for shared results

**blueprint declares:**
```
when('[t0] add is invoked', () => {
  const result = useThen('add succeeds', async () => invokeSkill(...));
  then('stone file is created', () => { ... });
  then('output matches snapshot', () => { ... });
});
```

**is useThen used correctly?**

yes. single invocation shared across then blocks.

**verdict:** redundant operations avoided ✓

---

### code.test: repeatable-for-llm-tests

**rule:** rule.require.repeatable-for-llm-tests — use when.repeatably for LLM tests

**question:** does this skill invoke LLM?

no. route.stone.add is pure file operations. no brain invocation.

**verdict:** not applicable ✓

---

## coverage summary

| standard | covered? | notes |
|----------|----------|-------|
| what-why headers | flagged | add to implementation |
| single-responsibility | yes | one op per file |
| hook-wrapper-pattern | flagged | add withLogTrail |
| exit-code-semantics | yes | BadRequestError = exit 2 |
| redundant-expensive-operations | yes | useThen used |
| repeatable-for-llm-tests | n/a | no LLM calls |

**2 gaps flagged for implementation.**

---

## what held

the blueprint covers most mechanic standards. gaps identified:
1. .what/.why headers — add to function declarations
2. hook wrapper — add withLogTrail to stepRouteStoneAdd

these will be addressed in implementation. blueprint structure is otherwise sound.

