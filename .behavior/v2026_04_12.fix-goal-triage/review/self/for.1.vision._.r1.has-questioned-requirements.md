# self-review: has-questioned-requirements

## requirement 1: actionable output per incomplete goal

**who said this was needed?**
the wisher, in `0.wish.md`: "that's not an actionable response for a brain when they call `goal.infer.triage`. it should tell them how to complete the goals"

**what evidence supports this?**
the current output shows "absent: why.purpose, why.benefit, ..." but doesn't tell the brain what command to run. the brain must read help text or search to discover `rhx goal.memory.set --slug ... --field ... --value ...`.

**what if we didn't do this?**
brains would continue to need external knowledge to complete goals. the triage output would remain descriptive but not actionable.

**is the scope too large, too small, or misdirected?**
scope is appropriate. one command per goal, for the first absent field. not too much, not too minimal.

**could we achieve the goal in a simpler way?**
alternatives:
- link to docs instead of command — worse, adds indirection
- show all fields at once — too much at once
- current approach (one field, copy-paste ready) is simplest actionable path

**verdict**: requirement holds. ✓

---

## requirement 2: flag rename `--mode` → `--when`

**who said this was needed?**
the wisher, in `0.wish.md`: "also, `goal.infer.triage --mode hook.onStop` -> `goal.infer.triage --when hook.onStop` (its a new convention we've adopted)"

**what evidence supports this?**
`goal.triage.next` already uses `--when hook.onStop`. consistency matters for brains who learn the skill vocabulary.

**what if we didn't do this?**
inconsistency: some skills use `--mode`, some use `--when`. brains must remember which is which.

**is the scope too large, too small, or misdirected?**
scope is minimal: rename one flag in one skill. also update the Role hook command.

**could we achieve the goal in a simpler way?**
could alias `--mode` to `--when` for backward compat. noted in vision as open question.

**verdict**: requirement holds. ✓

---

## requirement 3: verify achiever hooks are registered

**who said this was needed?**
the wisher, in `0.wish.md`: "also, are the achiever hooks registered into the Role.build?"

**what evidence supports this?**
verified in `getAchieverRole.ts` — hooks ARE registered:
- `goal.guard` on onTool
- `goal.infer.triage --mode hook.onStop` on onStop (needs --when fix)
- `goal.triage.next --when hook.onStop` on onStop

**what if we didn't do this?**
if not verified, we might duplicate work or miss that hooks need an update.

**is the scope too large, too small, or misdirected?**
scope is appropriate. verification + note that `--mode` → `--when` fix is needed.

**could we achieve the goal in a simpler way?**
already as simple as possible — just verification.

**verdict**: requirement holds. ✓

---

## summary

all three requirements in the wish are justified:
1. actionable output — fills real gap in brain UX
2. flag rename — consistency with other skills
3. hook verification — confirmed registered, noted fix needed

no requirements to remove or simplify further.
