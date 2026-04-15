# self-review r7: has-consistent-mechanisms

stone: 3.3.1.blueprint.product
reviewer: mechanic
round: 7
date: 2026-04-12

---

## pause and breathe

i paused. let me verify the blueprint reuses extant mechanisms.

---

## extant mechanisms found

searched codebase for route-related mechanisms:

| extant mechanism | purpose |
|-----------------|---------|
| getAllStones | enumerate stones in route |
| formatRouteStoneEmit | format cli output |
| getRouteBindByBranch | auto-detect bound route |
| asStoneGlob | convert stone name to glob pattern |
| isStoneInGlob | check if stone matches glob |
| BadRequestError | error type |

---

## blueprint mechanism inventory

### new mechanisms

| mechanism | purpose | duplicates extant? |
|-----------|---------|-------------------|
| isValidStoneName | validate stone name format | no — new requirement |
| getContentFromSource | extract content from source | no — new requirement |
| stepRouteStoneAdd | orchestrate stone creation | no — new skill |

---

### reused mechanisms

| mechanism | how blueprint uses it |
|-----------|---------------------|
| getAllStones | collision check — blueprint: "[←] reuse" |
| formatRouteStoneEmit | output format — blueprint: "[~] extend" |
| getRouteBindByBranch | route auto-detect — blueprint: "reuse extant pattern" |
| fs.access | route validation — blueprint: "[←] reuse" |
| fs.writeFile | stone creation — blueprint: "[←] reuse" |
| BadRequestError | error type — blueprint: "extant" |

---

## duplication analysis

### question 1: does isValidStoneName duplicate extant validation?

**searched for:** name validation, stone validation

**found:** isStoneInGlob checks if stone matches a glob pattern.

**comparison:**
- isStoneInGlob: checks glob match (e.g., "1.vision" matches "1.*")
- isValidStoneName: validates format (numeric prefix + alpha segment)

**verdict:** different purpose. no duplication.

---

### question 2: does getContentFromSource duplicate extant content extraction?

**searched for:** stdin, template, content extraction

**found:** no extant mechanism for multi-source content extraction.

**verdict:** new requirement. no duplication.

---

### question 3: does stepRouteStoneAdd duplicate stepRouteStoneDel?

**comparison:**
- stepRouteStoneDel: deletes stones
- stepRouteStoneAdd: creates stones

**shared patterns (correctly reused):**
- plan/apply mode branch
- formatRouteStoneEmit for output
- getAllStones for enumeration
- error types

**verdict:** symmetric operations. patterns correctly reused.

---

### question 4: does formatAdd duplicate formatDel?

**blueprint extends formatRouteStoneEmit with new variant.**

**comparison:**
- formatDel: shows stones to delete
- formatAdd: shows stone to create with content preview

**verdict:** extension, not duplication.

---

## summary

| mechanism | status |
|-----------|--------|
| isValidStoneName | new (no extant equivalent) |
| getContentFromSource | new (no extant equivalent) |
| stepRouteStoneAdd | new (symmetric to del) |
| formatAdd | extension (not duplication) |
| getAllStones | reused |
| formatRouteStoneEmit | extended |
| getRouteBindByBranch | reused |
| fs.access | reused |
| fs.writeFile | reused |
| BadRequestError | reused |

**no duplication detected.**

---

## what held

the blueprint:
- introduces 3 new mechanisms for new requirements
- reuses 6 extant mechanisms
- extends 1 mechanism (formatRouteStoneEmit)

all new mechanisms serve distinct purposes not covered by extant code.
all extant mechanisms are correctly reused.
