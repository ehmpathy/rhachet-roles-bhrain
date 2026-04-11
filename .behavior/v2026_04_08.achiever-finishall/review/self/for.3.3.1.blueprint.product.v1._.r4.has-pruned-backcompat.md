# self-review: has-pruned-backcompat

## question: did I add backwards compatibility that was not requested?

### scan for backwards compat patterns

**deprecation paths:**
- none in blueprint — all features are new additions
- no extant behavior is replaced or modified

**migration logic:**
- none in blueprint — no data format changes
- no version detection needed

**fallback behaviors:**
- none in blueprint — features either work or error
- no "if old format, do X" logic

**compatibility shims:**
- none in blueprint — no interop with old systems

---

### analysis: is any backwards compat implied?

**goal.triage.next:**
- new skill, new hook — no prior version exists
- no backwards compat needed

**goal.guard:**
- new hook — no prior version exists
- skills (goal.memory.set, goal.memory.get) already exist and are unmodified
- the guard blocks direct access, not skill access — this is new behavior, not modified behavior

**getAchieverRole modification:**
- adds onTool and onStop hooks
- does not remove or modify extant hooks
- extant onStop hooks continue to work — we append, not replace

---

### potential concern: will goal.guard break extant behavior?

**question:** if a bot previously used direct file access to .goals/, will it break?

**answer:** yes, intentionally. the wish explicitly states "forbid touch .goals/ dirs directly... bots cant say 'i dont want to' and delete all their goals."

this is not backwards compat to preserve — this is the feature. block means block.

**is this "backwards compat by assumption"?** no. the wisher explicitly requested this block.

---

### potential concern: will onStop hook interfere with extant onStop hooks?

**question:** does the achiever role have extant onStop hooks?

**answer:** yes — it has `goal.infer.triage --when hook.onStop`. we add `goal.triage.next --when hook.onStop`.

**is there a conflict?**
- goal.infer.triage: detects new asks, creates goals
- goal.triage.next: shows unfinished goals

these are complementary, not in conflict. order: infer first (detect asks), then triage.next (show state).

**did I add compat logic "to be safe"?** no. both hooks run independently. no special sequence logic added.

---

### potential concern: should goal.guard have a "privilege" mode?

**question:** route.mutate.guard has a `--privilege` flag for authorized bypasses. should goal.guard?

**answer:** no. the wish says "forbid touch .goals/ dirs directly... bots cant say 'i dont want to' and delete all their goals."

there is no mention of authorized bypass. there is no mention of privilege. the intent is absolute prohibition.

**did I add privilege "to be safe"?** no. i could have added `--privilege` for future flexibility, but this would be YAGNI. if the wisher wants privilege later, they can request it then.

**what I learned:** the temptation to add "escape hatches" for future flexibility is strong. but an escape hatch in a guard defeats the purpose. a guard that can be bypassed is not a guard.

---

### potential concern: what about .goals-archive paths?

**question:** should we preserve access to `.goals-archive/` for backwards compat?

**answer:** the vision explicitly mentions this:
> `.goals-archive/old.yaml` → not blocked (different dir)

this is not backwards compat — this is the correct behavior by design. the regex pattern `(^|/)\.goals(/|$)` specifically avoids `.goals-archive` because the pattern requires `.goals` to end with `/` or be at the end of the string.

**did I add special treatment "to be safe"?** no. the regex naturally excludes `.goals-archive` without explicit logic. no compatibility shim needed.

---

## conclusion

**backwards compat added without request:** none

**issues found:** 0

**why each concern holds:**

| concern | verdict | reason |
|---------|---------|--------|
| break direct access | intentional | wish explicitly requests this |
| onStop hook conflict | none | hooks are complementary |
| privilege bypass | not added | wish says absolute prohibition |
| .goals-archive access | preserved | regex naturally excludes it |

**what I verified:**
1. re-read the wish — no mention of compatibility requirements
2. re-read the vision — explicitly mentions `.goals-archive` should work
3. checked getAchieverRole.ts — hooks append, do not replace
4. verified regex pattern — correctly excludes `.goals-archive`

**the blueprint is clean of unnecessary backwards compat concerns.**
