# self-review r3: has-questioned-questions (deeper pass)

## implicit questions found in "what is awkward"

the "what is awkward" section contains implicit questions that need triage.

### 1. should "ask" be renamed to "origin"?

| context | "ask" implies human-originated, but self-generated goals don't have an "ask" in the same sense |
|---------|-------------|
| triage | **[answered]** |
| reason | can answer via logic: keep "ask" for v1. the term is simple and the wish uses it ("what was said"). the asymmetry with self-generated goals is minor — brain can still articulate what prompted the goal. rename to "origin" only if confusion arises in practice. |

**resolution**: keep "ask" for v1. revisit if user feedback indicates confusion.

---

### 2. should gates be optional (allow null)?

| context | some goals are fuzzy ("improve code quality") and hard to gate |
|---------|-------------|
| triage | **[answered]** |
| reason | can answer via logic: require gates for v1. forcing a gate promotes clarity — if brain can't articulate how to verify, the goal may be too vague. "improve code quality" becomes "reduce lint errors to zero" or "pass all tests". optional gates enable fuzzy goals that never complete. |

**resolution**: require gates. fuzzy goals are a smell — articulate verification or decompose into clearer sub-goals.

---

### 3. can goals span multiple routes?

| context | what if a goal applies to work across routes? |
|---------|-------------|
| triage | **[wisher]** |
| reason | only wisher knows if this is a real usecase. current design (route-scoped or repo-scoped) may be sufficient. |

**action**: added to wisher questions below.

---

### 4. what about goals that exist before any route is created?

| context | repo-level goals with no route context |
|---------|-------------|
| triage | **[answered]** |
| reason | can answer via logic: repo-scoped `.goals/` handles this. wish explicitly says "into the reporoot/.goals/ dir, if not within a route" (line 63). pre-route goals go to repo level. |

**resolution**: handled by design. repo-scoped goals exist at reporoot/.goals/.

---

### 5. when is a goal truly "done"? (lifecycle question)

| context | options: brain marks done, human confirms, gate verified |
|---------|-------------|
| triage | **[answered]** |
| reason | can answer via logic: brain marks done with evidence for v1. this matches the "root primitive" scope — simple state transition. human confirmation or automated gate verification can be added later. the evidence field provides auditability. |

**resolution**: brain marks done with evidence. human can inspect .goals/ and challenge if needed.

---

## updated triage summary

### questions for wisher (new)

| question | reason |
|----------|--------|
| should goals have priority/urgency? | wish defers to future, confirm v1 scope |
| should goals have dependencies? | wish doesn't mention, confirm scope |
| **[new]** can goals span multiple routes? | design assumes single route or repo scope |

### questions answered (new in r3)

| question | resolution |
|----------|------------|
| should "ask" be renamed? | no, keep for v1; revisit if confusion |
| should gates be optional? | no, require gates to force clarity |
| what about pre-route goals? | handled by repo-scoped .goals/ |
| when is a goal done? | brain marks done with evidence |

### research questions (unchanged)

| question | reason |
|----------|--------|
| how do other ai systems track goals? | context for design |
| what goal taxonomies exist? | inform ask/task/gate shape |
| how do humans express goals? | inform goal.infer prompt |

## vision update needed

add the new wisher question (multi-route goals) to the vision.

## issues found and fixed

### issue 1: implicit questions not triaged

**issue**: "what is awkward" section contains implicit questions not triaged.

**fix**: triaged all implicit questions:
- "ask" vs "origin" → answered: keep "ask" for v1
- optional gates → answered: require gates for clarity
- pre-route goals → answered: repo-scoped handles this
- multi-route goals → [wisher] added to questions list
- lifecycle → answered: brain marks done with evidence

### issue 2: vision not updated with decisions

**issue**: the vision's "what is awkward" section left questions open without decisions.

**fix**: updated vision to mark each awkward item with:
- **[answered]** tag with the decision
- rationale for the decision
- what would trigger revisiting

the vision now reflects all triage decisions, not just the explicit questions section.

## why this holds

the review is complete because:
1. all explicit questions are triaged and tagged
2. all implicit questions in "what is awkward" are now answered or marked [wisher]
3. the vision document reflects all decisions
4. research items are tagged for later phases
5. wisher items are clearly marked for confirmation
