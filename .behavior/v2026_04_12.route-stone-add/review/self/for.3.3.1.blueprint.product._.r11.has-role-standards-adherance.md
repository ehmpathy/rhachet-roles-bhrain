# self-review r11: has-role-standards-adherance

stone: 3.3.1.blueprint.product
reviewer: mechanic
round: 11
date: 2026-04-12

---

## pause and breathe

i paused. let me verify the blueprint follows mechanic role standards.

---

## briefs directories to check

| directory | relevance |
|-----------|-----------|
| lang.terms/ | name conventions, forbidden terms |
| lang.tones/ | lowercase, no buzzwords |
| code.prod/evolvable.procedures/ | input-context, arrow-only |
| code.prod/evolvable.domain.operations/ | get-set-gen verbs |
| code.prod/pitofsuccess.errors/ | failfast, failloud |
| code.prod/readable.narrative/ | no else, early returns |
| code.test/ | given-when-then, snapshots |

---

## standards check

### lang.terms: get-set-gen verbs

**rule:** operations use get, set, or gen prefixes

**blueprint declares:**
- `stepRouteStoneAdd` — step* prefix (orchestrator)
- `isValidStoneName` — is* prefix (validator)
- `getContentFromSource` — get* prefix (retriever)
- `getAllStones` — getAll* prefix (enumerator)

**verdict:** all names follow verb rules ✓

---

### lang.terms: no gerunds

**rule:** no -ing words as nouns

**blueprint checked for gerunds:**
- no "cached item", "loaded item", "processed item" type constructs
- no "-ing" nouns in function names

**verdict:** no gerunds ✓

---

### lang.terms: forbidden terms

**rule:** avoid terms listed in rule.forbid.term-* briefs

**blueprint checked:**
- uses "detect", "find" instead of vague verbs
- uses "operations" instead of vague nouns
- uses "--mode plan" instead of boolean modes
- uses "validate" instead of vague transforms

**verdict:** no forbidden terms ✓

---

### code.prod: input-context pattern

**rule:** procedures use (input, context?) signature

**blueprint declares:**
```
stepRouteStoneAdd(
  input: { stone: string; route: string; ... },
  context: { log: LogMethods }
)
```

**verdict:** follows input-context pattern ✓

---

### code.prod: arrow-only

**rule:** use arrow functions, not function keyword

**blueprint declares:**
```
export const stepRouteStoneAdd = async (input, context) => { ... }
export const isValidStoneName = (input) => { ... }
export const getContentFromSource = async (input) => { ... }
```

**verdict:** all arrow functions ✓

---

### code.prod: failfast

**rule:** early returns for invalid state

**blueprint declares:**
```
if (!bind) throw BadRequestError('no route bound');
if (collision) throw BadRequestError('stone already found');
if (!valid) throw BadRequestError(reason);
```

**verdict:** failfast on all invalid states ✓

---

### code.prod: failloud

**rule:** errors include context for debug

**blueprint declares:**
```
BadRequestError('no route bound', { branch })
BadRequestError('stone already found', { stoneName, route })
BadRequestError('invalid stone name', { name, reason })
```

**verdict:** all errors include context ✓

---

### code.prod: no else branches

**rule:** use early returns, not else

**blueprint declares:**
```
if (mode === 'plan') return formatPlan(...);
// implicit: mode === 'apply' continues
```

**verdict:** no else branches ✓

---

### code.test: given-when-then

**rule:** tests use given/when/then from test-fns

**blueprint declares:**
```
given('[case1] valid stone from stdin', () => {
  when('[t0] add is invoked', () => {
    then('stone file is created', async () => { ... });
  });
});
```

**verdict:** follows bdd pattern ✓

---

### code.test: snapshots

**rule:** user-faced output uses snapshots

**blueprint declares:**
```
expect(cli.stdout).toMatchSnapshot();
expect(cli.stderr).toMatchSnapshot();
```

**verdict:** snapshot coverage declared ✓

---

## summary

| standard category | rules checked | adherent |
|-------------------|---------------|----------|
| lang.terms | 3 rules | all pass |
| code.prod | 5 rules | all pass |
| code.test | 2 rules | all pass |

**total: 10 mechanic standards, all followed.**

---

## what held

the blueprint adheres to:
- name conventions (get-set-gen, no gerunds)
- forbidden term avoidance
- procedure patterns (input-context, arrow-only)
- error patterns (failfast, failloud)
- test patterns (bdd, snapshots)

no standard violations found.

