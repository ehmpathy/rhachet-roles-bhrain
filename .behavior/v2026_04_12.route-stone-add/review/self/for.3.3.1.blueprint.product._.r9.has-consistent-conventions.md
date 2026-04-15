# self-review r9: has-consistent-conventions

stone: 3.3.1.blueprint.product
reviewer: mechanic
round: 9 (deeper dive)
date: 2026-04-12

---

## pause and breathe

let me question harder. r8 verified names. r9 questions the why.

---

## deeper convention analysis

### question 1: why is* not as* for isValidStoneName?

**extant patterns:**
- `isStoneInGlob` — returns boolean (is it in the glob?)
- `asStoneGlob` — returns transformed value (convert to glob)

**blueprint uses:** isValidStoneName — returns { valid: boolean; reason: string | null }

**why is* and not as*?**

the primary concern is validation (valid or not), not transformation.
the reason string is supplementary context for error messages.

**could it be asValidatedStoneName?**

no. the function doesn't transform the name — it checks validity.

**verdict:** is* is correct. validation returns boolean-centric result.

---

### question 2: why getContentFromSource not extractContentFromSource?

**extant patterns:**
- `get*` — retrieve from source
- no `extract*` pattern in codebase

**blueprint uses:** getContentFromSource

**why not extract*?**

- "extract" follows get/set/gen verb rules
- "get" is the extant convention for retrieval
- the function retrieves content from a source

**verdict:** get* is correct.

---

### question 3: is stepRouteStoneAdd the right grain?

**extant step* operations:**
- stepRouteDrive — orchestrates route flow
- stepRouteReview — orchestrates review flow
- stepRouteStoneDel — orchestrates stone deletion
- stepRouteStoneSet — orchestrates stone status set
- stepRouteStoneGet — retrieves stone info

**blueprint uses:** stepRouteStoneAdd

**does add belong in step* family?**

yes. it orchestrates:
1. validation
2. collision check
3. content extraction
4. file creation
5. output format

this is orchestration, not simple get/set.

**verdict:** step* is correct grain.

---

### question 4: why /stones/ directory?

**extant structure:**
- /stones/ — stone operations (getAllStones, setStoneAsPassed, isStoneInGlob)
- /bind/ — bind operations
- /guard/ — guard operations

**blueprint places:**
- isValidStoneName in /stones/
- getContentFromSource in /stones/

**is this correct?**

isValidStoneName — validates stone names. belongs in /stones/.

getContentFromSource — extracts content for stone. but is it stone-specific?

**consideration:** getContentFromSource could be more general.

**answer:** it serves stone creation specifically. the $behavior expansion is route-specific. it belongs with stone operations.

**verdict:** /stones/ is correct.

---

### question 5: is --from the right flag name?

**extant flags:**
- --stone (in del)
- --route (in del)
- --mode (in del)
- --as (in set)

**blueprint adds:** --from

**is there an extant equivalent?**

no. this is a new flag for a new requirement.

**could it be --source?**

"source" and "from" are both valid. vision uses "--from" syntax. follow vision.

**verdict:** --from is mandated by vision.

---

## summary

| question | answer |
|----------|--------|
| is* vs as* | is* correct (validation, not transformation) |
| get* vs extract* | get* correct (follows get/set/gen verbs) |
| step* grain | correct (orchestration) |
| /stones/ directory | correct (stone-specific operations) |
| --from flag | mandated by vision |

**all conventions align with extant patterns or vision mandates.**

---

## what held

r9 confirms: name conventions are consistent.

each choice traces to:
- extant codebase pattern (step*, is*, get*, /stones/)
- vision mandate (--from)
- verb rules (get/set/gen)

no arbitrary divergence from conventions.
