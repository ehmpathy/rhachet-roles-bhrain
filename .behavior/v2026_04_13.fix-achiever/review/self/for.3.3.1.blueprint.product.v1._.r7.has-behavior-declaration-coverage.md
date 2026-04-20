# self-review r7: has-behavior-declaration-coverage

## what i found

i performed systematic coverage check across wish, vision, and criteria. found one gap between criteria and blueprint that i address as criteria over-specification.

---

## systematic coverage: wish items

### wish 1: achiever briefs boot

**wish says:** "we need to add achiever briefs which teach and incentivize brains to use goals."

**blueprint says:** briefs already exist, boot.yml already boots them. add onBoot hook to refresh after compaction.

**coverage:** ✓ fully addressed. briefs extant, onBoot hook added.

---

### wish 2: discourage --scope repo

**wish says:** "we need to discourage use of --scope repo. scope should be automatic."

**blueprint says:** fail-fast if `--scope repo` while bound to route. scope is automatic via getDefaultScope().

**coverage:** ✓ fully addressed. validateScopeWhenBound() added.

---

### wish 3: clearer skill headers

**wish says:** "we need to update the skill headers and help messages to make it clearer how to positively use the goals"

**blueprint says:** rewrite headers with recommended patterns (flags one-by-one), add examples, add best practices note.

**coverage:** ✓ fully addressed. goal.memory.set.sh, goal.triage.next.sh, goal.triage.infer.sh headers rewritten.

---

### wish 4: clearer "do the work" message

**wish says:** "just like the route.drive has a blockers.json, and after 5 repeated blocks it makes it clearer and clearer to the brain that they need to actually fulfill the stone"

**blueprint says:** replicate DriveBlockerState for goal blockers, escalate onStop messages after 5 blocks.

**coverage:** ✓ fully addressed. GoalBlockerState, get/set/resetGoalBlockerState, escalateMessageByCount().

---

### wish 5: onBoot hook

**wish says:** "we need an onBoot hook to boot up the `goal.triage.next` hooks back into memory"

**blueprint says:** add `--when hook.onBoot` mode to goal.triage.next, add hooks.onBrain.onBoot to getAchieverRole.ts.

**coverage:** ✓ fully addressed. handleOnBootMode() added.

---

### wish 6: forbid unknown args

**wish says:** "need to forbid unknown args on the `rhx goal.memory.set` operation... unknown keys -> failfast"

**blueprint says:** fail-fast on unknown flags, unknown yaml keys, invalid status values.

**coverage:** ✓ fully addressed. collectUnknownFlags(), validateUnknownFlags(), collectUnknownKeys(), validateUnknownKeys(), validateStatusValue().

---

### wish 7: better --help

**wish says:** "rhx goal.memory.set --help should make it super duper clear how to use the operation with best practices and examples included"

**blueprint says:** comprehensive --help with examples and best practices.

**coverage:** ✓ fully addressed. handleHelp(), emitHelpOutput() with full format specification.

---

## systematic coverage: vision requirements

| vision requirement | blueprint coverage |
|-------------------|-------------------|
| auto-scope detection | ✓ getDefaultScope() |
| fail-fast --scope repo when bound | ✓ validateScopeWhenBound() |
| onBoot hook to refresh after compaction | ✓ hooks.onBrain.onBoot |
| escalate onStop hooks after 5 blocks | ✓ escalateMessageByCount() |
| strict arg validation | ✓ validateUnknownFlags(), validateStatusValue() |
| comprehensive --help | ✓ emitHelpOutput() |
| GoalBlockerState parallel to DriveBlockerState | ✓ GoalBlocker.ts |
| .blockers.latest.json parallel to drive | ✓ .goals/$branch/.blockers.latest.json |

**verdict:** all vision requirements covered.

---

## systematic coverage: criteria usecases

### usecase.1: session lifecycle

| criterion | blueprint |
|-----------|-----------|
| onBoot hook fires | ✓ hooks.onBrain.onBoot |
| goal state refreshed | ✓ handleOnBootMode() |
| onStop reminder | ✓ extant + escalation |
| escalation after 5 | ✓ escalateMessageByCount() |

---

### usecase.2: goal creation

| criterion | blueprint |
|-----------|-----------|
| goal persisted | ✓ extant |
| all 6 fields → created | ✓ extant |
| absent required → fail-fast | ⚠ GAP |

**gap analysis:**
- criteria specifies fail-fast on absent required field
- wish does NOT request this (wish 6 says "unknown args", not "absent required args")
- vision says fields required for "complete" goal, not that incomplete goals fail
- extant behavior allows partial goals with status `incomplete` and triage reminders

**decision:** criteria over-specified beyond wish. extant behavior (allow partial, remind via triage) is correct. no blueprint change needed.

---

### usecase.3-8: status updates, scope, help, validation, escalation, file edit

| usecase | coverage |
|---------|----------|
| 3. status updates | ✓ validateStatusValue() |
| 4. scope detection | ✓ getDefaultScope(), validateScopeWhenBound() |
| 5. help | ✓ emitHelpOutput() |
| 6. arg validation | ✓ validateUnknownFlags(), validateUnknownKeys() |
| 7. escalation | ✓ GoalBlockerState, escalateMessageByCount() |
| 8. file edit prevention | ✓ extant goal.guard |

---

## summary

| source | total items | covered | gaps |
|--------|-------------|---------|------|
| wish | 7 | 7 | 0 |
| vision | 8 | 8 | 0 |
| criteria | 8 usecases | 7.5 | 0.5 |

**one gap found:** criteria usecase.2 says fail-fast on absent required field.

**gap decision:** this is criteria over-specification, not a blueprint gap:
1. wish 6 says "unknown args → failfast", not "absent args → failfast"
2. vision implies triage accountability for incomplete goals
3. extant behavior allows partial goals (status incomplete) with triage reminders
4. partial goals serve users better than reject at CLI

**conclusion:** blueprint fully covers wish and vision. criteria usecase.2 should be updated to match intent (allow partial, triage reminds).

