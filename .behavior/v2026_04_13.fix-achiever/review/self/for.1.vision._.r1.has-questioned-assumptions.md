# self-review: has-questioned-assumptions

## assumption 1: brains will respond to hooks

**what we assume:** onStop/onBoot hooks are effective at redirect behavior.

**evidence:** route.drive uses onStop hooks successfully. the escalation pattern (blockers.json) suggests hooks alone weren't enough — escalation was added.

**what if the opposite were true?** if brains ignore hooks entirely, the whole system fails. but evidence suggests hooks work when combined with escalation.

**did the wisher say this?** not explicitly. the wisher asked for "clearer" reminders (item 4), which implies current hooks are noticed but not effective enough.

**conclusion:** holds, but the escalation mechanism is critical to make hooks effective.

---

## assumption 2: structured goals are worth the overhead

**what we assume:** the triage cost (tokens + time) is offset by accountability gains.

**evidence:** the wisher explicitly wants goals to work better. they see value in the system.

**what if the opposite were true?** if overhead exceeds benefit, brains would avoid goals entirely. but the wisher is invest in improve the system, not abandon it.

**exceptions:** for very quick asks ("fix typo"), structured goals may be overkill.

**conclusion:** holds for non-trivial asks. may need a "quick goal" pattern for trivial asks.

---

## assumption 3: automatic scope is always correct

**what we assume:** route-vs-repo detection via `getRouteBindByBranch()` is reliable.

**evidence:** the code checks if the branch is bound to a route. if bound → route scope. if not → repo scope.

**what if the opposite were true?** if scope detection is wrong, goals would be persist in the wrong place. but the logic is simple and deterministic.

**did the wisher say this?** yes, item 2 says "scope should be automatic."

**exceptions:** what if a user wants repo scope while bound to a route? current design doesn't allow override after deprecation.

**conclusion:** holds. edge case (force repo while bound) is rare enough to ignore.

---

## assumption 4: escalation is the right pattern for reminders

**what we assume:** counter-based escalation (like route.drive) will make goals effective.

**evidence:** the wisher explicitly referenced "route.drive has a blockers.json" and wants the same for goals.

**what if the opposite were true?** if escalation annoys brains, they might disable hooks. but route.drive's pattern is proven.

**conclusion:** holds. directly requested by wisher.

---

## assumption 5: unknown args should fail-fast

**what we assume:** silent ignore of unknown args is bad.

**evidence:** common cli pattern. fail-fast prevents silent typo errors.

**what if the opposite were true?** if we silently ignore unknown args, forward compatibility is easier. but the wisher explicitly wants fail-fast (item 6).

**conclusion:** holds. directly requested by wisher.

---

## assumption 6: --help and skill headers are distinct

**what we assume:** skill headers (item 3) and --help output (item 7) serve different purposes.

**evidence:**
- skill headers: static documentation in the .sh file, visible when read the source
- --help output: runtime documentation, visible when invoke the skill

**what if the opposite were true?** we could generate --help from headers. but that's a larger infrastructure change.

**conclusion:** holds for now. future improvement could unify them.

---

## assumption 7: post-compaction refresh is a real gap

**what we assume:** brains lose goal awareness after compaction.

**evidence:** boot.yml fires once at session start. compaction mid-session doesn't re-trigger boot.

**did the wisher say this?** yes, item 5 explicitly asks for onBoot hook.

**what if the opposite were true?** if brains retain goal awareness through compaction, onBoot is unnecessary. but that's not how compaction works — context is compressed.

**conclusion:** holds. compaction is a real gap.

---

## summary

| assumption | verdict | note |
|------------|---------|------|
| 1. brains respond to hooks | holds | escalation makes hooks effective |
| 2. structured goals worth overhead | holds | may need "quick goal" for trivial asks |
| 3. auto scope is correct | holds | edge case (force repo) is rare |
| 4. escalation is right pattern | holds | wisher explicitly requested |
| 5. unknown args should fail-fast | holds | wisher explicitly requested |
| 6. --help and headers are distinct | holds | future: could unify |
| 7. post-compaction refresh needed | holds | compaction is real gap |

one potential improvement identified: consider a "quick goal" pattern for trivial asks where full structure is overkill. this is a future enhancement, not a blocker.
