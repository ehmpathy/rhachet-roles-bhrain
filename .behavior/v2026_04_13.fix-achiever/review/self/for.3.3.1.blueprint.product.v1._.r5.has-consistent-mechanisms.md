# self-review r5: has-consistent-mechanisms

## what i found

i re-reviewed the blueprint mechanisms with deeper searches against extant codebase patterns. all mechanisms either replicate extant patterns or fill gaps where no extant mechanism exists.

---

## deeper search results

### search 1: emit* function pattern in goal.ts

**searched:** `grep -n "^export const emit\|^const emit" src/contract/cli/goal.ts`

**found:**
- `emitOwlHeader` (line 39)
- `emitSubBucket` (line 71)
- `emitGoalFull` (line 101)
- `emitGoalCondensed` (line 165)

**blueprint proposes:** `emitValidationError()`, `emitHelpOutput()`

**analysis:** blueprint follows extant `emit*` pattern. consistent.

---

### search 2: BadRequestError usage

**searched:** `grep -rn "BadRequestError" src/`

**found:** used in domain.operations for validation errors, e.g., `BadRequestError.throw('...')` pattern

**blueprint proposes:** use BadRequestError for unknown flags, invalid status

**analysis:** consistent with extant error pattern.

---

### search 3: owl vibe phrases

**searched:** extant goal.ts output

**found (line 39-42):**
```ts
export const emitOwlHeader = (input: { title: string; vibe: string }) => {
  console.log(`\n🦉 ${input.vibe}`);
  console.log(`\n🐚 ${input.title}`);
```

**blueprint proposes:** vibe phrases like "bummer, friend" for errors, "patience, friend" for reminders

**analysis:** consistent with extant owl vibe pattern.

---

### search 4: treestruct error output

**searched:** route.ts error outputs

**found (route.ts lines 200-210):** errors use treestruct with `└─ ✋` prefix for blockers

**blueprint proposes:** `└─ ✋ unknown flag: --foo`

**analysis:** consistent with extant treestruct error pattern.

---

### search 5: yaml key validation

**searched:** `grep -rn "unknown.*key\|invalid.*key" src/`

**found:** no extant yaml key validation pattern in goal.ts

**blueprint proposes:** `collectUnknownKeys()`, `validateUnknownKeys()`

**analysis:** new mechanism fills gap. no duplication.

---

### search 6: printHelp vs emitHelp

**searched:** route.ts help functions

**found (route.ts lines 102-149):**
```ts
const printGetHelp = () => { console.log(...) }
const printSetHelp = () => { console.log(...) }
const printJudgeHelp = () => { console.log(...) }
```

**potential inconsistency:** route.ts uses `print*Help()`, blueprint proposes `emitHelpOutput()`

**analysis:** goal.ts already uses `emit*` prefix internally (emitOwlHeader, emitSubBucket, emitGoalFull, emitGoalCondensed). staying with `emit*` is consistent with goal.ts's internal convention. different files can have different conventions.

**verdict:** not inconsistent — goal.ts uses emit*, route.ts uses print*. blueprint follows goal.ts convention.

---

## potential issue: handleHelp function

**blueprint proposes:** `handleHelp()` function to check --help and call `emitHelpOutput()`

**extant pattern:** route.ts has `if (command === 'help')` inline checks, not a `handle*` function

**analysis:** `handle*` is a common pattern for flag handlers. not inconsistent with route.ts — just a different (and cleaner) approach. acceptable variation.

---

## summary of mechanism consistency

| mechanism | extant pattern? | consistent? |
|-----------|----------------|-------------|
| GoalBlockerState | DriveBlockerState | yes (intentional parallel) |
| get/set/resetBlockerState | getDrive/setDriveBlockerState | yes (extends) |
| onBoot hook | hooks.onBrain.onTool/onStop | yes (same structure) |
| arg validation | none | N/A (new) |
| emitValidationError | emit* pattern in goal.ts | yes (follows) |
| emitHelpOutput | emit* pattern in goal.ts | yes (follows) |
| handleHelp | inline checks in route.ts | acceptable variation |
| GOAL_STATUS_CHOICES | GoalStatusChoice type | yes (extends) |
| skill headers | .sh header pattern | yes (same structure) |

---

## conclusion

0 inconsistent mechanisms found. all new mechanisms either:
- replicate extant patterns (GoalBlockerState, emit*, hooks)
- fill gaps where no extant mechanism exists (arg validation)
- use acceptable variations (handleHelp function vs inline checks)

