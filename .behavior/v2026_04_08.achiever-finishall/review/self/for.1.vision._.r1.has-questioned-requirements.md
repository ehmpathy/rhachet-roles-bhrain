# self-review: has-questioned-requirements

## review of 1.vision.md

---

## requirement 1: `goal.triage.next --when hook.onStop`

**who said this was needed?**
the wisher, in the wish file. they want bots to see which goals to focus on next at session end.

**what evidence supports this requirement?**
- bots currently have an `onStop` hook (`goal.infer.triage`) but it checks for *uncovered asks*, not *unfinished goals*
- the gap: a bot could have covered all asks (created goals) but still have goals in `inflight` or `enqueued` state
- without this, bots can legitimately end sessions with unfinished work

**what if we didn't do this — what would happen?**
bots would create goals but not always finish them. the goal system would track work but not enforce completion. accountability would be partial.

**is the scope too large, too small, or misdirected?**
scope feels right. the skill is simple: enumerate goals, filter by status, output treestruct. the exit codes (0 vs 2) provide the right nudge/block semantics.

**could we achieve the goal in a simpler way?**
we could enhance the extant `goal.infer.triage` skill instead of create a new one. but that skill has a different purpose (detect uncovered asks). separate concerns = separate skills. this is the right approach.

**verdict:** requirement holds ✓

---

## requirement 2: protection hook for `.goals/` directory

**who said this was needed?**
the wisher, explicitly. "no rm's via bash, no Reads or Writes or Edits... bots cant say 'i dont want to' and delete all their goals"

**what evidence supports this requirement?**
- bots have full file system access via claude code tools
- a malicious or lazy bot could `rm -rf .goals/` to erase its commitments
- the wish provides a clear scenario: bot avoids tedious task by delete of goals

**what if we didn't do this — what would happen?**
the `goal.triage.next` hook would still work — but bots could bypass it by delete goals first. the accountability system would have a backdoor.

**is the scope too large, too small, or misdirected?**
the scope might be too large. the vision proposes to block ALL access (Read, Write, Edit, bash). but...
- should we block Read? bots might legitimately want to inspect goal state for context
- the skills (`goal.memory.get`) provide read access, so block of Read tool is defensible
- but this is still aggressive

**could we achieve the goal in a simpler way?**
we could block only *destructive* operations (rm, mv, Edit, Write) and allow Read. but then a bot could read files to find what to manipulate via other means.

actually, re-read the wish: "no rm's via bash, no Reads or Writes or Edits". the wisher explicitly includes Reads. so this is intentional.

**verdict:** requirement holds ✓ (with note: aggressive by design)

---

## requirement 3: exit code semantics (0 vs 2)

**who said this was needed?**
not explicitly in the wish. i inferred it from the pattern `--when hook.onStop` and the distinction between "remind" vs "block".

**what evidence supports this requirement?**
- exit 0 = success = hook passes = session can end
- exit 2 = constraint = user must fix before proceed
- inflight goals = bot started work = should finish before leave
- enqueued goals = bot queued work = reminder is enough

**what if we didn't do this — what would happen?**
without exit codes:
- all cases would exit 0 → no enforcement, just a message
- all cases would exit 2 → too aggressive for enqueued (just reminders)

**is the scope too large, too small, or misdirected?**
this might be misdirected. the wisher didn't specify exit code behavior. they just said "show which goals to focus on next".

but exit codes are how hooks communicate. without exit 2, the hook is toothless.

**could we achieve the goal in a simpler way?**
we could always exit 0 and just print the message. but that defeats the purpose of "finishall" — bots could still abandon inflight work.

**verdict:** requirement holds ✓ (implicit in "finishall" semantics)

---

## meta-question: are there requirements i've added that weren't asked?

1. **treestruct output format** — not explicit in wish, but wish says "conform to stdout vibes of extant skills". so this is derived, not added.

2. **owl wisdom header** — same, derived from extant skill vibes.

3. **scope detection (repo vs route)** — derived from extant achiever patterns. goals live in `.goals/branch/` for repo scope or `.behavior/.../goals/` for route scope.

4. **condensed vs full output** — i propose condensed for hook mode. not explicit in wish but reasonable for hook output.

---

## issues found and fixed

none — the requirements all hold upon question.

---

## summary

all requirements trace to either:
- explicit wisher ask (protection hook, onStop hook)
- derived from extant patterns (treestruct, owl vibes, scope)
- implicit in "finishall" semantics (exit codes for enforcement)

no requirements were fabricated without basis. the vision is well-grounded. 🦉
