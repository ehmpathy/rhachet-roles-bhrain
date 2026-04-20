# self-review r1: has-questioned-assumptions

## what i found

i identified and questioned every technical assumption in the blueprint.

---

## assumption 1: blocker state file location

**assumption:** store blocker state at `.goals/$branch/.blockers.latest.json`

**what if the opposite were true?** what if we stored it in memory only, or in a different location?

**evidence:** the wish says "just like the route.drive has a blockers.json" — route.drive stores at `.route/.drive.blockers.latest.json`. the parallel pattern is explicit.

**could a simpler approach work?** memory storage would lose state across sessions, which defeats the purpose of persistence across compaction. the file location mirrors route.drive exactly.

**verdict:** holds — explicit pattern from wish, mirrors extant code.

---

## assumption 2: scope validation should fail-fast

**assumption:** if bound to route and user passes `--scope repo`, fail-fast with error.

**what if the opposite were true?** what if we just warn and proceed with route scope?

**evidence:** wish 2 says "discourage use of --scope repo. scope should be automatic." the vision document says "fail-fast if --scope repo while bound to route."

**could a simpler approach work?** a warn-without-fail would be simpler but wouldn't "discourage" effectively. fail-fast is the pit-of-success pattern.

**verdict:** holds — vision explicitly says fail-fast.

---

## assumption 3: two escalation tiers are sufficient

**assumption:** only 2 tiers needed: count < 5 (gentle) and count >= 5 (escalated).

**what if the opposite were true?** what if we needed more granular escalation (3, 4, 5+ tiers)?

**evidence:** wish 4 says "after 5 repeated blocks it makes it clearer and clearer". the threshold is 5, not gradual. the wish implies binary: before 5 = gentle, at/after 5 = escalated.

**could a simpler approach work?** 2 tiers is already the simpler approach. 3 tiers would add complexity without wish mandate.

**verdict:** holds — 2 tiers matches wish text.

---

## assumption 4: reset blocker count when goal fulfilled

**assumption:** blocker count resets when a goal is marked fulfilled.

**what if the opposite were true?** what if count persisted even after fulfillment?

**evidence:** criteria says "when brain fulfills a goal after reminders, then blockers count resets for that goal, then next reminder is gentle again." the reset is explicit in criteria.

**could a simpler approach work?** no-reset would mean escalation persists forever. that contradicts criteria and would be punitive.

**verdict:** holds — criteria explicitly requires reset.

---

## assumption 5: unknown arg validation via allowlist

**assumption:** validate args against an allowlist of known flags.

**what if the opposite were true?** what if we only blocked specific dangerous flags?

**evidence:** wish 6 says "forbid unknown args... unknown keys -> failfast". the wish says unknown = fail, not specific-bad = fail.

**could a simpler approach work?** blocklist would require maintenance as bad patterns emerge. allowlist is simpler: only known flags pass.

**verdict:** holds — allowlist is simpler and matches wish intent.

---

## assumption 6: separate GOAL_STATUS_CHOICES constant needed

**assumption:** we need a runtime array separate from the type.

**what if the opposite were true?** what if TypeScript provided runtime type reflection?

**evidence:** TypeScript types are erased at compile time. this is a fundamental language constraint, not an architecture choice. we cannot iterate over union type members at runtime.

**could a simpler approach work?** no simpler approach exists. the type and array must be kept in sync manually (or via `as const` inference).

**verdict:** holds — TypeScript language constraint.

---

## assumption 7: onBoot hook fires after compaction

**assumption:** onBoot hook will fire after context compaction to refresh goal state.

**what if the opposite were true?** what if onBoot only fires at session start?

**evidence:** checked rhachet documentation. onBoot fires at session resumption, which includes post-compaction resumption. the assumption is correct per rhachet semantics.

**could a simpler approach work?** no simpler hook exists for post-compaction refresh. onBoot is the designated mechanism.

**verdict:** holds — matches rhachet hook semantics.

---

## assumption 8: help output should be comprehensive

**assumption:** help output includes examples, all fields, best practices.

**what if the opposite were true?** what if we kept help minimal (just flags)?

**evidence:** wish 7 says "super duper clear how to use the operation with best practices and examples included". the wish explicitly requires comprehensive help.

**could a simpler approach work?** minimal help would be simpler but directly contradicts wish text.

**verdict:** holds — wish requires comprehensive help.

---

## assumption 9: flags one-by-one is recommended over stdin yaml

**assumption:** flags one-by-one should be the recommended pattern.

**what if the opposite were true?** what if stdin yaml was easier?

**evidence:** vision says "flags one-by-one (recommended — increases focus on each component)". the recommendation is explicit in vision.

**could a simpler approach work?** stdin yaml is fewer keystrokes but the vision chose flags deliberately for cognitive benefits.

**verdict:** holds — vision made explicit recommendation with rationale.

---

## issues found: none

all assumptions traced to explicit wish, criteria, or vision statements. no hidden assumptions based on habit rather than evidence.

---

## summary

| assumption | evidence | verdict |
|------------|----------|---------|
| blocker file location | wish: "just like route.drive" | holds |
| scope fail-fast | vision: "fail-fast if --scope repo" | holds |
| 2 escalation tiers | wish: "after 5 repeated blocks" | holds |
| reset on fulfillment | criteria: explicit reset requirement | holds |
| allowlist validation | wish: "forbid unknown" | holds |
| GOAL_STATUS_CHOICES | TypeScript language constraint | holds |
| onBoot post-compaction | rhachet hook semantics | holds |
| comprehensive help | wish: "super duper clear" | holds |
| flags recommended | vision: explicit with rationale | holds |

0 issues found. all 9 assumptions traced to evidence.
