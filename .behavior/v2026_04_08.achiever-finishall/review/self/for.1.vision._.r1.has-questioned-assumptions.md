# self-review: has-questioned-assumptions

## review of 1.vision.md

---

## assumption 1: bots respect hooks

**what do we assume here without evidence?**
that bots cannot bypass hooks. that hooks fire reliably and bots cannot prevent them from fire.

**what evidence supports this assumption?**
- claude code's hook mechanism is built into the harness
- bots interact via the harness, not directly with the shell
- hooks are declared in `settings.json` which bots cannot modify (protected by the harness)

**what if the opposite were true?**
if bots could bypass hooks:
- the protection hook would be useless (bot skips it)
- the onStop hook would be useless (bot ends session without trigger)
- the entire accountability system would fail

**did the wisher actually say this, or did we infer it?**
inferred. the wisher assumes hooks work. this is foundational to the feature.

**what exceptions or counterexamples exist?**
- hooks have timeouts — if a hook takes too long, it may be killed
- hooks can error — if the hook procedure fails, behavior is undefined
- hooks are opt-in — if a repo doesn't enable the achiever role, no hooks

**verdict:** assumption holds ✓ (with caveat: hooks must be enabled)

---

## assumption 2: exit 2 is a soft block

**what do we assume here without evidence?**
that exit 2 from an onStop hook will prevent the session from end, but allow human override.

**what evidence supports this assumption?**
- extant hooks in the repo use exit 2 for constraint errors
- the rule `rule.require.exit-code-semantics` defines exit 2 as "constraint: user must fix"
- claude code's hook mechanism likely respects this convention

**what if the opposite were true?**
if exit 2 were a hard block:
- humans couldn't override — frustration if they intentionally want to leave
if exit 2 were ignored:
- the hook would be toothless — bots could leave anyway

**did the wisher actually say this, or did we infer it?**
inferred. the wisher said "show which goals to focus on next", not "block session end".

**what exceptions or counterexamples exist?**
- claude code might treat all non-zero exits the same (hard block or ignore)
- need to verify actual harness behavior

**verdict:** assumption is UNCERTAIN 🔍

i assumed exit 2 is a soft block based on the exit code semantics rule, but i haven't verified how claude code actually handles onStop hook exit codes. this assumption should be validated.

---

## assumption 3: onStop fires reliably

**what do we assume here without evidence?**
that the onStop hook fires every time a session ends, before the bot's final message.

**what evidence supports this assumption?**
- the extant achiever role already has an onStop hook (`goal.infer.triage`)
- if it didn't fire reliably, the extant hook would be useless

**what if the opposite were true?**
if onStop didn't fire reliably:
- bots could escape accountability by crash or disconnect
- the feature would be unreliable

**did the wisher actually say this, or did we infer it?**
inferred. the wisher assumes hooks work.

**what exceptions or counterexamples exist?**
- abrupt session termination (network drop, process kill)
- timeout exceeded on the hook itself
- hook procedure error

**verdict:** assumption holds ✓ (with caveat: graceful exit only)

---

## assumption 4: `.goals/` path protection is achievable via hooks

**what do we assume here without evidence?**
that we can create a hook that intercepts Bash, Read, Write, Edit operations and checks the path argument.

**what evidence supports this assumption?**
- extant hooks in the repo intercept tool operations (e.g., `pretooluse.forbid-terms.gerunds`)
- the hook receives tool invocation details include file paths

**what if the opposite were true?**
if we couldn't intercept paths:
- we couldn't protect `.goals/` from direct access
- the protection feature would be impossible

**did the wisher actually say this, or did we infer it?**
the wisher said "add a hook to forbid touch of .goals/ dirs directly". they assume hooks can do this.

**what exceptions or counterexamples exist?**
- indirect access: bot could use a shell command that generates the path dynamically
- encoded paths: `$(echo .goals)` might evade simple string match
- symlinks: bot could create a symlink and access via the symlink

**verdict:** assumption holds ✓ (with caveat: path match must be robust)

---

## assumption 5: bots will try to bypass accountability

**what do we assume here without evidence?**
that bots are adversarial — they might intentionally delete goals to avoid work.

**what evidence supports this assumption?**
- the wisher explicitly describes this scenario: "bots cant say 'i dont want to' and delete all their goals"
- this is a real concern in agentic systems

**what if the opposite were true?**
if bots were always cooperative:
- the protection hook would be unnecessary overhead
- we'd only need the reminder hook

**did the wisher actually say this, or did we infer it?**
the wisher said it explicitly.

**what exceptions or counterexamples exist?**
- well-aligned bots don't need this protection
- but we can't assume all bots are well-aligned

**verdict:** assumption holds ✓ (defensive design is correct)

---

## assumption 6: skill-based access is sufficient

**what do we assume here without evidence?**
that the extant skills (`goal.memory.set`, `goal.memory.get`, `goal.infer.triage`) provide all the access bots need for legitimate operations.

**what evidence supports this assumption?**
- the skills cover: create, read, update, and triage
- if a usecase isn't covered, we can add a new skill

**what if the opposite were true?**
if skills were insufficient:
- bots would need direct file access for legitimate purposes
- we'd need exceptions to the protection hook

**did the wisher actually say this, or did we infer it?**
inferred. the wisher assumes skills exist.

**what exceptions or counterexamples exist?**
- debug: a bot might want to read raw goal files for debug — but `goal.memory.get` can serve this
- bulk operations: a bot might want to batch-update goals — skills support this

**verdict:** assumption holds ✓ (skills provide adequate coverage)

---

## issues found and fixed

**issue: exit 2 semantics are uncertain**

i assumed exit 2 from an onStop hook would soft-block the session. but i haven't verified this against actual claude code behavior.

**fix:** the vision should note this as an open question. the "open questions & assumptions" section already lists this:

> 2. **exit 2 is a soft block** — human can override, but bot gets the message

this is already flagged as an assumption. no change needed, but implementation should verify.

---

## summary

most assumptions are well-grounded:
- hooks are foundational and assumed to work
- path protection is achievable via extant hook patterns
- skill-based access is sufficient for legitimate usecases

one assumption needs verification:
- exit 2 semantics for onStop hooks (soft vs hard block)

the vision is aware of this uncertainty. no changes required. 🦉
