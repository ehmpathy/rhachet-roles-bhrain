# self-review r2: has-questioned-assumptions

## vision re-read with fresh eyes

i went back to the vision and read it line by line. i am the reviewer now, not the author.

---

## assumptions surfaced and deeply questioned

### assumption: "the guard is overzealous"

**what the vision claims**: the guard blocks writes to bound route directories when it shouldn't.

**what if the opposite were true?** what if the guard correctly blocks these writes, and declapract.upgrade creates routes in the wrong place?

**evidence for the assumption**:
- the wish explicitly says "writes to @reporoot/.route/xyz should be permitted if the bound route is @reporoot/.route/xyz"
- the wisher has seen the problem in practice and asks for this fix

**evidence against the assumption**:
- could be that declapract.upgrade should create routes at `.behavior/` instead
- the `.route/` directory name itself suggests "route metadata", not "where routes live"

**verdict**: the wisher explicitly chose to support routes at `.route/`. this is a design decision, not an accident. the assumption holds.

---

### assumption: "metadata goes in `.route/` subdirectory"

**what the vision claims**: metadata (passage.jsonl, bind flags) should live in `$route/.route/`.

**what if the opposite were true?** what if metadata should live alongside artifacts, and protection should be file-extension based (*.jsonl protected, *.md allowed)?

**evidence for the assumption**:
- current implementation uses this pattern
- wisher says ".route/xyz/.route should be blocked" — this confirms the subdirectory pattern

**evidence against the assumption**:
- file-extension based protection might be simpler
- the `.route/` in `.route/` pattern causes confusion

**verdict**: the wisher explicitly confirms the subdirectory pattern. to change it would require wisher approval. assumption holds.

---

### assumption: "blockers should be visible"

**what the vision claims**: blockers should move from `$route/.route/blocker/` to `$route/blocker/`.

**what if the opposite were true?** what if blockers are internal artifacts that drivers shouldn't see until appropriate?

**evidence for the assumption**:
- wish says "blocker explanation files should go into $route/blocker, not $route/.route/blocker"
- blockers explain why passage was blocked — useful for the driver to see

**evidence against the assumption**:
- if blockers are visible, drivers might try to delete or edit them
- hidden blockers can't be tampered with

**verdict**: the wisher explicitly requested visible blockers. if tamper risk is a concern, the guard can protect `blocker/` from deletion. assumption holds per wisher intent.

---

### assumption: "we can distinguish paths by comparison against ROUTE_DIR"

**what the vision claims**: the guard can check if a target path is within the bound route but not in its `.route/` subdirectory.

**what if the opposite were true?** what if path comparison is unreliable (symlinks, relative paths, case sensitivity)?

**evidence for the assumption**:
- guard already does path comparison for route match
- paths are normalized before comparison

**evidence against the assumption**:
- symlinks could point to unexpected locations
- relative paths like `../` could escape
- case sensitivity varies by filesystem

**actual risk discovered**: the guard uses string-based grep match. if TARGET_PATH is relative and ROUTE_DIR is absolute (or vice versa), comparison could fail.

**action needed**: criteria should specify that paths must be normalized before comparison.

---

### assumption: "no nested routes"

**what the vision claims**: doesn't explicitly address this, but assumes routes don't nest.

**what if the opposite were true?** what if someone creates `.behavior/outer/inner/1.vision.stone`?

**evidence for the assumption**:
- no evidence of nested routes in current code
- mental model of routes is flat

**evidence against the assumption**:
- no guard prevents nested route creation
- future use cases might want them

**verdict**: assumption is not validated. however, nested routes are out of scope for this fix. document as non-goal.

---

## issues found and how they were addressed

### issue 1: path normalization not specified

**what i found**: the vision assumes path comparison works, but doesn't specify how paths should be normalized.

**how it should be fixed**: add to criteria that paths must be normalized (absolute vs relative) before comparison.

**status**: not a vision change — criteria phase concern. documented here.

### issue 2: no explicit test cases for `.behavior/` routes

**what i found**: the vision says "guard behavior unchanged for `.behavior/` routes" but doesn't prove it.

**how it should be fixed**: criteria should include explicit test cases that show `.behavior/` routes work as before.

**status**: not a vision change — criteria phase concern. documented here.

---

## why non-issues hold

### the `.route/` in `.route/` pattern

i questioned whether this is awkward. it is. but:
- the wisher chose this pattern explicitly
- it's consistent: `.route/` ALWAYS means metadata subdirectory
- to change it would require a different design
- the vision acknowledges the awkwardness in "what is awkward" section

no change needed — the awkwardness is acknowledged.

### blocker location change as breakage

i questioned whether this breaks consumers. it might. but:
- the vision notes this in "open questions"
- criteria phase will audit consumers
- this is implementation detail, not vision concern

no change needed — the concern is captured.

---

## conclusion

after deeper reflection:
- core assumptions hold with wisher-provided evidence
- two criteria-phase concerns documented (path normalization, .behavior/ tests)
- no vision changes required
- the review surfaced risks that will inform criteria

the vision is sound for this phase.
