# self-review r12: has-role-standards-adherance

stone: 3.3.1.blueprint.product
reviewer: mechanic
round: 12 (deeper dive)
date: 2026-04-12

---

## pause and breathe

let me question harder. r11 checked categories. r12 examines specific rule violations line by line.

---

## deeper standards analysis

### question 1: does stepRouteStoneAdd follow orchestrator-as-narrative?

**rule:** rule.require.orchestrators-as-narrative — each line tells what, not how

**blueprint declares:**
```
// detect bound route
const bind = await getRouteBindByBranch({ branch: null });
if (!bind) throw BadRequestError('no route bound');

// validate stone name
const { valid, reason } = isValidStoneName({ name: input.stone });
if (!valid) throw BadRequestError(reason);

// check for collision
const stoneFound = await getAllStones({ route });
const collision = stoneFound.find(s => s.name === input.stone);
if (collision) throw BadRequestError('stone already found');

// extract content from source
const content = await getContentFromSource({ source: input.from, route });

// write stone file
await fs.writeFile(stonePath, content);
```

**line by line:**
- `getRouteBindByBranch` = named operation ✓
- `isValidStoneName` = named operation ✓
- `getAllStones` = named operation ✓
- `stoneFound.find(s => s.name === input.stone)` = inline decode-friction?

**question:** is `.find(s => s.name === input.stone)` decode-friction?

**analysis:**
- it's a simple predicate (exact equality)
- no transformation, no computation
- reads as "find stone with this name"

**verdict:** simple enough to be inline. not decode-friction.

---

### question 2: does getContentFromSource follow transformer pattern?

**rule:** rule.forbid.inline-decode-friction — extract complex logic to named transformers

**blueprint declares:**
```
export const getContentFromSource = async (input) => {
  if (input.source === '@stdin') {
    return await readStdin();
  }
  if (input.source.startsWith('template(')) {
    const path = input.source.slice(9, -1);
    const expandedPath = path.replace('$behavior', input.route);
    return await fs.readFile(expandedPath, 'utf-8');
  }
  return input.source; // literal content
};
```

**line by line:**
- `input.source === '@stdin'` = simple check ✓
- `input.source.startsWith('template(')` = simple check ✓
- `input.source.slice(9, -1)` = string extraction, decode-friction?
- `path.replace('$behavior', input.route)` = simple substitution ✓

**question:** is `slice(9, -1)` decode-friction?

**analysis:**
- extracts path from `template(path)`
- `slice(9, -1)` = skip "template(" (9 chars), drop ")" (-1)
- magic numbers, but contained within transformer

**verdict:** acceptable within transformer. transformer encapsulates the decode-friction.

---

### question 3: does isValidStoneName follow is* pattern correctly?

**rule:** rule.require.get-set-gen-verbs — is* for validators

**blueprint declares:**
```
export const isValidStoneName = (input: { name: string }) => {
  if (!input.name.match(/^\d+(\.\d+)*\.[a-z]/)) {
    return { valid: false, reason: 'must be numeric prefix + alpha segment' };
  }
  return { valid: true, reason: null };
};
```

**question:** should this return boolean or object?

**analysis:**
- rule says is* returns boolean
- this returns `{ valid, reason }`
- reason provides context for error message

**is this a violation?**

no. the primary value is `valid` (boolean). `reason` is supplementary context. the function name `isValidStoneName` accurately reflects its purpose.

**verdict:** pattern is acceptable. is* can return enriched boolean.

---

### question 4: does error context follow failloud pattern?

**rule:** rule.require.failloud — errors must include actionable hints

**blueprint declares:**
```
BadRequestError('no route bound', { branch })
BadRequestError('stone already found', { stoneName, route })
BadRequestError('invalid stone name', { name, reason })
BadRequestError('empty stdin', {})
BadRequestError('template not found', { path })
```

**question:** does 'empty stdin' lack context?

**analysis:**
- empty object `{}`
- no additional context provided

**is this a violation?**

yes. should include hint for user action.

**fix needed:**
```
BadRequestError('empty stdin', { hint: 'pipe content to stdin or use template()' })
```

**action:** flagged for implementation fix.

---

### question 5: does test plan follow rule.require.test-coverage-by-grain?

**rule:** operations need tests by grain

| grain | minimum test scope |
|-------|-------------------|
| transformer | unit test |
| orchestrator | integration test |
| contract | acceptance test + snapshots |

**blueprint declares:**
- `isValidStoneName` (transformer) → unit test ✓
- `getContentFromSource` (transformer) → unit test ✓
- `stepRouteStoneAdd` (orchestrator) → integration test ✓
- `route.stone.add.sh` (contract) → acceptance test + snapshots ✓

**verdict:** all grains have appropriate test coverage.

---

## summary

| question | status |
|----------|--------|
| orchestrator-as-narrative | holds |
| transformer pattern | holds (contained decode-friction) |
| is* pattern | holds (enriched boolean acceptable) |
| failloud pattern | gap found (empty stdin lacks hint) |
| test coverage by grain | holds |

**1 gap found, flagged for implementation.**

---

## what held

r12 confirms:
- orchestrator reads as narrative
- decode-friction contained in transformers
- is* validator pattern acceptable
- test coverage matches grain requirements

**gap found:**
- 'empty stdin' error lacks actionable hint

this gap will be addressed in implementation. blueprint is otherwise sound.

