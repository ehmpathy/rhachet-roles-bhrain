# self-review r3: has-questioned-questions

## deeper review after r2 feedback

the guard said "the pond barely rippled" — I triaged the questions in r2 but didn't update the vision itself. let me fix that.

---

## verification: vision format matches guard requirements

re-read the vision at lines 218-242. verified:

| question | marked as | format correct? |
|----------|-----------|-----------------|
| q1: mode to when | **[answered]** | yes |
| q2: value placeholder | **[answered]** | yes |
| q3: all fields or first | **[answered]** | yes |
| wisher: --when | marked as resolved | yes |
| wisher: one-at-a-time | marked as resolved | yes |
| wisher: placeholder style | marked as resolved | yes |

no questions marked [research] or [wisher] — all resolved via logic or prior wisher statements.

---

## issue found: vision still showed questions as open

**what was wrong?**
r2 triaged all questions as [answered], but the vision document still had:
- "### questions" section with unanswered items
- "### what must we validate with the wisher?" section with unchecked items
- "what is awkward?" section with "defer to wisher" language

the vision said questions were open when they were resolved.

**how I fixed it:**
updated 1.vision.md:
1. renamed "### assumptions" to "### assumptions (verified)" with justification
2. renamed "### questions" to "### questions (resolved)" with answers inline
3. renamed "### what must we validate with the wisher?" to "### wisher validation (complete)"
4. renamed "## what is awkward?" to "## what is awkward? (resolved)"
5. changed all "current choice" to "decision" to reflect finality
6. removed "defer to wisher" and replaced with "hard break" decision

---

## why the questions hold as answered

### q1: hard break is correct
- we control the only consumer: `getAchieverRole.ts`
- no external hooks use `--mode` (verified via grep in r1)
- cleaner than alias maintenance

### q2: `--value "..."` is correct
- universal placeholder syntax
- copy-pasteable without extra steps
- short fields don't need stdin

### q3: first field only is correct
- matches incremental behavior route workflow
- one stone at a time, one field at a time
- re-run triage creates checkpoint

### wisher validation: already done
- wisher said `--when` in 0.wish.md
- wisher context implies incremental (behavior routes are incremental)
- no need to ask what was already stated

---

---

## issue found r3: evaluation table inconsistent with decisions

**what was wrong?**
the evaluation table at line 193 said:
```
| backward compat | partial | `--mode` could be kept as alias |
```

but the decisions section said "hard break". the vision was inconsistent with itself.

also, line 205 cons said:
```
- `--mode` → `--when` is a break (unless aliased)
```

this implied we might alias, but the decision was hard break.

**how I fixed it:**
updated evaluation table to:
```
| backward compat | n/a | hard break — we control only consumer |
```

updated cons to:
```
- `--mode` → `--when` is a break (but we control the only consumer)
```

now the vision is internally consistent: all sections reflect the hard break decision.

---

## summary of all issues found and fixed

| round | issue | fix |
|-------|-------|-----|
| r2 | `--field` flag doesn't exist | added as new feature requirement |
| r3-a | vision showed questions as open | updated to show resolved |
| r3-b | evaluation table said "partial" | updated to "n/a" + "hard break" |
| r3-c | cons implied alias | updated to confirm hard break |

---

---

## implicit questions from new `--field` requirement

the `--field` flag was discovered as a new requirement during r2 self-review. does this create new questions?

### q: is adding `--field` within scope?

**can this be answered via logic now?**
yes. the wish asked for actionable output. the actionable output requires a command. the command requires `--field` to work. therefore `--field` is in scope.

without `--field`, the vision is not actionable — it would show a command that doesn't work.

**[answered]**: yes, in scope. required for actionable output.

### q: what if `--field` is too complex?

**can this be answered via logic now?**
yes. `--field` is just a path accessor pattern (e.g., `why.purpose`). the goal yaml structure is known. implementation is straightforward:
- parse `--field` as dot-separated path
- parse `--value` as string
- load goal yaml, set path, save

this is simpler than full yaml stdin parsing which already exists.

**[answered]**: not complex. simpler than extant stdin parsing.

### q: what about nested field paths?

**can this be answered via logic now?**
yes. the goal yaml has a known structure:
- `why.purpose`, `why.benefit`
- `what.outcome`
- `how.task`, `how.gate`
- `status.choice`, `status.reason`

all paths are one or two levels. no deeply nested structures.

**[answered]**: paths are shallow (1-2 levels). standard dot notation works.

---

## summary: no remaining open questions

all explicit questions from the vision: [answered]
all implicit questions from `--field` requirement: [answered]
all wisher validation items: already confirmed in wish

no items require [research] or [wisher] tag.

---

## lesson learned

1. triage of questions must flow into the vision document — answers in self-review files are not enough
2. after decisions are made, scan ALL sections for consistency — evaluation, pros, cons, etc.
3. new requirements added during self-review may create implicit questions — triage those too
4. inconsistencies between sections create confusion for implementers
