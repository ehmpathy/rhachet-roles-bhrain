# self-review r1: has-role-standards-coverage

## step back and breathe

adherance checks if what exists is correct. coverage checks if all required elements exist. let me verify all mechanic standards are covered.

---

## rule directories and coverage

### lang.terms coverage

| rule | required coverage | blueprint has? |
|------|-------------------|----------------|
| rule.forbid.gerunds | no gerunds in names | YES — checked in r9 |
| rule.require.ubiqlang | domain terms consistent | YES — checked in r9 |
| rule.require.treestruct | [verb][noun] names | YES — `setSavepoint` |
| rule.require.order.noun_adj | [noun][adj] vars | YES — checked in r9 |

**coverage complete?**: YES.

### code.prod/evolvable.procedures coverage

| rule | required coverage | blueprint has? |
|------|-------------------|----------------|
| rule.require.input-context-pattern | (input) signature | YES |
| rule.forbid.positional-args | named args | YES |
| rule.require.arrow-only | arrow function | YES |
| rule.require.clear-contracts | explicit types | YES |
| rule.require.dependency-injection | external state via input | YES |
| rule.require.single-responsibility | one purpose | YES |

**coverage complete?**: YES.

### code.prod/pitofsuccess.errors coverage

| rule | required coverage | blueprint has? |
|------|-------------------|----------------|
| rule.require.fail-fast | no error suppression | YES |
| rule.forbid.failhide | no catch blocks that swallow | YES |

**question**: should blueprint have explicit error handle?

**answer**: NO. blueprint shows native error propagation. shell commands throw descriptive errors. additional wrap would be unnecessary.

**coverage complete?**: YES.

### code.prod/pitofsuccess.typedefs coverage

| rule | required coverage | blueprint has? |
|------|-------------------|----------------|
| rule.require.shapefit | types fit correctly | YES — extant types |
| rule.forbid.as-cast | no type casts | YES — none needed |

**coverage complete?**: YES.

### code.prod/readable.comments coverage

| rule | required coverage | blueprint has? |
|------|-------------------|----------------|
| rule.require.what-why-headers | function headers | YES — `.what = ` in jsdoc expected |

**question**: does blueprint show jsdoc headers?

**blueprint contracts section**:
```typescript
export const setSavepoint = (input: {
```

**absent**: blueprint does not show `.what` and `.why` jsdoc headers.

**is this a gap?**: technically yes, but blueprint is design spec not implementation. implementation should add:
```typescript
/**
 * .what = create savepoint with staged and unstaged diff content
 * .why = capture work state for restore or review
 */
```

**verdict**: not a blueprint gap — jsdoc is implementation detail.

### code.prod/readable.narrative coverage

| rule | required coverage | blueprint has? |
|------|-------------------|----------------|
| rule.require.narrative-flow | flat linear steps | YES |
| rule.forbid.else-branches | no else | YES — separate ifs |
| rule.prefer.early-returns | guard clauses | N/A — no guards needed |

**coverage complete?**: YES.

---

## code.test coverage

| rule | required coverage | blueprint has? |
|------|-------------------|----------------|
| rule.require.given-when-then | bdd test structure | YES — test section shows format |
| rule.require.snapshots | snapshot tests | N/A — not applicable to this fix |

**blueprint test section**:
```typescript
given('[case2] large staged diff (>1MB)', () => {
  when('[t0] mode is apply', () => {
    then('succeeds without ENOBUFS', async () => {
      const savepoint = setSavepoint({ scope, mode: 'apply' });
      expect(savepoint.patches.stagedBytes).toBeGreaterThan(1_000_000);
    });
  });
});
```

**coverage complete?**: YES.

---

## patterns that should be present

### error validation

**question**: should blueprint validate inputs?

**blueprint inputs**:
- `input.scope` — typed as `ReflectScope`
- `input.mode` — typed as `'plan' | 'apply'`

**answer**: typescript enforces these at compile time. no runtime validation needed.

**coverage complete?**: YES.

### types

**question**: are all types covered?

**blueprint types**:
- `ReflectScope` — extant type
- `Savepoint` — extant interface

**answer**: blueprint uses extant types. no new type definitions needed.

**coverage complete?**: YES.

---

## conclusion

r1 role standards coverage review:
- lang.terms: all rules covered
- evolvable.procedures: all rules covered
- pitofsuccess.errors: covered (native propagation)
- pitofsuccess.typedefs: covered (extant types)
- readable.comments: jsdoc is implementation detail
- readable.narrative: covered
- code.test: bdd format shown

all relevant mechanic standards are covered in blueprint.
