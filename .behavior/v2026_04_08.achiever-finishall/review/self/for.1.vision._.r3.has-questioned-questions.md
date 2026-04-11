# self-review r3: has-questioned-questions

*deeper into the questions. slow down. breathe.*

---

## re-read the updated vision

let me verify the vision now reflects proper triage:

```markdown
### assumptions

1. **bots respect hooks** — [answered] hooks are enforced by the harness, bots cannot bypass
2. **exit 2 is a soft block** — [research] verify claude code onStop hook exit code behavior
3. **onStop fires reliably** — [answered] proven by extant onStop hook usage in achiever role

### questions for wisher

1. **should protection apply to route-scoped goals too?**
   - [answered] yes — use regex that covers both `^\.goals/` and `/\.goals/`

2. **what if a bot legitimately needs to read goal files for debug?**
   - [answered] use `goal.memory.get` skill — can enhance with `--format yaml` later

3. **when enqueued goals exist (no inflight), should the session be allowed to end?**
   - [wisher] current proposal: yes, with a reminder (exit 0)
   - alternative: no, soft-block until bot starts or triages them (exit 2)
```

**verification:** the vision now has clear triage markers with proper wording. ✓

---

## question-by-question deeper analysis

### question 1: route-scoped protection

**what did we answer?**
protection should cover both:
- `^\.goals/` at repo root
- `/\.goals/` inside `.behavior/`

**is this answer correct?**
wait. let me re-examine the wish:

> "we must add a hook to forbid touch of the .goal/ dirs directly"

the wish says ".goal/" (singular), but our implementation uses ".goals/" (plural).

**is there a discrepancy?**

look at the extant code:
- `getScopeDir()` returns `.goals/${branchFlat}` for repo scope
- for route scope: `${bind.route}/.goals`

the actual directory is `.goals/` (plural). the wish has a typo: ".goal/" vs ".goals/".

**verdict:** answer is correct. protect `.goals/` (plural). the wish had a typo.

---

### question 2: debug access to raw yaml

**what did we answer?**
use `goal.memory.get` skill.

**is this sufficient?**

the skill outputs treestruct format. if a bot needs raw yaml for comparison or diff, treestruct won't work.

**but wait:** why would a bot need raw yaml?
- to compare with another yaml file? no, use domain comparison
- to debug parse errors? the skill would show the error
- to see the exact file contents? legitimate debug need

**reconsidered answer:**
for now, the skill suffices. if a real need emerges, add `--format yaml` flag. this is a YAGNI case — we don't need it until we do.

**verdict:** answer holds. defer enhancement until real need.

---

### question 3: enqueued exit code

**what did we answer?**
[wisher] — needs confirmation.

**is this the right triage?**

the wisher's exact words:
> "if any inflight, show only inflight"
> "if any enqueued, show only enqueued"

this specifies *what to show*, not *whether to block*.

the distinction between exit 0 and exit 2 is an implementation detail. the wisher may not care about exit codes — they care about behavior.

**refined question for wisher:**
"when the bot has enqueued goals but no inflight goals, should the session be allowed to end (with a reminder) or blocked (until the bot starts or triages them)?"

**verdict:** question needs clearer wording. **updated the vision.**

---

### assumption 2: exit 2 semantics

**what did we mark?**
[research] — verify claude code behavior.

**where should we look?**
- claude code documentation
- extant hooks that use exit 2
- empirical test

**can we answer now via extant code?**

look at extant hooks in this repo that exit 2:
- `pretooluse.forbid-terms.gerunds` exits 2 when blocked
- the message goes to stderr and the tool call is blocked

for onStop, the behavior might be different. the session is about to end — what does exit 2 do?

**hypothesis:** exit 2 from onStop shows the message but doesn't hard-block the session end. the human sees it and can choose to continue or not.

**verdict:** [research] is correct. we need to verify empirically or via docs.

---

## issues found and fixed

**issue 1:** question 3 needs clearer wording

the question asks about "soft-block vs remind" but should ask about behavior:
> "when enqueued goals exist, should the session be allowed to end?"

**fix:** updated the vision to clarify the question. ✓

---

## verified vision update

the vision now reads:
```
3. **when enqueued goals exist (no inflight), should the session be allowed to end?**
   - [wisher] current proposal: yes, with a reminder (exit 0)
   - alternative: no, soft-block until bot starts or triages them (exit 2)
```

this is clearer than the previous "soft-block vs remind" wording.

---

## summary

**issues found and fixed:**
- question 3 wording was unclear → fixed: vision now asks about behavior, not exit codes

**non-issues confirmed:**
- answer 1 holds: protect `.goals/` (plural), not `.goal/` (typo in wish)
- answer 2 holds: `goal.memory.get` suffices for now (YAGNI for raw yaml)
- assumption 2 triage correct: [research] for exit 2 semantics

**all questions are now properly triaged:**
- 2 [answered] via logic
- 1 [wisher] needs confirmation
- 1 [research] for exit 2 semantics

🦉 the pond ripples true.
