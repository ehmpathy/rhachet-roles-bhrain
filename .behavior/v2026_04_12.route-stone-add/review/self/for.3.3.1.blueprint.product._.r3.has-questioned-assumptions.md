# self-review r3: has-questioned-assumptions

stone: 3.3.1.blueprint.product
reviewer: mechanic
round: 3
date: 2026-04-12

---

## pause and breathe

i paused. let me surface and question hidden technical assumptions.

---

## assumption inventory

### assumption 1: stone names follow numeric prefix convention

**what we assume:** stone names must have numeric prefix + alpha segment (e.g., 3.1.6.research)

**evidence:**
- all extant stones in `.test/assets/` follow this pattern
- vision explicitly states this format
- route.drive expects this pattern for sort order

**what if opposite?** could allow free-form names like `research.custom`

**verdict:** assumption is valid. numeric prefix enables route order. vision mandates it.

---

### assumption 2: $behavior expands to route path

**what we assume:** `$behavior` in template paths expands to the route directory path

**evidence:**
- vision explicitly states: "$behavior expands to .behavior/v2026_04_12.myroute"
- this enables portable templates that reference route-relative paths

**what if opposite?** could expand to other value (e.g., git root)

**verdict:** assumption is mandated by vision. documented behavior.

---

### assumption 3: fs.writeFile is sufficient for stone creation

**what we assume:** simple file write is safe for stone creation

**evidence:**
- extant setBlockedTriggeredReport uses same pattern
- stone creation is not concurrent (one driver at a time)
- no atomic write requirement

**what if opposite?** concurrent stone creation could cause race conditions

**verdict:** assumption is valid for single-driver workflow. no evidence of concurrent creation need.

---

### assumption 4: getAllStones returns all extant stones

**what we assume:** getAllStones is the authoritative way to enumerate stones

**evidence:**
- used in stepRouteStoneDel for collision detection
- returns RouteStone[] with name property

**what if opposite?** stones could exist outside getAllStones scope

**verdict:** assumption is valid. reuse extant pattern.

---

### assumption 5: stdin content must be read at cli level

**what we assume:** cli reads stdin before it calls stepRouteStoneAdd

**evidence:**
- extant cli patterns (e.g., git.commit.set) read stdin at cli level
- stdin is a stream that can only be read once
- domain operations should receive content, not streams

**what if opposite?** pass stdin stream to domain operation

**verdict:** assumption is valid. stream handle belongs at cli boundary.

---

### assumption 6: separate files for transformers/orchestrators

**what we assume:** isValidStoneName and getContentFromSource deserve separate files

**evidence:**
- follows extant pattern: asStoneGlob, isStoneInGlob are separate
- enables focused unit/integration tests
- follows rule.require.single-responsibility

**what if opposite?** inline in stepRouteStoneAdd

**verdict:** assumption is justified by test focus and extant patterns.

---

## summary

| assumption | questioned | verdict |
|------------|-----------|---------|
| numeric prefix convention | ✓ | valid, vision mandates |
| $behavior expansion | ✓ | valid, vision mandates |
| fs.writeFile sufficiency | ✓ | valid, no concurrency need |
| getAllStones authoritative | ✓ | valid, reuse extant |
| stdin at cli level | ✓ | valid, standard pattern |
| separate files | ✓ | valid, test focus |

**all assumptions questioned and found valid.**

---

## what held

the blueprint's assumptions are either:
1. mandated by vision (cannot change)
2. follow extant patterns (proven approaches)
3. justified by standard practices (stdin at boundary)

no hidden assumptions that contradict evidence found.
