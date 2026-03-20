# self-review: has-questioned-assumptions

## surfaced assumptions

### assumption 1: routes can live at `.route/` OR `.behavior/`

| question | answer |
|----------|--------|
| what do we assume without evidence? | that routes at `.route/` are a valid pattern |
| evidence | declapract.upgrade init creates routes at `.route/v{date}.xyz/` — this is actual code |
| what if opposite were true? | if routes MUST be at `.behavior/`, declapract.upgrade is wrong and should be fixed there |
| did wisher say this? | wish says "writes to @reporoot/.route/xyz should be permitted if the bound route is @reporoot/.route/xyz" — explicitly supports this |
| exceptions? | none found — both patterns appear valid |

**verdict**: assumption holds. wisher explicitly supports routes at `.route/`.

---

### assumption 2: the `.route/` subdirectory holds metadata, not artifacts

| question | answer |
|----------|--------|
| what do we assume without evidence? | that passage.jsonl and bind flags should live in `$route/.route/` |
| evidence | current implementation puts them there; guard protects `.route/**` |
| what if opposite were true? | metadata could live alongside artifacts — but then how to distinguish protected vs unprotected? |
| did wisher say this? | wish says ".route/xyz/.route should be blocked" — confirms subdirectory is special |
| exceptions? | none — this is the core distinction being made |

**verdict**: assumption holds. wisher confirms `.route/` subdirectory is protected.

---

### assumption 3: blocker relocation is desired

| question | answer |
|----------|--------|
| what do we assume without evidence? | that blockers should move from `$route/.route/blocker/` to `$route/blocker/` |
| evidence | wish explicitly states: "blocker explanation files should go into $route/blocker, not $route/.route/blocker" |
| what if opposite were true? | blockers stay hidden — would still work |
| did wisher say this? | **yes, explicitly** |
| exceptions? | none |

**verdict**: assumption holds. this is not an assumption — it's a direct requirement from the wish.

---

### assumption 4: guard behavior for `.behavior/` routes stays unchanged

| question | answer |
|----------|--------|
| what do we assume without evidence? | that the fix doesn't break extant `.behavior/` routes |
| evidence | none yet — this needs to be verified |
| what if opposite were true? | we'd break all extant workflows — unacceptable |
| did wisher say this? | implicit — no one asked for breaking changes |
| exceptions? | none |

**verdict**: assumption needs verification. the fix MUST preserve extant behavior for `.behavior/` routes.

**action**: add explicit test cases for `.behavior/` routes in criteria phase.

---

### assumption 5: the guard already has route path available

| question | answer |
|----------|--------|
| what do we assume without evidence? | that the guard can easily compare target path against bound route path |
| evidence | guard already finds bind flag at `$route/.route/.bind.*.flag` and derives `ROUTE_DIR` |
| what if opposite were true? | would need more complex path resolution |
| did wisher say this? | no, but code confirms this |
| exceptions? | none |

**verdict**: assumption holds. guard already extracts `ROUTE_DIR`.

---

### assumption 6: no other code reads from `$route/.route/blocker/`

| question | answer |
|----------|--------|
| what do we assume without evidence? | that moving blockers won't break consumers |
| evidence | **none — this needs to be audited** |
| what if opposite were true? | blocker consumers would break |
| did wisher say this? | no |
| exceptions? | unknown |

**verdict**: assumption needs verification. audit blocker consumers before implementing.

---

## hidden assumptions surfaced

1. **we assume the guard is a shell procedure** — verified, it is (route.mutate.guard.sh)
2. **we assume path comparison is string-based** — verified, grep patterns
3. **we assume routes are single-level** — not explicitly verified; what about nested routes?

### nested routes question

can a route live inside another route? e.g., `.behavior/outer/.behavior/inner/`?

- if yes: guard logic becomes more complex
- if no: simpler, just check immediate `.route/` subdirectory

**recommended**: assume no nested routes for now. add as edgecase in criteria if needed.

---

## conclusion

most assumptions hold with evidence:
- routes at `.route/` — wisher explicit
- `.route/` subdirectory protected — wisher explicit
- blocker relocation — wisher explicit (not an assumption)
- guard has route path — code verified

needs verification:
- extant `.behavior/` routes stay working — add tests
- blocker consumers — audit before implementing
- no nested routes — document as non-goal

no issues found that require vision changes.
