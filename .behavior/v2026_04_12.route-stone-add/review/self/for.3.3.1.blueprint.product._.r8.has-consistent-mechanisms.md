# self-review r8: has-consistent-mechanisms

stone: 3.3.1.blueprint.product
reviewer: mechanic
round: 8 (deeper dive)
date: 2026-04-12

---

## pause and breathe

let me search more thoroughly. r7 identified mechanisms. r8 verifies no hidden duplicates.

---

## deeper search: stdin pattern

**searched codebase for:** @stdin, stdin

**found patterns:**

the codebase uses stdin in various cli entrypoints. the blueprint's @stdin pattern aligns with extant usage.

**question:** does getContentFromSource duplicate extant stdin read?

**answer:** no. cli level reads stdin and passes content to domain operation. this is the correct pattern — domain operations receive content, not streams.

**verdict:** @stdin pattern is consistent with extant.

---

## deeper search: template pattern

**searched for:** template(, readFile, content

**found:** no extant `template($path)` syntax in codebase.

**question:** is template() syntax a new invention?

**answer:** yes, but mandated by vision. no extant equivalent to reuse.

**verdict:** template() is new requirement, not duplication.

---

## deeper search: name validation

**searched for:** validation, name, stone, valid

**found extant:**
- isStoneInGlob — checks glob match
- asStoneGlob — converts name to glob

**question:** do these cover name format validation?

**answer:** no. these check glob patterns, not name format rules.

- isValidStoneName: validates "numeric prefix + alpha segment"
- isStoneInGlob: validates "name matches glob pattern"

different purposes. no duplication.

**verdict:** isValidStoneName is new requirement.

---

## deeper search: file write pattern

**searched for:** writeFile, create, stone

**found extant:**
- setBlockedTriggeredReport — writes report files
- setSelfReviewTriggeredReport — writes triggered files
- setPassageReport — writes passage files

**question:** do these provide stone creation?

**answer:** no. these write specific report/passage files, not arbitrary stone files.

**verdict:** fs.writeFile is correctly reused for stone creation.

---

## deeper search: error types

**searched for:** BadRequestError, error

**found extant:** BadRequestError is used throughout codebase for user-directed errors.

**question:** should we use different error type?

**answer:** no. BadRequestError is correct for:
- invalid stone name
- stone already exists
- empty stdin
- template not found

**verdict:** BadRequestError is correctly reused.

---

## cross-reference with stepRouteStoneDel

**compared with extant del operation:**

| aspect | stepRouteStoneDel | stepRouteStoneAdd (blueprint) |
|--------|------------------|------------------------------|
| route validation | fs.access | fs.access (reuse) |
| stone enumeration | getAllStones | getAllStones (reuse) |
| output format | formatRouteStoneEmit | formatRouteStoneEmit (extend) |
| error type | BadRequestError | BadRequestError (reuse) |
| mode branch | plan vs apply | plan vs apply (consistent) |

**all patterns align with extant.**

---

## summary

| mechanism | extant search | result |
|-----------|--------------|--------|
| @stdin pattern | found in cli | consistent |
| template() syntax | not found | new (mandated) |
| isValidStoneName | searched validation | distinct from isStoneInGlob |
| getContentFromSource | searched content | new (no equivalent) |
| fs.writeFile | found reports | reused correctly |
| BadRequestError | found throughout | reused correctly |
| formatRouteStoneEmit | found | extended correctly |

**no hidden duplicates found.**

---

## what held

r8 confirms: the blueprint introduces no duplicate mechanisms.

- new mechanisms serve distinct purposes
- extant mechanisms are correctly reused
- pattern alignment with stepRouteStoneDel is intentional and correct
