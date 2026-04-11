# self-review: has-behavior-declaration-coverage

## question: does the blueprint cover all requirements from vision and criteria?

---

## vision requirements coverage

### usecase 1: goal.triage.next onStop reminder

| vision requirement | blueprint coverage | status |
|-------------------|-------------------|--------|
| "goal.triage.next --when hook.onStop" | goal.triage.next.sh accepts --when hook.onStop | ✓ |
| "if any inflight, show only inflight" | goalTriageNext shows inflight first | �� |
| "if any enqueued, show only enqueued" | goalTriageNext shows enqueued if no inflight | ✓ |
| owl wisdom header | contract shows owl emoji header | ✓ |
| treestruct format with crystal ball | contract shows crystal ball header | ✓ |
| exit 0 if clear | exit code 0 for no goals | ✓ |
| exit 2 if blocked | exit code 2 for unfinished goals | ✓ |
| shows slug, why.ask, status | contract shows these fields | ✓ |

### usecase 2: goal.guard protection hook

| vision requirement | blueprint coverage | status |
|-------------------|-------------------|--------|
| "hook to forbid touch .goals/ dirs" | goal.guard PreToolUse hook | ✓ |
| blocks bash rm | getGoalGuardVerdict checks command | ✓ |
| blocks bash mv | getGoalGuardVerdict checks command | ✓ |
| blocks bash cat | getGoalGuardVerdict checks command | ✓ |
| blocks Read | getGoalGuardVerdict checks file_path | ✓ |
| blocks Write | getGoalGuardVerdict checks file_path | ✓ |
| blocks Edit | getGoalGuardVerdict checks file_path | ��� |
| allows skill invocations | skills use rhx command, not .goals/ path | ✓ |
| owl wisdom on block | contract shows owl header | ✓ |
| lists allowed skills | contract lists goal.memory.set, etc. | ✓ |
| exit 2 on block | exit code 2 for blocked | ✓ |

---

## criteria.blackbox coverage

### usecase.1 episodes

| criterion | blueprint coverage | status |
|-----------|-------------------|--------|
| inflight goals → treestruct with inflight, exit 2 | test case: inflight exist | ✓ |
| enqueued only → treestruct with enqueued, exit 2 | test case: enqueued only | ✓ |
| no goals → silent, exit 0 | test case: no goals | ✓ |
| no .goals/ dir → silent, exit 0 | test case: no goals dir | ✓ |
| mixed → show inflight only | test case: mixed | ✓ |

### usecase.2 episodes

| criterion | blueprint coverage | status |
|-----------|-------------------|--------|
| bash rm blocked | test case: bash rm | ✓ |
| bash cat blocked | test case: bash cat | ✓ |
| Read blocked | test case: Read | ✓ |
| Write blocked | test case: Write | ✓ |
| Edit blocked | test case: Edit | ✓ |
| safe path allowed | test case: safe path | ✓ |
| .goals-archive allowed | test case: archive | ✓ |
| route scope blocked | test case: route scope | ✓ |

### boundary conditions

| criterion | blueprint coverage | status |
|-----------|-------------------|--------|
| ^.goals/ matches | getGoalGuardVerdict regex | ✓ |
| /.goals/ matches | getGoalGuardVerdict regex | ✓ |
| .goals-archive excluded | regex requires / or $ after .goals | ✓ |

---

## criteria.blueprint coverage

| criterion | blueprint coverage | status |
|-----------|-------------------|--------|
| --when hook.onStop argument | goalTriageNext contract | ✓ |
| --scope repo\|route argument | goalTriageNext contract | ✓ |
| exit 0 no unfinished | exit code semantics | ✓ |
| exit 2 unfinished | exit code semantics | ✓ |
| intercepts PreToolUse | onTool hook registration | ✓ |
| blocks .goals/ pattern | getGoalGuardVerdict | ✓ |

---

## deeper verification: did I miss any requirement?

### potential gap 1: bash mv

**question:** the vision mentions "blocks bash mv" but the criteria.blackbox test cases do not include bash mv.

**investigation:**
- vision line: "blocks bash mv | getGoalGuardVerdict checks command | ✓"
- criteria.blackbox usecase.2 episodes: bash rm, bash cat, Read, Write, Edit — no bash mv listed

**verdict:** this is a gap in the criteria, not the blueprint. the blueprint's getGoalGuardVerdict handles any command that contains `.goals/` in the path. the test coverage should include bash mv.

**action:** add bash mv to the acceptance test cases. this is a test gap, not a design gap.

### potential gap 2: the "mixed" scenario

**question:** the criteria says "mixed → show inflight only". does the blueprint explicitly handle this?

**investigation:**
- blueprint codepath tree shows: "if inflight: show inflight only"
- the logic is: check inflight first, if present show only inflight, else show enqueued
- the test coverage table shows: "mixed | test case: mixed"

**verdict:** covered. the sequential check pattern handles mixed scenarios by design.

### potential gap 3: scope detection

**question:** the criteria says "--scope repo|route argument" but what if neither is provided?

**investigation:**
- blueprint codepath tree shows: "detect scope via getDefaultScope() if not provided"
- getDefaultScope already exists in extant code
- contract shows "--scope repo|route  // optional, inferred from route bind"

**verdict:** covered. scope inference is explicit in the blueprint.

### potential gap 4: stderr vs stdout

**question:** goal.guard outputs to stderr, goal.triage.next outputs to stdout. is this consistent?

**investigation:**
- vision says goal.guard output should show on block
- vision says goal.triage.next should show unfinished goals
- blueprint explicitly says: goal.guard → "print treestruct to stderr"
- blueprint explicitly says: goal.triage.next → stdout (implied by format output)

**verdict:** intentional distinction. goal.guard is an error (blocked operation). goal.triage.next is informational (status report). stderr for errors, stdout for info. consistent with unix convention.

---

## gaps found

**test gap:** bash mv should be added to acceptance tests. the blueprint's regex handles it, but explicit test coverage is absent from criteria.blackbox.

**no design gaps.** all requirements from vision and criteria are addressed in the blueprint.

---

## requirements traceability matrix

| id | source | requirement | blueprint location | test case |
|----|--------|-------------|--------------------|-----------|
| V1.1 | vision | goal.triage.next --when hook.onStop | goal.triage.next.sh args | inflight exist |
| V1.2 | vision | show inflight only if inflight exist | goalTriageNext logic | mixed |
| V1.3 | vision | show enqueued only if no inflight | goalTriageNext logic | enqueued only |
| V1.4 | vision | owl wisdom header | contract stdout | inflight exist |
| V1.5 | vision | treestruct with crystal ball | contract stdout | inflight exist |
| V1.6 | vision | exit 0 if clear | exit code semantics | no goals |
| V1.7 | vision | exit 2 if unfinished | exit code semantics | inflight exist |
| V2.1 | vision | blocks bash rm | getGoalGuardVerdict | bash rm |
| V2.2 | vision | blocks bash mv | getGoalGuardVerdict | **absent** |
| V2.3 | vision | blocks bash cat | getGoalGuardVerdict | bash cat |
| V2.4 | vision | blocks Read | getGoalGuardVerdict | Read |
| V2.5 | vision | blocks Write | getGoalGuardVerdict | Write |
| V2.6 | vision | blocks Edit | getGoalGuardVerdict | Edit |
| V2.7 | vision | allows skills | skills bypass guard | safe path |
| V2.8 | vision | owl wisdom on block | contract stderr | blocked |
| V2.9 | vision | lists allowed skills | contract stderr | blocked |
| B1.1 | boundary | ^.goals/ matches | regex pattern | route scope |
| B1.2 | boundary | /.goals/ matches | regex pattern | route scope |
| B1.3 | boundary | .goals-archive excluded | regex pattern | archive |

---

## what I verified

1. re-read vision usecase 1 line by line — all requirements mapped to blueprint locations
2. re-read vision usecase 2 line by line — all requirements mapped to blueprint locations
3. re-read criteria.blackbox — found one absent test case (bash mv)
4. re-read criteria.blueprint — all contracts specified
5. created traceability matrix to track requirement → design → test

## what I learned

1. **traceability matrices catch gaps tables miss.** the simple "covered/not covered" tables passed visual inspection. the full traceability matrix with test case column revealed the bash mv gap.

2. **criteria can have gaps too.** the vision explicitly listed bash mv as a requirement. the criteria.blackbox did not include a test case for it. the blueprint review is the place to catch such mismatches.

3. **stderr vs stdout is a design decision.** i initially questioned whether both skills should use the same output stream. the answer is no — they serve different purposes. guards produce errors (stderr), triages produce status (stdout).

**the blueprint fully covers the behavior declaration, with one test gap identified for repair.**
