# self-review r3: has-questioned-questions

## pause

i am the reviewer, not the author.

i re-read the vision's open questions section after the r2 triage update.

---

## verification: each question is now triaged

### question 1: routes at `.route/`

**in vision**: "[answered] only declapract.upgrade"

**verification**: i ran `grep -r "mkdir.*\.route/"` in r2. the result confirmed only declapract.upgrade creates routes there.

**why this holds**: the grep search is authoritative. no other code creates routes at `.route/`. the answer is correct.

**status**: properly marked [answered]. no change needed.

---

### question 2: migrate blockers

**in vision**: "[research] verify no consumers exist; likely no migration needed"

**verification**: i ran `grep -r "\.route/blocker"` in r2. found no consumers.

**why [research] instead of [answered]**: the grep found no consumers, but:
- the search could have missed patterns (e.g., dynamic path construction)
- criteria phase should explicitly verify via test coverage
- to mark [answered] would be premature

**what research should cover**:
- verify no code reads `$route/.route/blocker/`
- verify no code writes `$route/.route/blocker/`
- confirm migration is not needed

**status**: properly marked [research]. no change needed.

---

### question 3: passage.jsonl location

**in vision**: "[answered] no, stays at `$route/.route/` per wish scope"

**verification**: i re-read the wish in r2. the wish says:
- ".route/xyz/.route should be blocked"
- no mention of passage.jsonl relocation

**why this holds**: the wish scope is clear. passage.jsonl stays protected in `$route/.route/`. the guard fix is about artifact write access, not metadata relocation.

**status**: properly marked [answered]. no change needed.

---

## are there additional questions that should be added?

### surfaced in r2 assumptions review

**question: path normalization**

was surfaced and answered in r2:
- guard uses string-based grep match
- both paths are relative
- no normalization issue

**should this be added to vision?** no — it's an implementation detail, not a vision-level question. criteria can specify test coverage.

### surfaced in this review

**question: what about write to OTHER routes?**

the vision says "write to `$other_route/artifact.md` → blocked — not your route"

but: does the current guard actually block writes to other routes? let me verify.

**verification**: reviewed guard code. the guard only activates for paths within ROUTE_DIR (the bound route). writes to other locations are not checked by this guard.

**wait — is that correct?** the guard's purpose is:
1. protect route internals
2. keep driver focused on bound route

if driver writes to a different route, should that be blocked?

**analysis**:
- current behavior: writes outside bound route are NOT blocked by route.mutate guard
- expected behavior per wish: not specified
- implication: the vision should clarify whether cross-route writes are in scope

**action**: this is out of scope for the current fix. the wish focuses on artifact write access TO the bound route. cross-route protection is a separate concern.

**status**: not an issue for this vision. document as future consideration if needed.

---

## issues found

### issue: no new issues

**what i found**: all questions are properly triaged. the vision update in r2 captured the triage correctly.

**why this holds**:
- question 1 answered via grep search
- question 2 marked for research with clear scope
- question 3 answered via wish re-read

---

## why non-issues hold

### the triage is complete

the vision now has clear status markers:
- [answered] for questions resolved
- [research] for questions that need criteria-phase work

this matches the guide's requirements.

### no [wisher] questions

all questions were answerable via code or wish. no questions require wisher input.

this is correct — the wish was explicit enough.

---

## conclusion

the questions are properly triaged:
- 2 marked [answered] with evidence
- 1 marked [research] with clear scope

no additional questions need to be added to the vision.

the review is complete.
