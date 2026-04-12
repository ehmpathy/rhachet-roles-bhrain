# self-review r2: has-questioned-questions

## triage of open questions

### question 1: alias `--mode` to `--when` for backward compat, or hard break?

**can this be answered via logic now?**
yes. this is an internal hook command used by the achiever role. the only consumer is `getAchieverRole.ts` which we control. a hard break is safe because:
- we update the hook command in the same PR
- no external consumers rely on `--mode`
- cleaner than two flag names in perpetuity

**verdict**: [answered] — hard break is safe. update hook command and shell header in same PR.

---

### question 2: `--value "..."` placeholder vs `--value @stdin`?

**can this be answered via logic now?**
yes. the purpose of a command is copy-paste ease. `--value "..."` is:
- immediately copy-pasteable
- brain fills in the value inline
- no extra step to pipe content

`--value @stdin` adds complexity:
- requires grasp of pipe syntax
- more keystrokes
- overkill for short field values like `why.purpose`

**verdict**: [answered] — use `--value "..."` as placeholder. simpler UX wins.

---

### question 3: show commands for ALL absent fields, or just the first?

**can this be answered via logic now?**
yes. to show one field at a time:
- reduces cognitive load
- creates natural checkpoint (re-run triage to verify)
- prevents mistakes from copy-paste fatigue

to show all commands:
- too much for goals with 5+ absent fields
- brain might skip steps or make errors
- no verification between steps

**verdict**: [answered] — show first absent field only. brain re-runs triage after each field.

---

### question 4: confirm `--when` flag rename is desired

**does only the wisher know the answer?**
no. the wisher already stated in 0.wish.md:

> also, `goal.infer.triage --mode hook.onStop` -> `goal.infer.triage --when hook.onStop`
> (its a new convention we've adopted)

**verdict**: [answered] — wisher already confirmed. `--when` is the correct convention.

---

### question 5: confirm one-command-at-a-time UX

**can this be answered via logic now?**
yes. as reasoned in question 3, one command at a time is better UX. this matches the incremental workflow of behavior routes: one stone at a time, one review at a time.

**verdict**: [answered] — one command at a time. consistent with incremental workflow.

---

### question 6: placeholder style `--value "..."` vs `--value "<purpose here>"`

**can this be answered via logic now?**
yes. both work, but:
- `"..."` is minimal, universally understood as "fill this in"
- `"<purpose here>"` is more instructive but longer
- risk with `<brackets>` is brains might include the brackets literally

**verdict**: [answered] — use `--value "..."` for minimal, clear placeholder.

---

## summary

all questions triaged as [answered]:

| question | decision |
|----------|----------|
| mode to when: hard break or alias? | hard break (we control consumers) |
| value placeholder style? | `--value "..."` |
| all fields or first only? | first only |
| confirm --when? | already confirmed by wisher |
| confirm one-at-a-time? | yes, matches incremental workflow |
| bracket style? | no, use `"..."` |

no questions remain for [research] or [wisher]. all resolved via logic and wisher's prior statements.

---

## update vision

the vision's "open questions & assumptions" section should be updated to reflect these answers. the questions are now resolved.
