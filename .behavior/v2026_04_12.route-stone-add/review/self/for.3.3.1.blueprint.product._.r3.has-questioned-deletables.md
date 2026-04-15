# self-review r3: has-questioned-deletables

stone: 3.3.1.blueprint.product
reviewer: mechanic
round: 3 (final pass)
date: 2026-04-12

---

## pause and breathe

i paused again. let me look with even more critical eyes. what is truly deletable?

---

## harder deletion questions

### could we skip isValidStoneName entirely?

**question:** do we need stone name validation at all?

**answer:** vision explicitly requires it:
> "invalid stone name → failfast: 'stone name must have numeric prefix followed by at least one alpha segment'"

cannot delete. vision mandates it.

### could we merge getContentFromSource into stepRouteStoneAdd?

**question:** does the separation add value?

**answer:**
- if inlined: stepRouteStoneAdd would have nested if/else for source branches
- if separate: cleaner orchestrator, focused tests
- follows extant pattern: asStoneGlob, isStoneInGlob are separate

separate file is justified by test isolation and narrative flow.

### could we skip the template() source?

**question:** is template() actually needed?

**answer:** vision usecase.2 explicitly shows:
> "add stone from template | `rhx route.stone.add --stone 3.1.6.research.adhoc --from template($behavior/refs/.research.adhoc.template.stone)`"

cannot delete. vision mandates it.

### could we skip the literal source?

**question:** is 'literal text' actually needed?

**answer:** vision usecase.3 explicitly shows:
> "add stone with inline content | `rhx route.stone.add --stone 2.3.criteria.edge --from 'define edge cases for the api'`"

cannot delete. vision mandates it.

### could we skip route.empty fixture?

**question:** can we test with route.simple instead?

**answer:** route.empty enables clean "first stone" test:
- empty route → add stone → verify one stone exists
- cleaner than: 3-stone route → add stone → verify 4 stones

retained for test clarity. minimal cost (one .gitkeep file).

---

## the ultimate deletion question

**if i deleted this component and had to add it back, would i?**

| component | would add back? | reason |
|-----------|-----------------|--------|
| isValidStoneName | yes | vision requires validation |
| getContentFromSource | yes | three sources need branch logic |
| formatAdd | yes | vision requires plan/apply output |
| route.empty | yes | clean test semantics |
| template fixture | yes | template() tests need it |

**verdict:** all components would be re-added if deleted.

---

## summary

round 3 confirms: the blueprint is minimal.

- every component traces to a vision requirement
- no over-built components detected
- test fixtures serve distinct purposes
- component separation follows extant patterns

this review confirms: no deletables found after three passes.
