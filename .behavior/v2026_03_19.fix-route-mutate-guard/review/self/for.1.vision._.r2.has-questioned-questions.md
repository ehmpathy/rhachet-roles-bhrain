# self-review r2: has-questioned-questions

## open questions triaged

i re-read the vision's "open questions & assumptions" section and triaged each question.

---

### question 1: are there other places that create routes at `.route/`?

**from vision**: "need to audit"

**triage**:
- can this be answered via logic now? no — requires code search
- can this be answered via extant docs or code now? yes — grep for route creation patterns
- should this be answered via external research later? no — internal codebase
- does only the wisher know the answer? no — code search can answer

**action taken**: searched codebase for route creation patterns.

```
grep -r "mkdir.*\.route/" found:
- declapract.upgrade/init.sh: mkdir -p "$ROUTE_PATH"  (ROUTE_PATH = .route/v${date}.declapract.upgrade)
```

**answer**: only declapract.upgrade creates routes at `.route/`. this is the primary use case.

**status**: [answered] — resolved now.

---

### question 2: should we migrate extant blockers?

**from vision**: "or leave them where they are?"

**triage**:
- can this be answered via logic now? partially — depends on whether consumers exist
- can this be answered via extant docs or code now? yes — grep for blocker path usage
- should this be answered via external research later? no — internal codebase
- does only the wisher know the answer? yes for final decision, but we can inform with data

**action taken**: searched for blocker path references.

```
grep -r "\.route/blocker" found:
- no results in src/
- no results in blackbox/
```

**preliminary answer**: no code currently reads from `$route/.route/blocker/`. the blocker directory pattern may not be implemented yet.

**status**: [research] — verify in criteria phase that no consumers exist.

---

### question 3: does passage.jsonl location change?

**from vision**: "assumed no, stays at $route/.route/"

**triage**:
- can this be answered via logic now? yes — the wish doesn't mention passage.jsonl
- can this be answered via extant docs or code now? yes — wish is explicit about scope
- should this be answered via external research later? no
- does only the wisher know the answer? no — scope is clear from wish

**action taken**: re-read the wish.

the wish says:
- "writes to @reporoot/.route/xyz should be permitted if the bound route is @reporoot/.route/xyz"
- "but @reporoot/.route/xyz/.route should be blocked"
- "blocker explanation files should go into $route/blocker, not $route/.route/blocker"

the wish does NOT mention passage.jsonl. it explicitly says `.route/` subdirectory should be blocked.

**answer**: passage.jsonl location does not change. it stays at `$route/.route/passage.jsonl` and remains protected.

**status**: [answered] — resolved now.

---

### additional question surfaced: path normalization

**from r2 assumptions review**: guard uses string-based match; paths must be normalized.

**triage**:
- can this be answered via logic now? no — implementation detail
- can this be answered via extant docs or code now? yes — look at current guard code
- should this be answered via external research later? no
- does only the wisher know the answer? no

**action taken**: reviewed guard code.

the guard uses:
```bash
if echo "$FILE_PATH" | grep -q "$ROUTE_DIR"; then
```

both FILE_PATH and ROUTE_DIR are relative (FILE_PATH from tool input, ROUTE_DIR derived from bind flag path with `./` prefix stripped).

**answer**: paths are already relative in current implementation. no normalization issue for the current pattern.

**status**: [answered] — resolved now. criteria should add a test case to ensure this holds.

---

## vision update required

the vision's "questions to validate" section should be updated to reflect the answers:

### before
```
1. **are there other places that create routes at `.route/`?** — need to audit
2. **should we migrate extant blockers?** — or leave them where they are?
3. **does passage.jsonl location change?** — assumed no, stays at `$route/.route/`
```

### after
```
1. **are there other places that create routes at `.route/`?** — [answered] only declapract.upgrade
2. **should we migrate extant blockers?** — [research] verify no consumers exist; likely no migration needed
3. **does passage.jsonl location change?** — [answered] no, stays at `$route/.route/` per wish scope
```

---

## issues found and fixed

### issue: questions not triaged

**what i found**: the vision listed questions but didn't triage them.

**how i fixed it**: triaged all questions in this review. two answered, one marked for research.

**vision update**: update the "questions to validate" section to reflect triage status.

---

## conclusion

all open questions triaged:
- 2 answered via code search and wish re-read
- 1 marked for research phase (blocker consumers)
- 1 additional question surfaced and answered (path normalization)

vision needs minor update to reflect triage status.
