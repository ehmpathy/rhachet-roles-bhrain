# self-review r6: has-behavior-declaration-coverage

## what i found

i cross-referenced the criteria usecases against the blueprint. found one coverage gap between criteria and blueprint.

---

## coverage check

### usecase.1: session lifecycle with goals

| criterion | blueprint coverage |
|-----------|-------------------|
| onBoot hook fires | ✓ hooks.onBrain.onBoot added |
| goal state refreshed after compaction | ✓ handleOnBootMode() |
| onStop hook fires with reminder | ✓ extant behavior |
| reminder lists unfinished goals | ✓ extant behavior |

**verdict:** covered.

---

### usecase.2: goal creation

| criterion | blueprint coverage |
|-----------|-------------------|
| goal with all fields → persisted | ✓ extant behavior |
| all 6 fields one-by-one → created | ✓ extant behavior |
| **absent required field → fail-fast** | ❌ **GAP** |
| error explains which field absent | ❌ **GAP** |

**analysis:**
- criteria says: "when any required field is absent → fail-fast with helpful error"
- blueprint says: (not addressed)
- extant behavior: allows partial goals with status `incomplete`

**gap:** criteria specifies fail-fast on absent required field, but blueprint doesn't implement this. extant behavior allows partial goals.

**resolution:** this is a design decision gap, not an oversight:
- wish 6 says "forbid unknown args" not "forbid absent required args"
- vision says all 6 fields required for "complete" goal, not that incomplete goals are forbidden
- extant behavior uses triage to remind about incomplete goals

**decision:** the criteria over-specified. the extant behavior (allow partial, triage reminds) is more user-friendly than fail-fast. the vision's "accept the overhead" means triage accountability, not cli rejection.

**action:** no change to blueprint. update criteria to match intent:
- change "fail-fast with helpful error" to "goal is created with status incomplete"
- change "error explains which field absent" to "triage reminds which fields absent"

---

### usecase.3: goal status updates

| criterion | blueprint coverage |
|-----------|-------------------|
| update status to fulfilled | ✓ extant behavior |
| update status to blocked | ✓ extant behavior |
| invalid status → fail-fast | ✓ validateStatusValue() |
| error shows valid statuses | ✓ emitValidationError() |

**verdict:** covered.

---

### usecase.4: scope detection

| criterion | blueprint coverage |
|-----------|-------------------|
| bound to route, no --scope → auto-detect route | ✓ getDefaultScope() |
| bound to route, --scope repo → fail-fast | ✓ validateScopeWhenBound() |
| not bound, no --scope → defaults to repo | ✓ getDefaultScope() |

**verdict:** covered.

---

### usecase.5: help and discoverability

| criterion | blueprint coverage |
|-----------|-------------------|
| --help shows recommended usage | ✓ emitHelpOutput() |
| shows all required fields | ✓ help output format |
| shows examples | ✓ help output format |
| shows valid status values | ✓ help output format |
| discourages stdin yaml | ✓ help output note |

**verdict:** covered.

---

### usecase.6: arg validation

| criterion | blueprint coverage |
|-----------|-------------------|
| unknown flag → fail-fast | ✓ validateUnknownFlags() |
| error shows allowed flags | ✓ emitValidationError() |
| unknown yaml key → fail-fast | ✓ validateUnknownKeys() |
| malformed yaml → parse error | ✓ extant yaml.load behavior |

**verdict:** covered.

---

### usecase.7: escalation with blockers tracker

| criterion | blueprint coverage |
|-----------|-------------------|
| onStop once → gentle reminder | ✓ escalateMessageByCount() |
| blockers count increments | ✓ setGoalBlockerState() |
| 5 times → escalated message | ✓ escalateMessageByCount() |
| fulfill goal → count resets | ✓ resetGoalBlockerState() |

**verdict:** covered.

---

### usecase.8: direct file edit prevention

| criterion | blueprint coverage |
|-----------|-------------------|
| edit .goals/ → blocked | ✓ extant goal.guard |
| suggests skill instead | ✓ extant goal.guard |

**verdict:** covered (extant behavior, no changes needed).

---

## summary

| usecase | covered? | notes |
|---------|----------|-------|
| 1. session lifecycle | ✓ | |
| 2. goal creation | partial | criteria over-specified fail-fast; extant allows partial |
| 3. status updates | ✓ | |
| 4. scope detection | ✓ | |
| 5. help | ✓ | |
| 6. arg validation | ✓ | |
| 7. escalation | ✓ | |
| 8. file edit prevention | ✓ | extant |

**gap found:** usecase.2 criteria says fail-fast on absent required field, but:
- wish doesn't request this
- vision implies triage accountability, not cli rejection
- extant behavior is more user-friendly

**resolution:** criteria should be updated, not blueprint. partial goals with triage reminders serve the user better than fail-fast rejection.

