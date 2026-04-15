# self-review r5: has-pruned-yagni

stone: 3.3.1.blueprint.product
reviewer: mechanic
round: 5 (deeper dive)
date: 2026-04-12

---

## pause and breathe

let me look again with fresh eyes. r4 scanned components. r5 questions harder.

---

## the hard questions

### question 1: do we need separate isValidStoneName file?

**the temptation:** inline the regex check in stepRouteStoneAdd.

**why separate holds:**
- vision mandates validation with specific error message
- separate file enables focused unit test (pure transformer)
- follows extant pattern: isStoneInGlob is separate
- regex complexity deserves isolation

**verdict:** separation justified. not YAGNI.

---

### question 2: do we need separate getContentFromSource file?

**the temptation:** inline the branch logic in stepRouteStoneAdd.

**why separate holds:**
- three distinct sources require three branches
- each branch has different i/o (stdin vs fs vs literal)
- separate file enables focused integration tests per source
- if inline: stepRouteStoneAdd becomes a god function

**verdict:** separation justified by complexity. not YAGNI.

---

### question 3: do we need route.empty fixture?

**the temptation:** use route.simple and add stones with unique names.

**why route.empty holds:**
- "add first stone to empty route" is a distinct test case
- tests precondition: empty → has stone
- route.simple has 3 stones — adds noise to add tests
- one .gitkeep file is minimal cost

**verdict:** fixture justified for test clarity. not YAGNI.

---

### question 4: do we need template fixture?

**the temptation:** skip template tests, test only stdin and literal.

**why fixture holds:**
- vision usecase.2 explicitly shows template() source
- cannot test template() without a template file
- tests must verify $behavior expansion
- one fixture file is minimal cost

**verdict:** fixture mandated by vision. not YAGNI.

---

### question 5: is the test coverage excessive?

**examined test layers:**

| layer | test type | mandated? |
|-------|-----------|-----------|
| isValidStoneName | unit | yes — transformer |
| getContentFromSource | integration | yes — fs i/o |
| stepRouteStoneAdd | integration | yes — orchestrator |
| routeStoneAdd cli | acceptance | yes — wish: "cover with snaps" |

**each layer serves distinct purpose:**
- unit: fast, pure, no i/o
- integration: validates real fs operations
- acceptance: verifies cli contract

**verdict:** test layers justified. not excessive.

---

### question 6: is formatRouteStoneEmit extension needed?

**the temptation:** inline the output format in stepRouteStoneAdd.

**why extension holds:**
- extant pattern: route.stone.del uses formatRouteStoneEmit
- consistency across route.stone.* family
- format logic separated from business logic

**verdict:** follows extant pattern. not YAGNI.

---

## the ultimate test

**if i deleted this and had to add it back, would i?**

| component | would add back? | why |
|-----------|-----------------|-----|
| isValidStoneName | yes | vision mandates validation |
| getContentFromSource | yes | three sources need branch logic |
| stepRouteStoneAdd | yes | core orchestrator |
| formatRouteStoneEmit | yes | extant pattern |
| route.stone.add.sh | yes | skill invocation |
| route.empty | yes | clean test semantics |
| template fixture | yes | template() tests need it |

**all components would be re-added if deleted.**

---

## what held

r5 confirms: no YAGNI violations.

each component either:
1. is mandated by vision (cannot omit)
2. follows extant patterns (proven approach)
3. enables test isolation (minimal fixture cost)

the blueprint is minimal for the requirements.
