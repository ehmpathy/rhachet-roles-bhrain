# self-review: has-questioned-assumptions

## assumptions questioned

### 1. assumption: goals are discrete, enumerable units

| question | answer |
|----------|--------|
| what do we assume? | goals can be cleanly separated into distinct units |
| evidence? | wish says "discern distinct goals" — supports this |
| what if opposite? | goals might be fuzzy, overlapped, or hierarchical |
| did wisher say? | yes, "distinct goals" is explicit in wish line 21 |
| exceptions? | some asks are compound: "make this faster and cleaner" — one goal or two? |

**verdict**: holds, but edge case exists. compound asks may need decomposition logic (future iteration per wish line 33).

---

### 2. assumption: file-per-goal is the right granularity

| question | answer |
|----------|--------|
| what do we assume? | each goal gets its own .goal.md file |
| evidence? | inferred from vision — not explicit in wish |
| what if opposite? | all goals in one file (goals.jsonl)? or database? |
| did wisher say? | no — wisher said ".goals/ dir", not "one file per goal" |
| exceptions? | many small goals could create file clutter |

**issue found**: file-per-goal is an assumption, not a requirement.

**resolution**: file-per-goal enables:
- easy inspection (cat one file)
- git-friendly diffs (per-goal history)
- simple get/set semantics

alternative (single jsonl) enables:
- atomic reads of all goals
- no directory traversal

**decision**: keep file-per-goal as default, but note as design choice that needs validation. vision already flags this in "open questions".

---

### 3. assumption: goals have a lifecycle (done/not-done/blocked)

| question | answer |
|----------|--------|
| what do we assume? | goals transition through states |
| evidence? | implied by "remember goals" and "accomplish goals" |
| what if opposite? | goals are just observations, no state machine |
| did wisher say? | "ensure achiever never forgets to accomplish their goals" — implies completion tracked |
| exceptions? | some goals may be perpetual ("keep code clean") |

**verdict**: holds. lifecycle is implied by "accomplish" language in wish line 29.

---

### 4. assumption: llm can reliably infer goals from text

| question | answer |
|----------|--------|
| what do we assume? | goal.infer can accurately extract goals from human input |
| evidence? | none — this is untested |
| what if opposite? | inference misses goals, creates spurious goals, or conflates goals |
| did wisher say? | "skill to detect... distinct goals" — implies detection is possible |
| exceptions? | vague input, sarcasm, rhetorical questions |

**issue found**: inference quality is a major assumption with no evidence.

**resolution**: this is acknowledged in vision's "assumptions" section: "llm can reliably infer goals — inference quality untested". vision already flags this.

**action**: no change needed; assumption is documented.

---

### 5. assumption: human and self-generated goals are equivalent

| question | answer |
|----------|--------|
| what do we assume? | both go in .goals/, both have same shape, both get tracked |
| evidence? | wish says "from communications" and "from internalizations" — treats both |
| what if opposite? | self-generated goals might need human approval first |
| did wisher say? | no explicit distinction in treatment |
| exceptions? | brain could spam .goals/ with low-value observations |

**verdict**: holds provisionally. vision includes `source: 'human' | 'self'` to distinguish origin, which enables future differentiation if needed.

---

### 6. assumption: route-scoped goals are preferred when in a route

| question | answer |
|----------|--------|
| what do we assume? | if in a route, goals go to $route/.goals/; else reporoot/.goals/ |
| evidence? | explicit in wish lines 62-63 |
| what if opposite? | all goals go to one place regardless of route |
| did wisher say? | yes, explicitly |
| exceptions? | goal spans multiple routes? (flagged in vision's "what is awkward") |

**verdict**: holds. wisher is explicit. edge case is documented.

---

### 7. assumption: ask/task/gate is sufficient for all goals

| question | answer |
|----------|--------|
| what do we assume? | these three fields capture all that's needed |
| evidence? | wisher says "key components" — suggests these are core |
| what if opposite? | some goals need deadline, priority, assignee, dependencies |
| did wisher say? | no mention of deadline, priority, or dependencies in initial wish |
| exceptions? | time-sensitive goals, blocked goals |

**issue found**: wish explicitly defers priority and deduplication to "future iterations" (lines 31-34).

**resolution**: vision correctly scopes to ask/task/gate for v1. future fields are captured in "questions to validate with wisher".

**verdict**: holds for v1 scope.

---

## summary

| assumption | source | verdict |
|------------|--------|---------|
| goals are discrete | wish | holds |
| file-per-goal | vision | holds (design choice, not requirement) |
| goals have lifecycle | wish | holds |
| llm can infer goals | assumed | documented as untested |
| human/self goals equivalent | wish | holds |
| route-scoped preferred | wish | holds |
| ask/task/gate sufficient | wish | holds for v1 |

## issues found and fixed

1. **file-per-goal is a design choice**: not explicitly required by wisher.
   - **fix**: noted as design decision. vision's "what is awkward" section touches on persistence location.

2. **llm inference is untested**: major assumption.
   - **fix**: already documented in vision's assumptions. no change needed.

## non-issues justified

1. **discrete goals**: wisher says "distinct goals" explicitly.
2. **lifecycle**: "accomplish" implies completion state.
3. **route-scoped**: wisher is explicit about location.
4. **ask/task/gate for v1**: wisher defers extensions to future.
