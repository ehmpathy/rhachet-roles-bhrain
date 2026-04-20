# self-review r6: has-consistent-conventions

## what i found

i performed deeper searches for extant conventions. found one potential name inconsistency and validated it as acceptable.

---

## deeper searches

### search 1: constant name patterns

**searched:** `const [A-Z][A-Z_]+` in src/

**found extant patterns:**
- `GOAL_REQUIRED_FIELDS` (Goal.ts) — DOMAIN_DESCRIPTOR_NOUN
- `FIELD_FLAGS` (goal.ts) — DESCRIPTOR_NOUN
- `OWL_WISDOM` (goal.ts) — DOMAIN_NOUN
- `DEFAULT_BRAIN` (review.ts, reflect.ts) — DESCRIPTOR_NOUN

**blueprint proposes:**
- `GOAL_STATUS_CHOICES` — follows `GOAL_REQUIRED_FIELDS` pattern ✓
- `KNOWN_FLAGS` — follows `FIELD_FLAGS` pattern ✓
- `ALLOWED_YAML_KEYS` — follows `FIELD_FLAGS` pattern ✓

**verdict:** consistent — proposed constants follow extant patterns.

---

### search 2: help function name pattern

**found divergence:**
- route.ts: `printGetHelp()`, `printSetHelp()`, `printJudgeHelp()`
- goal.ts extant: uses `emit*` prefix (emitOwlHeader, emitGoalFull, etc.)
- blueprint: `emitHelpOutput()`

**analysis:** route.ts and goal.ts use different prefixes (`print*` vs `emit*`). this is file-level convention, not codebase-level. goal.ts should stay with `emit*`.

**verdict:** consistent — blueprint follows goal.ts's file-level convention.

---

### search 3: test file suffix pattern

**searched:** `*.test.ts` and `*.integration.test.ts` in src/domain.operations/goal/

**found:**
- `getGoalGuardVerdict.test.ts` (unit test)
- `getGoals.integration.test.ts` (integration test)
- `getTriageState.integration.test.ts` (integration test)
- `setGoal.integration.test.ts` (integration test)

**blueprint proposes:**
- `goal.test.ts` (unit tests in contract/cli/)
- Integration tests for blocker state operations

**analysis:** follows extant pattern — unit tests use `.test.ts`, integration tests use `.integration.test.ts`.

**verdict:** consistent.

---

### search 4: blocker state storage path

**found extant:**
- `.route/.drive.blockers.latest.json` — uses `.` prefix, `.latest.json` suffix

**blueprint proposes:**
- `.goals/$branch/.blockers.latest.json`

**analysis:** follows extant path pattern with `.blockers.latest.json` suffix. uses `.goals/` namespace instead of `.route/` which is domain-appropriate.

**verdict:** consistent.

---

### search 5: error throw pattern

**searched:** `BadRequestError` usage in src/

**found extant:**
```ts
throw new BadRequestError(`invalid scope: ${nextArg}. must be 'route' or 'repo'`, { scope: nextArg });
```

**blueprint proposes:** use BadRequestError for unknown flags, invalid status

**analysis:** follows extant error throw pattern with message + metadata.

**verdict:** consistent.

---

### search 6: flag parse loop pattern

**found extant (goal.ts lines 332-371):**
```ts
for (let i = 0; i < args.length; i++) {
  const arg = args[i] as string;
  const nextArg = args[i + 1];
  if (arg === '--scope' && nextArg) {
    // handle
    i++;
    continue;
  }
  // ... more flags
}
```

**blueprint proposes:** add flag collection + validation after the loop

**analysis:** extends extant loop pattern without change. adds validation step after.

**verdict:** consistent — extends without refactor.

---

## potential issue investigated: status validation location

**question:** should status validation happen in Goal.ts or goal.ts?

**extant:** `GoalStatusChoice` type is in Goal.ts. validation would need runtime check.

**blueprint proposes:** `GOAL_STATUS_CHOICES` array in Goal.ts, validation in goal.ts CLI layer

**analysis:** this follows the pattern of `GOAL_REQUIRED_FIELDS` which is in Goal.ts and used by CLI. the array belongs with the type, validation belongs with CLI.

**verdict:** consistent — correct separation of concerns.

---

## summary

| convention | extant | blueprint | consistent? |
|------------|--------|-----------|-------------|
| constant names | GOAL_*, FIELD_*, etc | GOAL_STATUS_CHOICES, KNOWN_FLAGS | yes |
| help functions | emit* in goal.ts | emitHelpOutput | yes |
| test suffixes | .test.ts, .integration.test.ts | follows | yes |
| storage paths | .drive.blockers.latest.json | .blockers.latest.json | yes |
| error pattern | BadRequestError with metadata | follows | yes |
| flag parse loop | for/if/continue | extends | yes |
| validation location | array in domain, check in cli | follows | yes |

0 name divergences found after deeper review. all proposed names and patterns follow extant conventions.

