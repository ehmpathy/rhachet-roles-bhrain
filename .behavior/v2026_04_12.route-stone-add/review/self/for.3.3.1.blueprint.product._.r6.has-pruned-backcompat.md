# self-review r6: has-pruned-backcompat

stone: 3.3.1.blueprint.product
reviewer: mechanic
round: 6 (deeper dive)
date: 2026-04-12

---

## pause and breathe

let me look harder. r5 scanned for obvious backcompat. r6 questions the implicit.

---

## deeper examination

### question 1: does adherence to extant patterns imply backcompat?

the blueprint follows route.stone.del patterns:
- same flag names (--stone, --route, --mode)
- same plan/apply semantics
- same output format (formatRouteStoneEmit)

**is this backcompat or consistency?**

this is **consistency**, not backcompat because:
- route.stone.add is new — no prior version to be compat with
- pattern alignment helps users who know del use add
- wish explicitly says "match extant flags and conventions"

**verdict:** adherence to extant patterns is mandated, not assumed.

---

### question 2: does $behavior expansion assume any prior compat need?

the template() source supports $behavior variable expansion.

**is this an assumed compat need?**

no. vision explicitly specifies:
> "$behavior expands to .behavior/v2026_04_12.myroute"

this is a mandated feature, not an assumed compat layer.

**verdict:** $behavior expansion is mandated.

---

### question 3: does stone name validation assume compatibility?

isValidStoneName requires numeric prefix + alpha segment.

**is this compat with older stone formats?**

this is **consistency**, not backcompat because:
- all extant stones follow this pattern
- vision mandates this format
- no "legacy stone names" to support

**verdict:** format enforcement is mandated.

---

### question 4: does error message text assume any prior compat?

the blueprint specifies exact error messages.

**are these compat with older error formats?**

error messages come from vision edgecases:
- "stone already exists; use different name or \`route.stone.del\` first"
- "no route bound; use \`rhx route.bind.set\` first"
- etc.

these are mandated messages, not assumed compat.

**verdict:** error messages are mandated.

---

### question 5: any hidden compatibility in test fixtures?

**route.empty fixture:**
- purpose: test "add first stone" scenario
- compat concern? no — it's a new test asset

**template fixture:**
- purpose: test template() source
- compat concern? no — it's a new test asset

**verdict:** fixtures are new, not compat layers.

---

## the ultimate question

**would removal of any "compat" layer break the blueprint?**

| candidate | what happens if removed | verdict |
|-----------|------------------------|---------|
| flag consistency | violates wish ("match extant conventions") | mandated |
| $behavior expansion | vision feature breaks | mandated |
| name format | vision edgecase breaks | mandated |
| error messages | vision edgecase breaks | mandated |
| test fixtures | tests break | needed for tests |

**no layer can be removed without violation.**

---

## what held

r6 confirms: the blueprint has zero unjustified backcompat.

every pattern alignment traces to:
1. explicit wish mandate: "match extant flags and conventions"
2. explicit vision mandate: $behavior, error messages, name format
3. test necessity: fixtures for coverage

this is a greenfield feature with no legacy to support.
