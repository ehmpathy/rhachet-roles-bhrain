# self-review r2: has-questioned-assumptions

## what i found

i questioned additional assumptions about file placement and decomposition that were not traced to explicit wish or vision statements.

---

## assumption 10: GoalBlocker ops in domain.operations/goal/

**assumption:** place get/set/reset GoalBlockerState in `domain.operations/goal/`.

**what if the opposite were true?** what if we placed them in `domain.operations/achiever/` or `domain.operations/route/`?

**evidence:** DriveBlockerState operations live in `domain.operations/route/drive/`. goals are achiever-specific, not route-generic. but `domain.operations/goal/` already exists and contains goal operations.

**could a simpler approach work?** extant structure has `domain.operations/goal/` for goal ops. follow extant pattern.

**verdict:** holds — follows extant directory structure.

---

## assumption 11: blocker state separate from goal yaml

**assumption:** store blocker count in `.blockers.latest.json`, not in individual goal yaml files.

**what if the opposite were true?** what if each goal tracked its own reminder count?

**evidence:** DriveBlockerState is centralized, not per-stone. the wish says "just like the route.drive has a blockers.json" — singular file, not per-stone.

**could a simpler approach work?** centralized is simpler — one file to read, one file to write. per-goal would require scan and aggregate.

**verdict:** holds — matches DriveBlockerState pattern and wish text.

---

## assumption 12: new GoalBlocker vs reuse DriveBlocker

**assumption:** create new `GoalBlocker.ts` rather than reuse `DriveBlocker.ts`.

**what if the opposite were true?** what if we reused DriveBlocker with generic fields?

**evidence:** DriveBlockerState has `{ count, stone }`. goals would need `{ count, goalSlug }`. the semantic field differs: `stone` vs `goalSlug`. cross-domain reuse would couple unrelated domains.

**could a simpler approach work?** separate domain literals with parallel structure is idiomatic. link across domains would add confusion.

**verdict:** holds — separate domain literals for separate domains.

---

## assumption 13: collect-then-validate pattern

**assumption:** collect all unknown flags/keys first, then emit error with full list.

**what if the opposite were true?** what if we fail-fast on first unknown?

**evidence:** better UX to show all errors at once. user fixes all issues in one pass. fail-on-first requires multiple retries.

**could a simpler approach work?** fail-on-first is simpler code but worse UX. collect-then-validate is marginally more complex but much better UX.

**verdict:** holds — better UX justifies slight complexity.

---

## assumption 14: GOAL_STATUS_CHOICES as const array

**assumption:** export choices as `const` array for runtime validation.

**what if the opposite were true?** what if we used a Set or Object.keys()?

**evidence:** array with `as const` enables both runtime iteration and type inference. Set would work but array is simpler. Object.keys would require an object definition.

**could a simpler approach work?** array is the simplest form that supports both runtime and compile-time use.

**verdict:** holds — array is simplest dual-purpose solution.

---

## assumption 15: onBoot hook via getAchieverRole.ts

**assumption:** add onBoot hook in the role definition, not in boot.yml.

**what if the opposite were true?** what if boot.yml handled post-compaction refresh?

**evidence:** boot.yml boots briefs and skill docs at session start. onBoot hook fires after compaction. they are different events. role definition is where hooks are registered per rhachet pattern.

**could a simpler approach work?** no — boot.yml cannot fire on compaction events. hooks.onBrain.onBoot is the designated mechanism.

**verdict:** holds — matches rhachet hook architecture.

---

## assumption 16: skill headers in .sh files, not separate docs

**assumption:** update headers directly in shell skill files.

**what if the opposite were true?** what if we maintained separate documentation?

**evidence:** skill headers serve as inline documentation. separate docs would drift from implementation. single source of truth is in the shell file.

**could a simpler approach work?** inline headers are the simplest approach — no sync needed.

**verdict:** holds — single source of truth.

---

## assumption 17: escalation resets per goal, not globally

**assumption:** when a goal is fulfilled, reset blocker count for that goal only.

**what if the opposite were true?** what if fulfillment reset all blocker counts?

**evidence:** criteria says "when brain fulfills a goal after reminders, then blockers count resets for that goal." the phrase "for that goal" indicates per-goal reset, not global.

**could a simpler approach work?** global reset would be simpler but contradicts criteria. per-goal is explicit in the requirements.

**verdict:** holds — criteria explicitly says "for that goal".

---

## issues found: none

all 8 additional assumptions traced to extant patterns or explicit requirements.

---

## summary

| assumption | evidence | verdict |
|------------|----------|---------|
| GoalBlocker ops location | extant directory structure | holds |
| centralized blocker state | wish: "just like route.drive blockers.json" | holds |
| new GoalBlocker vs reuse | semantic fields differ, domain separation | holds |
| collect-then-validate | better UX for multi-error | holds |
| const array for choices | simplest dual-purpose solution | holds |
| onBoot in role definition | rhachet hook architecture | holds |
| inline skill headers | single source of truth | holds |
| per-goal reset | criteria: "for that goal" | holds |

0 issues found. all 8 additional assumptions validated.
