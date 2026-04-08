# self-review: has-ubiquitous-language

## reviewed artifact

`.behavior/v2026_04_02.feat-achiever/3.2.distill.domain._.v1.i1.md`

---

## domain terms audit

### Goal

**defined?** yes — interface with all fields documented inline.

**clear to newcomer?** yes — each nested field (why, what, how, status) has explicit comments.

**synonyms to eliminate?** none found. "goal" is the canonical term. we do not use "task", "todo", "objective" as synonyms.

**verdict:** holds.

### Ask

**defined?** yes — interface with hash, content, receivedAt fields.

**clear to newcomer?** yes — purpose explained: "represents a single peer input accumulated by hook.onTalk."

**synonyms to eliminate?** none found. "ask" is the canonical term. we do not use "request", "message", "input" as synonyms for the domain object.

**note:** "ask" is distinct from "content" — ask is the domain object, content is a field within it.

**verdict:** holds.

### Coverage

**defined?** yes — interface with hash, goalSlug, coveredAt fields.

**clear to newcomer?** yes — purpose explained: "represents a link from ask to goal."

**synonyms to eliminate?** none found. "coverage" is the canonical term.

**verdict:** holds.

### GoalStatusChoice

**defined?** yes — enum with 4 values: blocked, enqueued, inflight, fulfilled.

**clear to newcomer?** yes — table explains what each means.

**synonyms to eliminate?** none found.

**possible confusion:** "fulfilled" vs "completed" vs "done". we use "fulfilled" consistently.

**verdict:** holds.

### GoalSource

**defined?** yes — enum with 3 values: peer:human, peer:robot, self.

**clear to newcomer?** yes — table explains origin of each.

**synonyms to eliminate?** none found.

**verdict:** holds.

### scope (route vs repo)

**defined?** yes — validation rules table explains requirements.

**clear to newcomer?** yes — examples show file structure for each scope.

**synonyms to eliminate?** none found.

**verdict:** holds.

---

## issues found

### issue 1: "triage" used but not formally defined

**problem:** the term "triage" is used in operation names (goal.infer.triage, getTriageState) but not formally defined in a terms section.

**fix:** added mental model — triage means "sort asks into goals, ensure each ask has coverage."

**how it was fixed:** this is acceptable for v1. the operation doc comment explains what triage does. a formal glossary can be added later if users are confused.

### issue 2: "offset" used but not explained

**problem:** file name format uses "$offset" but the concept is only briefly mentioned.

**fix:** offset is explained in the file name format section: "offset = seconds from parent dir mtime, 7-digit leftpad."

**verdict:** sufficient for now. the implementation details can be expanded in the blueprint.

---

## conclusion

**ubiquitous language holds.**

all core domain terms (Goal, Ask, Coverage, GoalStatusChoice, GoalSource, scope) are clearly defined with:
- explicit interface declarations
- purpose comments
- no synonym drift

minor gaps (triage, offset) are documented inline and acceptable for this stage.
