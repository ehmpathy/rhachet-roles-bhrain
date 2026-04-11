# self-review r2: has-questioned-questions

*triage the open questions*

---

## questions from the vision

re-read the "open questions & assumptions" section of `1.vision.md`:

---

### question 1: should protection apply to route-scoped goals too?

> e.g., `.behavior/.../goals/`
> current assumption: yes, same protection

**triage:**
- can this be answered via logic now? **yes**
- the wisher said "forbid touch of .goal/ dirs directly"
- route-scoped goals live at `.behavior/.../goals/` not `.goals/`
- but the pattern `.goals/` is different from `/.goals/`

**answer:** the protection hook should match:
- `^\.goals/` — repo-scoped goals at root
- `/\.goals/` — route-scoped goals inside `.behavior/`

**status:** [answered] — use regex pattern that covers both

---

### question 2: what if a bot legitimately needs to read goal files for debug?

**triage:**
- can this be answered via logic now? **yes**
- the `goal.memory.get` skill provides read access
- debug use case: bot wants to see raw yaml
- but `goal.memory.get` outputs treestruct, not raw yaml

**answer:** if raw yaml is needed, add `--format yaml` flag to `goal.memory.get`. but for now, treestruct output should suffice for debug. the protection is intentional.

**status:** [answered] — use `goal.memory.get` skill; can enhance later if needed

---

### question 3: should enqueued goals soft-block or just remind?

**triage:**
- does only the wisher know the answer? **yes**
- the wisher said "if any inflight, show only inflight; if any enqueued, show only enqueued"
- but didn't specify exit codes

**current decision:** remind only (exit 0) for enqueued, soft-block (exit 2) for inflight

**rationale:**
- inflight = explicit commitment = should finish
- enqueued = captured = may start later

this distinction feels right, but the wisher should confirm.

**status:** [wisher] — confirm enqueued = exit 0, inflight = exit 2

---

### assumption 1: bots respect hooks

**triage:**
- can this be answered via extant docs? **yes**
- claude code hooks are enforced by the harness
- bots cannot modify `settings.json` to disable hooks

**status:** [answered] — hooks are enforced by harness, not optional

---

### assumption 2: exit 2 is a soft block

**triage:**
- can this be answered via extant docs or code? **maybe**
- need to check claude code docs for hook exit code semantics
- the mechanic briefs mention exit codes but not onStop behavior

**status:** [research] — verify claude code onStop hook exit code behavior

---

### assumption 3: onStop fires reliably

**triage:**
- can this be answered via extant docs? **yes**
- the extant achiever role already uses onStop
- if it didn't fire reliably, extant feature would fail

**status:** [answered] — proven by extant onStop hook usage

---

## updates to the vision

the vision's "open questions & assumptions" section should be updated to reflect triage status.

**issue found:** the vision doesn't mark questions as [answered]/[research]/[wisher]

**fix:** update the vision to clarify status of each question.

---

## updated questions section for vision

```markdown
### questions for wisher

1. **should protection apply to route-scoped goals too?** (e.g., `.behavior/.../goals/`)
   - [answered] yes — use regex that covers both `^\.goals/` and `/\.goals/`

2. **what if a bot legitimately needs to read goal files for debug?**
   - [answered] use `goal.memory.get` skill — can enhance with `--format yaml` later

3. **should enqueued goals soft-block or just remind?**
   - [wisher] confirm: enqueued = exit 0 (remind), inflight = exit 2 (soft block)
```

---

## summary

**questions triaged:**
- 2 answered via logic
- 1 needs wisher confirmation
- 1 assumption needs research (exit 2 semantics)

**action:** update the vision to reflect these triage results.

🦉 questions have answers, or will have answers.
