# self-review: has-questioned-assumptions

## assumption 1: one field at a time is better than all fields

**what do we assume here without evidence?**
that brains prefer to see one command (for the first absent field) and re-run triage, rather than see all 5 commands at once.

**what evidence supports this assumption?**
- cognitive load research: fewer options = faster decisions
- unix philosophy: do one task well
- current behavior-route patterns: one step at a time

**what if the opposite were true?**
if brains prefer all commands at once, they'd be annoyed at the re-run loop. but they could still run commands sequentially from a full list.

**did the wisher actually say this, or did we infer it?**
inferred. the wisher said "tell them how to complete the goals" — could mean one or all.

**verdict**: assumption is reasonable but should be validated with wisher. noted as open question in vision. ✓

---

## assumption 2: `--value "..."` placeholder is clear enough

**what do we assume here without evidence?**
that brains understand `"..."` means "fill in your value here".

**what evidence supports this assumption?**
- common convention in cli docs (e.g., `git commit -m "..."`)
- brains are sophisticated enough to infer placeholder syntax

**what if the opposite were true?**
if brains take `"..."` literally, they'd pass three dots as the value. but this seems unlikely.

**did the wisher actually say this, or did we infer it?**
inferred. wisher didn't specify placeholder format.

**verdict**: assumption is reasonable. could enhance with field-specific hints like `--value "<describe purpose>"` but current choice is simpler. noted in "what is awkward" section. ✓

---

## assumption 3: scope defaults to route when bound

**what do we assume here without evidence?**
that brains typically work within routes, so default scope should be route (not repo).

**what evidence supports this assumption?**
- wisher feedback: "no --scope repo" / "default" / "(typically in route)"
- route-bound work is the primary workflow in behavior-driven development

**what if the opposite were true?**
if brains typically work at repo scope, they'd need to specify `--scope repo` explicitly. but wisher indicated route is default.

**did the wisher actually say this, or did we infer it?**
wisher said it explicitly in follow-up messages.

**verdict**: assumption confirmed by wisher. ✓

---

## assumption 4: `--when` is the correct flag for hook context

**what do we assume here without evidence?**
that `--when hook.onStop` is the correct convention (vs `--mode`, `--context`, `--trigger`).

**what evidence supports this assumption?**
- `goal.triage.next` already uses `--when hook.onStop`
- wisher explicitly said to use `--when`

**did the wisher actually say this, or did we infer it?**
wisher said it explicitly: "`--mode hook.onStop` -> `--when hook.onStop` (its a new convention we've adopted)"

**verdict**: assumption confirmed by wisher. ✓

---

## assumption 5: the achiever hooks are correct as registered

**what do we assume here without evidence?**
that the hook commands and filters are correct (e.g., `goal.guard` on onTool with Read|Write|Edit|Bash filter).

**what evidence supports this assumption?**
- hooks were added in commit 376edb5 with tests and behavior route
- the behavior `v2026_04_08.achiever-finishall` was passed

**what if the opposite were true?**
if hooks had bugs, brains would experience unexpected behavior (e.g., guard not block, triage not halt). but tests cover these cases.

**did the wisher actually say this, or did we infer it?**
wisher asked to verify hooks are registered — we verified. wisher didn't say they're wrong.

**verdict**: assumption supported by tests. the only fix needed is `--mode` → `--when`. ✓

---

## summary

assumptions questioned:
1. one field at a time — reasonable, noted as open question for wisher
2. `--value "..."` placeholder — reasonable, noted in awkward section
3. scope defaults to route — confirmed by wisher
4. `--when` flag convention — confirmed by wisher
5. hooks are correct — supported by tests, only fix is `--mode` → `--when`

no hidden assumptions that invalidate the vision.
