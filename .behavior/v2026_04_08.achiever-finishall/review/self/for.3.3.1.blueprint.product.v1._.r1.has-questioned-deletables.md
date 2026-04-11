# self-review: has-questioned-deletables

## question: can anything be deleted?

### feature traceability

| feature | traces to wish? | traces to criteria? | verdict |
|---------|-----------------|---------------------|---------|
| goal.triage.next | yes — "goal.triage.next --when hook.onStop" | yes — usecase.1 | keep |
| goal.guard | yes — "hook to forbid touch .goals/ dirs" | yes — usecase.2 | keep |

**both features trace directly to the wish.** no phantom features.

### component traceability

| component | needed? | why? |
|-----------|---------|------|
| goal.triage.next.sh | yes | shell entrypoint per repo pattern |
| goal.guard.sh | yes | shell entrypoint per repo pattern |
| goalTriageNext (cli) | yes | node handler for shell skill |
| goalGuard (cli) | yes | node handler for shell skill |
| getTriageState | questionable | see below |
| getGoalGuardVerdict | yes | encapsulates path match logic |

### did I question getTriageState?

yes. can we delete it and inline the logic?

**argument for deletion:**
- goalTriageNext already calls getGoals twice (inflight, enqueued)
- getTriageState just wraps those two calls
- one less file, one less indirection

**argument for keep:**
- separates "what to show" from "how to format"
- testable in isolation
- follows repo pattern (domain.operations for logic)

**verdict:** questionable. could inline. but the separation is clean. **keep for now**, revisit if implementation feels over-engineered.

### did I question the test files?

yes. do we need separate test files for triage and guard?

**argument for merge:**
- both test achiever role behaviors
- could be one `achiever.goal.finishall.acceptance.test.ts`

**argument for separate:**
- triage and guard are distinct features
- separate files = easier to find, easier to run in isolation
- follows repo pattern (`achiever.goal.lifecycle`, `achiever.goal.triage`)

**verdict:** keep separate. matches extant patterns.

### what is the simplest version?

**goal.triage.next:**
- read goals, filter by status, format output, exit
- already minimal

**goal.guard:**
- read stdin, extract path, match regex, exit
- already minimal

no simpler version exists that satisfies the criteria.

---

## conclusion

**deleted:** none

**why it holds:**
1. both features trace to wish and criteria
2. all components serve explicit purpose
3. getTriageState is borderline but defensible
4. test file split follows repo convention

**note for implementation:** if getTriageState feels like overhead during build, delete it and inline. the blueprint permits this.

